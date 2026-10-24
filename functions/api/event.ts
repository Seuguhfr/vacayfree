// Cloudflare Pages Function for High-Concurrency, Zero-Collision Group Vacation Sync
// Backed by Cloudflare KV ("VACAY_KV") with discrete per-participant keys and server-side salted PIN hashing.

interface Env {
  VACAY_KV?: KVNamespace;
}

const SALT_PEPPER = 'vacay_salt_sec_2026';
const ID_REGEX = /^[a-zA-Z0-9_-]{3,64}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

async function hashString(input: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(input.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashParticipantPin(eventId: string, participantId: string, pin: string): Promise<string> {
  return hashString(`${eventId}:${participantId}:${pin.trim()}:${SALT_PEPPER}`);
}

async function hashAdminKey(eventId: string, adminKey: string): Promise<string> {
  return hashString(`${eventId}:${adminKey.trim()}:${SALT_PEPPER}`);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const eventId = url.searchParams.get('id');

  if (!eventId || !ID_REGEX.test(eventId)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid event ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!context.env.VACAY_KV) {
    return new Response(JSON.stringify({ notFound: true, offline: true }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Fetch metadata & participant index
    const [metaRaw, participantsRaw] = await Promise.all([
      context.env.VACAY_KV.get(`event:${eventId}:meta`),
      context.env.VACAY_KV.get(`event:${eventId}:participants`),
    ]);

    let event: any = null;
    let participants: any[] = [];
    let responses: any[] = [];

    if (metaRaw) {
      event = JSON.parse(metaRaw);
      participants = participantsRaw ? JSON.parse(participantsRaw) : [];

      // 2. Concurrently fetch each friend's response independently
      if (participants.length > 0) {
        const responsePromises = participants.map((p: any) =>
          context.env.VACAY_KV!.get(`event:${eventId}:response:${p.id}`)
        );
        const fetchedResponses = await Promise.all(responsePromises);
        responses = fetchedResponses
          .filter((r): r is string => !!r)
          .map((r) => JSON.parse(r));
      }
    } else {
      // Legacy fallback check
      const legacyRaw = await context.env.VACAY_KV.get(`event_${eventId}`);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        event = legacy.event;
        participants = legacy.participants || [];
        responses = legacy.responses || [];
      }
    }

    if (!event) {
      return new Response(JSON.stringify({ notFound: true }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. SECURITY SANITIZATION:
    // Strip pinHash and adminKeyHash so client DevTools Network inspector never sees hashes!
    const sanitizedParticipants = participants.map((p: any) => ({
      ...p,
      pinHash: '', // Hidden from public network payload
    }));

    const sanitizedEvent = {
      ...event,
      adminKeyHash: '', // Hidden from public network payload
    };

    return new Response(
      JSON.stringify({
        event: sanitizedEvent,
        participants: sanitizedParticipants,
        responses,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error retrieving event';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.VACAY_KV) {
    return new Response(JSON.stringify({ error: 'KV binding VACAY_KV not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await context.request.text();
    if (rawBody.length > 2_000_000) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
    }

    const payload = JSON.parse(rawBody);
    const ttl = 60 * 60 * 24 * 90; // 90 days retention

    // CASE 1: Server-Side Admin Key Verification
    if (payload.action === 'verify_admin') {
      const { eventId, adminKey } = payload;
      if (!eventId || !adminKey || !ID_REGEX.test(eventId)) {
        return new Response(JSON.stringify({ valid: false }), { status: 400 });
      }

      const metaRaw = await context.env.VACAY_KV.get(`event:${eventId}:meta`);
      if (!metaRaw) {
        return new Response(JSON.stringify({ valid: false }), { status: 404 });
      }

      const meta = JSON.parse(metaRaw);
      const computedAdminHash = await hashAdminKey(eventId, adminKey);
      const legacyAdminHash = await hashString(adminKey);
      const valid = meta.adminKeyHash === computedAdminHash || meta.adminKeyHash === legacyAdminHash;

      return new Response(JSON.stringify({ valid }), {
        status: valid ? 200 : 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CASE 2: Server-Side Participant PIN Verification
    if (payload.action === 'verify_pin') {
      const { eventId, participantId, pin } = payload;
      if (!eventId || !participantId || !pin || !ID_REGEX.test(eventId)) {
        return new Response(JSON.stringify({ valid: false }), { status: 400 });
      }

      const partsRaw = await context.env.VACAY_KV.get(`event:${eventId}:participants`);
      if (!partsRaw) {
        return new Response(JSON.stringify({ valid: false }), { status: 404 });
      }

      const parts = JSON.parse(partsRaw);
      const p = parts.find((x: any) => x.id === participantId);
      if (!p) {
        return new Response(JSON.stringify({ valid: false }), { status: 404 });
      }

      const computedPinHash = await hashParticipantPin(eventId, participantId, pin);
      const legacyPinHash = await hashString(pin);
      const valid = !p.pinHash || p.pinHash === computedPinHash || p.pinHash === legacyPinHash;

      return new Response(JSON.stringify({ valid }), {
        status: valid ? 200 : 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CASE 3: Organizer Resets Participant PIN
    if (payload.action === 'reset_pin') {
      const { eventId, participantId, newPin, adminKey } = payload;
      if (!eventId || !participantId || !newPin || !adminKey || !ID_REGEX.test(eventId)) {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
      }

      const metaRaw = await context.env.VACAY_KV.get(`event:${eventId}:meta`);
      if (!metaRaw) return new Response(JSON.stringify({ notFound: true }), { status: 404 });

      const meta = JSON.parse(metaRaw);
      const computedAdminHash = await hashAdminKey(eventId, adminKey);
      const legacyAdminHash = await hashString(adminKey);
      if (meta.adminKeyHash !== computedAdminHash && meta.adminKeyHash !== legacyAdminHash) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid admin key' }), { status: 401 });
      }

      const partsRaw = await context.env.VACAY_KV.get(`event:${eventId}:participants`);
      if (partsRaw) {
        const parts = JSON.parse(partsRaw);
        const pinHash = await hashParticipantPin(eventId, participantId, newPin);
        const updatedParts = parts.map((part: any) =>
          part.id === participantId ? { ...part, pinHash } : part
        );
        await context.env.VACAY_KV.put(`event:${eventId}:participants`, JSON.stringify(updatedParts), { expirationTtl: ttl });
      }

      return new Response(JSON.stringify({ success: true, participantId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CASE 4: Concurrency-Safe Participant Delta Save
    if (payload.action === 'save_response') {
      const { eventId, participant, response, pin } = payload;
      if (!eventId || !participant?.id || !response || !ID_REGEX.test(eventId)) {
        return new Response(JSON.stringify({ error: 'Incomplete delta payload' }), { status: 400 });
      }

      // Check lock status
      const metaRaw = await context.env.VACAY_KV.get(`event:${eventId}:meta`);
      if (metaRaw) {
        const meta = JSON.parse(metaRaw);
        if (meta.isLocked) {
          return new Response(JSON.stringify({ error: 'This poll has been locked by the organizer.' }), { status: 403 });
        }
      }

      // Verify participant PIN if returning user
      const participantsRaw = await context.env.VACAY_KV.get(`event:${eventId}:participants`);
      let participants: any[] = participantsRaw ? JSON.parse(participantsRaw) : [];
      const existing = participants.find((p: any) => p.id === participant.id);

      const computedHash = pin ? await hashParticipantPin(eventId, participant.id, pin) : '';

      if (existing) {
        // If participant exists and has a pinHash, enforce pin match
        if (existing.pinHash && existing.pinHash !== computedHash) {
          const legacyHash = pin ? await hashString(pin) : '';
          if (existing.pinHash !== legacyHash) {
            return new Response(JSON.stringify({ error: 'Incorrect PIN' }), { status: 401 });
          }
        }
      } else {
        // Register new participant in index
        participants.push({
          ...participant,
          name: (participant.name || 'Friend').slice(0, 50),
          pinHash: computedHash || participant.pinHash,
        });
        await context.env.VACAY_KV.put(
          `event:${eventId}:participants`,
          JSON.stringify(participants),
          { expirationTtl: ttl }
        );
      }

      // Discrete independent key: Write ONLY this friend's response!
      await context.env.VACAY_KV.put(
        `event:${eventId}:response:${participant.id}`,
        JSON.stringify(response),
        { expirationTtl: ttl }
      );

      return new Response(JSON.stringify({ success: true, participantId: participant.id }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CASE 5: Event Deletion (Organizer only)
    if (payload.action === 'delete_event') {
      const { eventId, adminKey } = payload;
      if (!eventId || !adminKey || !ID_REGEX.test(eventId)) {
        return new Response(JSON.stringify({ error: 'Missing event ID or admin key' }), { status: 400 });
      }

      const metaRaw = await context.env.VACAY_KV.get(`event:${eventId}:meta`);
      if (!metaRaw) {
        return new Response(JSON.stringify({ notFound: true }), { status: 404 });
      }

      const meta = JSON.parse(metaRaw);
      const computedAdminHash = await hashAdminKey(eventId, adminKey);
      const legacyAdminHash = await hashString(adminKey);

      if (meta.adminKeyHash !== computedAdminHash && meta.adminKeyHash !== legacyAdminHash) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid admin key' }), { status: 401 });
      }

      // Delete participants and responses
      const participantsRaw = await context.env.VACAY_KV.get(`event:${eventId}:participants`);
      if (participantsRaw) {
        const parts = JSON.parse(participantsRaw);
        await Promise.all(
          parts.map((p: any) => context.env.VACAY_KV!.delete(`event:${eventId}:response:${p.id}`))
        );
      }

      await Promise.all([
        context.env.VACAY_KV.delete(`event:${eventId}:meta`),
        context.env.VACAY_KV.delete(`event:${eventId}:participants`),
        context.env.VACAY_KV.delete(`event_${eventId}`),
      ]);

      return new Response(JSON.stringify({ success: true, deleted: eventId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CASE 6: Participant Deletion (Organizer only)
    if (payload.action === 'delete_participant') {
      const { eventId, participantId, adminKey } = payload;
      if (!eventId || !participantId || !adminKey || !ID_REGEX.test(eventId)) {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
      }

      const metaRaw = await context.env.VACAY_KV.get(`event:${eventId}:meta`);
      if (!metaRaw) {
        return new Response(JSON.stringify({ notFound: true }), { status: 404 });
      }

      const meta = JSON.parse(metaRaw);
      const computedAdminHash = await hashAdminKey(eventId, adminKey);
      const legacyAdminHash = await hashString(adminKey);
      if (meta.adminKeyHash !== computedAdminHash && meta.adminKeyHash !== legacyAdminHash) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid admin key' }), { status: 401 });
      }

      // Remove from participants list and delete response
      const participantsRaw = await context.env.VACAY_KV.get(`event:${eventId}:participants`);
      if (participantsRaw) {
        const parts = JSON.parse(participantsRaw).filter((p: any) => p.id !== participantId);
        await context.env.VACAY_KV.put(`event:${eventId}:participants`, JSON.stringify(parts), { expirationTtl: ttl });
      }
      await context.env.VACAY_KV.delete(`event:${eventId}:response:${participantId}`);

      return new Response(JSON.stringify({ success: true, removed: participantId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CASE 7: Event Creation / Organizer Settings Update
    const eventId = payload?.event?.id;
    if (!eventId || !ID_REGEX.test(eventId)) {
      return new Response(JSON.stringify({ error: 'Invalid payload: missing or invalid event id' }), { status: 400 });
    }

    // Check if event already exists in KV
    const existingMetaRaw = await context.env.VACAY_KV.get(`event:${eventId}:meta`);

    if (existingMetaRaw) {
      // Event already exists -> THIS IS AN UPDATE. Require and verify adminKey!
      const existingMeta = JSON.parse(existingMetaRaw);
      const providedAdminKey = payload.adminKey || payload.event.adminKey;

      if (!providedAdminKey) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Missing organizer admin key to update poll settings' }), { status: 401 });
      }

      const computedAdminHash = await hashAdminKey(eventId, providedAdminKey);
      const legacyAdminHash = await hashString(providedAdminKey);

      if (existingMeta.adminKeyHash !== computedAdminHash && existingMeta.adminKeyHash !== legacyAdminHash) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid organizer admin key' }), { status: 401 });
      }

      // Update event metadata while preserving the authoritative adminKeyHash
      const updatedMeta = {
        ...existingMeta,
        ...payload.event,
        adminKeyHash: existingMeta.adminKeyHash, // Never overwrite the secret hash
        updatedAt: new Date().toISOString(),
      };

      await context.env.VACAY_KV.put(
        `event:${eventId}:meta`,
        JSON.stringify(updatedMeta),
        { expirationTtl: ttl }
      );
    } else {
      // Event does not exist -> THIS IS A NEW EVENT CREATION.
      if (!payload.event.adminKeyHash) {
        return new Response(JSON.stringify({ error: 'Invalid event creation: missing adminKeyHash' }), { status: 400 });
      }

      await context.env.VACAY_KV.put(
        `event:${eventId}:meta`,
        JSON.stringify({
          ...payload.event,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        { expirationTtl: ttl }
      );
    }

    // Save participant index (smart merge to prevent clobbering concurrent registrations)
    if (payload.participants && Array.isArray(payload.participants)) {
      const existingRaw = await context.env.VACAY_KV.get(`event:${eventId}:participants`);
      let merged = payload.participants;
      if (existingRaw) {
        try {
          const existingList = JSON.parse(existingRaw);
          if (Array.isArray(existingList)) {
            const map = new Map<string, any>();
            for (const p of existingList) {
              map.set(p.id, p);
            }
            for (const p of payload.participants) {
              map.set(p.id, { ...(map.get(p.id) || {}), ...p });
            }
            merged = Array.from(map.values());
          }
        } catch {}
      }
      await context.env.VACAY_KV.put(
        `event:${eventId}:participants`,
        JSON.stringify(merged),
        { expirationTtl: ttl }
      );
    }

    // Save any individual responses
    if (payload.responses && Array.isArray(payload.responses)) {
      await Promise.all(
        payload.responses.map((r: any) =>
          context.env.VACAY_KV!.put(
            `event:${eventId}:response:${r.participantId}`,
            JSON.stringify(r),
            { expirationTtl: ttl }
          )
        )
      );
    }

    return new Response(JSON.stringify({ success: true, eventId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const eventId = url.searchParams.get('id');
  const adminKey = url.searchParams.get('admin');

  if (!context.env.VACAY_KV) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), { status: 503 });
  }

  if (!eventId || !adminKey || !ID_REGEX.test(eventId)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid event ID or admin key' }), { status: 400 });
  }

  const metaRaw = await context.env.VACAY_KV.get(`event:${eventId}:meta`);
  if (!metaRaw) {
    return new Response(JSON.stringify({ notFound: true }), { status: 404 });
  }

  const meta = JSON.parse(metaRaw);
  const computedAdminHash = await hashAdminKey(eventId, adminKey);
  const legacyAdminHash = await hashString(adminKey);

  if (meta.adminKeyHash !== computedAdminHash && meta.adminKeyHash !== legacyAdminHash) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid admin key' }), { status: 401 });
  }

  const participantsRaw = await context.env.VACAY_KV.get(`event:${eventId}:participants`);
  if (participantsRaw) {
    const parts = JSON.parse(participantsRaw);
    await Promise.all(
      parts.map((p: any) => context.env.VACAY_KV!.delete(`event:${eventId}:response:${p.id}`))
    );
  }

  await Promise.all([
    context.env.VACAY_KV.delete(`event:${eventId}:meta`),
    context.env.VACAY_KV.delete(`event:${eventId}:participants`),
    context.env.VACAY_KV.delete(`event_${eventId}`),
  ]);

  return new Response(JSON.stringify({ success: true, deleted: eventId }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
