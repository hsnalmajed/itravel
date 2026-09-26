/**
 * A cache that actually persists on Cloudflare.
 *
 * `fetch(url, { next: { revalidate } })` is Next's way of caching a
 * third-party answer, and on this deployment it does nothing: OpenNext keeps
 * that cache in a KV namespace or R2 bucket, and none is configured, so every
 * page view went back to the source. For Pexels that meant the homepage alone
 * spent dozens of searches per visitor, the free hourly allowance ran out,
 * and the destination cards went blank.
 *
 * Cloudflare's own edge cache (`caches.default`) needs no binding and no
 * setup — it exists in every Worker. It is per data centre rather than
 * global, which is fine: each one asks once a week, not once a view.
 *
 * Outside a Worker (`next dev`, the build) there is no `caches.default`, and
 * this simply calls through.
 */

type EdgeCaches = { default?: Cache };

function edge(): Cache | undefined {
  return (globalThis as { caches?: EdgeCaches }).caches?.default;
}

/**
 * The JSON `load` produces, cached at the edge under `key` for `ttlSeconds`.
 *
 * `load` returns null for "nothing to cache" — a failed or rate-limited call
 * — so a bad hour is never remembered for a week.
 */
export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T | null>
): Promise<T | null> {
  const cache = edge();
  // The key is a URL on our own zone: Cloudflare's cache is keyed by request.
  const request = new Request(`https://sfrtna.com/__edge-cache/${encodeURIComponent(key)}`);
  if (cache) {
    try {
      const hit = await cache.match(request);
      if (hit) return (await hit.json()) as T;
    } catch {
      // A cache read failing is not a reason to fail the page.
    }
  }

  const value = await load();
  if (value !== null && cache) {
    try {
      await cache.put(
        request,
        new Response(JSON.stringify(value), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${ttlSeconds}`,
          },
        })
      );
    } catch {
      // Nor is a cache write.
    }
  }
  return value;
}
