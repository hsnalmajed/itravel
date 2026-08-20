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

export interface NearbyPlace {
  pageId: number;
  title: string;
  lat: number;
  lon: number;
  /** Metres from the search centre, as reported by Wikipedia. */
  distance: number;
}

// Every Wikipedia article that carries coordinates within `radius` metres of
// a point — museums, mosques, palaces, parks, bridges, districts. This is how
// a city map gets hundreds of real, notable places instead of the handful in
// our hand-curated guide, and every one of them is a documented article
// rather than a pin we placed ourselves.
//
// Wikipedia caps the radius at 10 km and the result count at 500, so this is
// a city-scale lookup by design.
// GeoSearch returns every article carrying coordinates, and that includes
// historical events pinned to where they happened — "740 Constantinople
// earthquake", "Battle of ...", "1999 İzmit earthquake". They're real
// articles, but they're not places a traveller can visit, so they don't
// belong on a tourist map.
//
// This is a heuristic on the title, not a guarantee: it errs toward dropping
// a few borderline articles rather than leaving obvious noise on the map.
const EVENT_WORDS =
  /\b(earthquake|battle|siege|massacre|riot|riots|election|elections|treaty|coup|disaster|crash|bombing|shooting|attack|attacks|war|revolt|uprising|rebellion|plague|epidemic|pandemic|famine|explosion|derailment|hijacking|protests?|strike|census)\b/i;

function looksLikeEvent(title: string): boolean {
  // Almost every event article is either titled with a leading year
  // ("1999 İzmit earthquake") or contains one of the words above.
  if (/^\d{3,4}\b/.test(title.trim())) return true;
  return EVENT_WORDS.test(title);
}

export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  { radius = 10000, limit = 300 }: { radius?: number; limit?: number } = {}
): Promise<NearbyPlace[]> {
  const params = new URLSearchParams({
    action: "query",
    list: "geosearch",
    gscoord: `${lat}|${lon}`,
    gsradius: String(Math.min(radius, 10000)),
    gslimit: String(Math.min(limit, 500)),
    format: "json",
    origin: "*",
  });

  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {
      headers: {
        "User-Agent": "iTravel/1.0 (https://itravel.almajedhsn.workers.dev; travel metasearch site)",
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      query?: { geosearch?: { pageid?: number; title?: string; lat?: number; lon?: number; dist?: number }[] };
    };
    return (data.query?.geosearch ?? [])
      .map((g) => ({
        pageId: Number(g.pageid),
        title: g.title || "",
        lat: Number(g.lat),
        lon: Number(g.lon),
        distance: Number(g.dist) || 0,
      }))
      .filter((p) => p.title && Number.isFinite(p.lat) && Number.isFinite(p.lon))
      .filter((p) => !looksLikeEvent(p.title));
  } catch {
    return [];
  }
}

export async function fetchWikiSummaries(titles: string[]): Promise<Map<string, WikiSummary | null>> {
  const entries = await Promise.all(
    titles.map(async (title) => [title, await fetchWikiSummary(title)] as const)
  );
  return new Map(entries);
}
