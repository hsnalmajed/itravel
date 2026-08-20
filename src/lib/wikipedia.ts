// Live photo + short description source for the "Tourist Attractions"
// section. We deliberately fetch this at request time from Wikipedia's
// public REST API instead of storing photo URLs or descriptions ourselves —
// on a real commercial site we cannot verify or maintain hand-typed photo
// links, so pulling live from a real, citable source is the only honest
// option. If a lookup fails (rate limit, renamed article, network issue) we
// return null and the page shows an honest "unavailable" state rather than
// a broken image or invented text.

export interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: string;
  wikipediaUrl?: string;
  // Real coordinates for places that have them. Wikipedia already returns
  // these in the same summary payload we fetch for the photo and blurb, so
  // the maps feature costs no extra requests — and the position of a pin is
  // as verifiable as everything else we show.
  lat?: number;
  lon?: number;
}

// Cloudflare Workers reuse isolates across some requests, so this in-memory
// cache is a soft best-effort speedup only — never relied on for
// correctness. Each entry is small (a title, ~2 sentences, one image URL).
const summaryCache = new Map<string, WikiSummary | null>();

export async function fetchWikiSummary(title: string): Promise<WikiSummary | null> {
  const cached = summaryCache.get(title);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      {
        headers: {
          "User-Agent": "iTravel/1.0 (https://itravel.almajedhsn.workers.dev; travel metasearch site)",
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) {
      summaryCache.set(title, null);
      return null;
    }
    const data = (await res.json()) as {
      title?: string;
      extract?: string;
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
      content_urls?: { desktop?: { page?: string } };
      coordinates?: { lat?: number; lon?: number };
      type?: string;
    };
    if (data.type === "disambiguation") {
      summaryCache.set(title, null);
      return null;
    }
    const summary: WikiSummary = {
      title: data.title || title,
      extract: data.extract || "",
      thumbnail: data.originalimage?.source || data.thumbnail?.source,
      wikipediaUrl: data.content_urls?.desktop?.page,
      lat: typeof data.coordinates?.lat === "number" ? data.coordinates.lat : undefined,
      lon: typeof data.coordinates?.lon === "number" ? data.coordinates.lon : undefined,
    };
    summaryCache.set(title, summary);
    return summary;
  } catch {
    summaryCache.set(title, null);
    return null;
  }
}

export async function fetchWikiSummaries(titles: string[]): Promise<Map<string, WikiSummary | null>> {
  const entries = await Promise.all(
    titles.map(async (title) => [title, await fetchWikiSummary(title)] as const)
  );
  return new Map(entries);
}
