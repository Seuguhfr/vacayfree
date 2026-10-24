// Cloudflare Pages Middleware to inject dynamic OpenGraph tags for WhatsApp, iMessage, Discord, Slack
interface Env {
  VACAY_KV?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const eventId = url.searchParams.get('event');

  // Let static assets and API routes pass through directly
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/assets/')) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  // Only transform HTML documents
  if (!contentType.includes('text/html') || !eventId) {
    return response;
  }

  let tripTitle = 'Vacation Free-Time Poll';
  let tripDescription = 'Pick your free vacation days so we can find the best date together!';

  if (eventId === 'demo-summer-trip') {
    tripTitle = 'Summer Getaway ☀️';
    tripDescription = 'Finding the best week for our summer vacation rental house! Pick your free dates.';
  } else if (context.env.VACAY_KV) {
    try {
      const raw = await context.env.VACAY_KV.get(`event_${eventId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.event?.title) {
          tripTitle = parsed.event.title;
        }
        if (parsed?.event?.description) {
          tripDescription = parsed.event.description;
        }
      }
    } catch {
      // fallback to generic
    }
  }

  // HTML Rewriter to inject rich OG tags for group chats
  const rewriter = new HTMLRewriter()
    .on('title', {
      element(e) {
        e.setInnerContent(`${tripTitle} | VacayFree`);
      },
    })
    .on('head', {
      element(e) {
        e.append(`\n  <meta property="og:title" content="${tripTitle} — VacayFree" />`, { html: true });
        e.append(`\n  <meta property="og:description" content="${tripDescription}" />`, { html: true });
        e.append(`\n  <meta property="og:type" content="website" />`, { html: true });
        e.append(`\n  <meta property="og:url" content="${url.href}" />`, { html: true });
        e.append(`\n  <meta name="twitter:card" content="summary" />`, { html: true });
        e.append(`\n  <meta name="twitter:title" content="${tripTitle} — VacayFree" />`, { html: true });
        e.append(`\n  <meta name="twitter:description" content="${tripDescription}" />`, { html: true });
      },
    });

  return rewriter.transform(response);
};
