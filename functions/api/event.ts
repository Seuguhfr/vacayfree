// Cloudflare Pages Function for High-Concurrency, Zero-Collision Group Vacation Sync
// Backed by Cloudflare D1 ("DB") relational SQLite database with server-side salted PIN hashing.

interface Env {
  DB: D1Database;
  VACAY_KV?: KVNamespace;
}

const SALT_PEPPER = 'vacay_salt_sec_2026';
const ID_REGEX = /^[a-zA-Z0-9_-]{3,64}$/;

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

/**
 * Smart Expiration:
 * Keep the poll alive for the entire planning period and trip,
 * plus 6 months (180 days) after the latest return date (endDate).
 * Minimum retention is always 180 days from the current moment.
 * Returns UNIX timestamp in seconds.
 */
function computeExpiration(endDate?: string): number {
  const SIX_MONTHS_SEC = 180 * 24 * 60 * 60;
  const nowSec = Math.floor(Date.now() / 1000);
  const minExpiration = nowSec + SIX_MONTHS_SEC;

  if (endDate && typeof endDate === 'string') {
    const endTimestamp = Date.parse(`${endDate.trim()}T23:59:59Z`);
    if (!isNaN(endTimestamp)) {
      const endSec = Math.floor(endTimestamp / 1000);
      const targetExpiration = endSec + SIX_MONTHS_SEC;
      return Math.max(minExpiration, targetExpiration);
    }
  }

  return minExpiration;
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

  if (!context.env.DB) {
    return new Response(JSON.stringify({ notFound: true, offline: true }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 0. Non-blocking lazy cleanup for expired polls
    context.env.DB.prepare('DELETE FROM events WHERE expires_at < unixepoch()').run().catch(() => {});

    // 1. Fetch event metadata
    const eventRow = await context.env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(eventId).first<any>();
    if (!eventRow) {
      return new Response(JSON.stringify({ notFound: true }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Concurrently fetch participants & responses
    const [partResult, respResult] = await Promise.all([
      context.env.DB.prepare('SELECT * FROM participants WHERE event_id = ? ORDER BY created_at ASC').bind(eventId).all<any>(),
      context.env.DB.prepare('SELECT * FROM responses WHERE event_id = ?').bind(eventId).all<any>(),
    ]);

    // 3. Format & sanitize data (never expose hashes to the client!)
    const event = {
      id: eventRow.id,
      title: eventRow.title,
      description: eventRow.description || undefined,
      destinationHint: eventRow.destination_hint || undefined,
      startDate: eventRow.start_date,
      endDate: eventRow.end_date,
      defaultDurationDays: eventRow.default_duration_days,
      adminKeyHash: '', // Sanitized for client DevTools security
      isLocked: Boolean(eventRow.is_locked),
      lockedWindow: (eventRow.locked_start_date && eventRow.locked_end_date) ? {
        startDate: eventRow.locked_start_date,
        endDate: eventRow.locked_end_date,
      } : undefined,
      createdAt: eventRow.created_at,
      updatedAt: eventRow.updated_at,
    };

    const participants = (partResult.results || []).map((p: any) => ({
      id: p.id,
      eventId: p.event_id,
      name: p.name,
      color: p.color,
      pinHash: '', // Sanitized for client DevTools security
      createdAt: p.created_at,
    }));

    const responses = (respResult.results || []).map((r: any) => {
      let availability = {};
      try {
        availability = JSON.parse(r.availability || '{}');
      } catch {}
      return {
        participantId: r.participant_id,
        eventId: r.event_id,
        availability,
        updatedAt: r.updated_at,
      };
    });

    return new Response(
      JSON.stringify({ event, participants, responses }),
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
  if (!context.env.DB) {
    return new Response(JSON.stringify({ error: 'D1 binding DB not configured' }), {
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

    // CASE 1: Server-Side Admin Key Verification
    if (payload.action === 'verify_admin') {
      const { eventId, adminKey } = payload;
      if (!eventId || !adminKey || !ID_REGEX.test(eventId)) {
        return new Response(JSON.stringify({ valid: false }), { status: 400 });
      }

      const row = await context.env.DB.prepare('SELECT admin_key_hash FROM events WHERE id = ?').bind(eventId).first<any>();
      if (!row) {
        return new Response(JSON.stringify({ valid: false }), { status: 404 });
      }

      const computedAdminHash = await hashAdminKey(eventId, adminKey);
      const valid = row.admin_key_hash === computedAdminHash;

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

      const row = await context.env.DB.prepare('SELECT pin_hash FROM participants WHERE event_id = ? AND id = ?')
        .bind(eventId, participantId)
        .first<any>();

      if (!row) {
        return new Response(JSON.stringify({ valid: false }), { status: 404 });
      }

      const computedPinHash = await hashParticipantPin(eventId, participantId, pin);
      const valid = !row.pin_hash || row.pin_hash === computedPinHash;

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

      const eventRow = await context.env.DB.prepare('SELECT admin_key_hash FROM events WHERE id = ?').bind(eventId).first<any>();
      if (!eventRow) return new Response(JSON.stringify({ notFound: true }), { status: 404 });

      const computedAdminHash = await hashAdminKey(eventId, adminKey);
      if (eventRow.admin_key_hash !== computedAdminHash) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid admin key' }), { status: 401 });
      }

      const newPinHash = await hashParticipantPin(eventId, participantId, newPin);
      await context.env.DB.prepare('UPDATE participants SET pin_hash = ? WHERE event_id = ? AND id = ?')
        .bind(newPinHash, eventId, participantId)
        .run();

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
      const eventRow = await context.env.DB.prepare('SELECT is_locked FROM events WHERE id = ?').bind(eventId).first<any>();
      if (eventRow && eventRow.is_locked) {
        return new Response(JSON.stringify({ error: 'This poll has been locked by the organizer.' }), { status: 403 });
      }

      // Participant lookup & PIN check
      const existingPart = await context.env.DB.prepare('SELECT pin_hash FROM participants WHERE event_id = ? AND id = ?')
        .bind(eventId, participant.id)
        .first<any>();

      const computedHash = pin ? await hashParticipantPin(eventId, participant.id, pin) : '';

      if (existingPart && existingPart.pin_hash && existingPart.pin_hash !== computedHash) {
        return new Response(JSON.stringify({ error: 'Incorrect PIN' }), { status: 401 });
      }

      const finalPinHash = computedHash || existingPart?.pin_hash || participant.pinHash || '';
      const partName = (participant.name || 'Friend').slice(0, 50);
      const partColor = participant.color || 'bg-emerald-600';
      const createdAt = participant.createdAt || new Date().toISOString();
      const updatedAt = response.updatedAt || new Date().toISOString();
      const availabilityJson = JSON.stringify(response.availability || {});

      // Atomic batch write in SQLite!
      await context.env.DB.batch([
        context.env.DB.prepare(`
          INSERT INTO participants (id, event_id, name, color, pin_hash, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(event_id, id) DO UPDATE SET
            name = excluded.name,
            color = excluded.color,
            pin_hash = CASE WHEN excluded.pin_hash != '' THEN excluded.pin_hash ELSE participants.pin_hash END
        `).bind(participant.id, eventId, partName, partColor, finalPinHash, createdAt),
        context.env.DB.prepare(`
          INSERT INTO responses (event_id, participant_id, availability, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(event_id, participant_id) DO UPDATE SET
            availability = excluded.availability,
            updated_at = excluded.updated_at
        `).bind(eventId, participant.id, availabilityJson, updatedAt),
      ]);

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

      const eventRow = await context.env.DB.prepare('SELECT admin_key_hash FROM events WHERE id = ?').bind(eventId).first<any>();
      if (!eventRow) {
        return new Response(JSON.stringify({ notFound: true }), { status: 404 });
      }

      const computedAdminHash = await hashAdminKey(eventId, adminKey);
      if (eventRow.admin_key_hash !== computedAdminHash) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid admin key' }), { status: 401 });
      }

      // Foreign key CASCADE automatically purges participants and responses!
      await context.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(eventId).run();

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

      const eventRow = await context.env.DB.prepare('SELECT admin_key_hash FROM events WHERE id = ?').bind(eventId).first<any>();
      if (!eventRow) {
        return new Response(JSON.stringify({ notFound: true }), { status: 404 });
      }

      const computedAdminHash = await hashAdminKey(eventId, adminKey);
      if (eventRow.admin_key_hash !== computedAdminHash) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid admin key' }), { status: 401 });
      }

      // Foreign key CASCADE automatically deletes response!
      await context.env.DB.prepare('DELETE FROM participants WHERE event_id = ? AND id = ?').bind(eventId, participantId).run();

      return new Response(JSON.stringify({ success: true, removed: participantId }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // CASE 7: Event Creation / Organizer Settings Update
    const eventId = payload?.event?.id;
    if (!eventId || !ID_REGEX.test(eventId)) {
      return new Response(JSON.stringify({ error: 'Invalid payload: missing or invalid event id' }), { status: 400 });
    }

    const existingEvent = await context.env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(eventId).first<any>();

    if (existingEvent) {
      // Event already exists -> THIS IS AN UPDATE. Require and verify adminKey!
      const providedAdminKey = payload.adminKey || payload.event?.adminKey;
      if (!providedAdminKey) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Missing organizer admin key to update poll settings' }), { status: 401 });
      }

      const computedAdminHash = await hashAdminKey(eventId, providedAdminKey);
      if (existingEvent.admin_key_hash !== computedAdminHash) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid organizer admin key' }), { status: 401 });
      }

      const targetEndDate = payload.event.endDate || existingEvent.end_date;
      const expiresAt = computeExpiration(targetEndDate);
      const updatedAt = new Date().toISOString();

      await context.env.DB.prepare(`
        UPDATE events SET
          title = ?,
          description = ?,
          destination_hint = ?,
          start_date = ?,
          end_date = ?,
          default_duration_days = ?,
          is_locked = ?,
          locked_start_date = ?,
          locked_end_date = ?,
          updated_at = ?,
          expires_at = ?
        WHERE id = ?
      `).bind(
        payload.event.title || existingEvent.title,
        payload.event.description !== undefined ? payload.event.description : existingEvent.description,
        payload.event.destinationHint !== undefined ? payload.event.destinationHint : existingEvent.destination_hint,
        payload.event.startDate || existingEvent.start_date,
        targetEndDate,
        payload.event.defaultDurationDays || existingEvent.default_duration_days,
        payload.event.isLocked !== undefined ? (payload.event.isLocked ? 1 : 0) : existingEvent.is_locked,
        payload.event.lockedWindow?.startDate || null,
        payload.event.lockedWindow?.endDate || null,
        updatedAt,
        expiresAt,
        eventId
      ).run();
    } else {
      // Event does not exist -> THIS IS A NEW EVENT CREATION.
      if (!payload.event?.adminKeyHash) {
        return new Response(JSON.stringify({ error: 'Invalid event creation: missing adminKeyHash' }), { status: 400 });
      }

      const expiresAt = computeExpiration(payload.event.endDate);
      const nowIso = new Date().toISOString();

      const batchStatements = [
        context.env.DB.prepare(`
          INSERT INTO events (
            id, title, description, destination_hint, start_date, end_date,
            default_duration_days, admin_key_hash, is_locked,
            locked_start_date, locked_end_date, created_at, updated_at, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          eventId,
          payload.event.title,
          payload.event.description || null,
          payload.event.destinationHint || null,
          payload.event.startDate,
          payload.event.endDate,
          payload.event.defaultDurationDays || 7,
          payload.event.adminKeyHash,
          payload.event.isLocked ? 1 : 0,
          payload.event.lockedWindow?.startDate || null,
          payload.event.lockedWindow?.endDate || null,
          payload.event.createdAt || nowIso,
          payload.event.updatedAt || nowIso,
          expiresAt
        )
      ];

      // Insert participants if supplied
      if (Array.isArray(payload.participants)) {
        for (const p of payload.participants) {
          if (!p?.id) continue;
          batchStatements.push(
            context.env.DB.prepare(`
              INSERT INTO participants (id, event_id, name, color, pin_hash, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(event_id, id) DO UPDATE SET
                name = excluded.name,
                color = excluded.color,
                pin_hash = excluded.pin_hash
            `).bind(
              p.id,
              eventId,
              (p.name || 'Friend').slice(0, 50),
              p.color || 'bg-emerald-600',
              p.pinHash || '',
              p.createdAt || nowIso
            )
          );
        }
      }

      // Insert responses if supplied
      if (Array.isArray(payload.responses)) {
        for (const r of payload.responses) {
          if (!r?.participantId) continue;
          batchStatements.push(
            context.env.DB.prepare(`
              INSERT INTO responses (event_id, participant_id, availability, updated_at)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(event_id, participant_id) DO UPDATE SET
                availability = excluded.availability,
                updated_at = excluded.updated_at
            `).bind(
              eventId,
              r.participantId,
              JSON.stringify(r.availability || {}),
              r.updatedAt || nowIso
            )
          );
        }
      }

      await context.env.DB.batch(batchStatements);
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

  if (!context.env.DB) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 503 });
  }

  if (!eventId || !adminKey || !ID_REGEX.test(eventId)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid event ID or admin key' }), { status: 400 });
  }

  const eventRow = await context.env.DB.prepare('SELECT admin_key_hash FROM events WHERE id = ?').bind(eventId).first<any>();
  if (!eventRow) {
    return new Response(JSON.stringify({ notFound: true }), { status: 404 });
  }

  const computedAdminHash = await hashAdminKey(eventId, adminKey);
  if (eventRow.admin_key_hash !== computedAdminHash) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid admin key' }), { status: 401 });
  }

  // Cascade delete in SQLite
  await context.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(eventId).run();

  return new Response(JSON.stringify({ success: true, deleted: eventId }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
