// Cloudflare Pages Function for real-time edge synchronization
// Works seamlessly when a KV namespace binding named "VACAY_KV" is configured in Cloudflare Pages.

interface Env {
  VACAY_KV?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const eventId = url.searchParams.get('id');

  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Missing event ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (context.env.VACAY_KV) {
    const raw = await context.env.VACAY_KV.get(`event_${eventId}`);
    if (raw) {
      return new Response(raw, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
    }
  }

  return new Response(JSON.stringify({ notFound: true }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { event?: { id?: string } };
    const eventId = body?.event?.id;

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (context.env.VACAY_KV) {
      await context.env.VACAY_KV.put(`event_${eventId}`, JSON.stringify(body), {
        expirationTtl: 60 * 60 * 24 * 90, // 90 days retention
      });
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
