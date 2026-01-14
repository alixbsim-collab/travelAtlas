import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const url = new URL(event.request.url);

  try {
    // Serve static assets from KV
    return await getAssetFromKV(event, {});
  } catch (e) {
    // If asset not found, serve index.html for client-side routing
    if (e.status === 404) {
      try {
        const indexRequest = new Request(`${url.origin}/index.html`, event.request);
        return await getAssetFromKV(event, { request: indexRequest });
      } catch (e) {
        return new Response('Not Found', { status: 404 });
      }
    }
    return new Response('Internal Error', { status: 500 });
  }
}
