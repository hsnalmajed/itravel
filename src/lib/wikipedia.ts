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

// Wikipedia's one-line "short description" for a page — "Mosque and former
// church in Istanbul, Turkey", "Restaurant in Istanbul, Turkey". It's the
// cheapest reliable signal for what a place actually *is*, and the API takes
// up to 50 page ids at a time, so a 300-pin city map costs about six
// requests rather than three hundred.
export async function fetchDescriptions(pageIds: number[]): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  if (pageIds.length === 0) return result;

  const BATCH = 50;
  const batches: number[][] = [];
  for (let i = 0; i < pageIds.length; i += BATCH) batches.push(pageIds.slice(i, i + BATCH));

  await Promise.all(
    batches.map(async (batch) => {
      const params = new URLSearchParams({
        action: "query",
        prop: "description",
        pageids: batch.join("|"),
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
        if (!res.ok) return;
        const data = (await res.json()) as {
          query?: { pages?: Record<string, { pageid?: number; description?: string }> };
        };
        for (const page of Object.values(data.query?.pages ?? {})) {
          if (typeof page.pageid === "number" && page.description) {
            result.set(page.pageid, page.description);
          }
        }
      } catch {
        // A missing batch just means those pins fall back to the generic
        // category — never a failed page.
      }
    })
  );

  return result;
}

export async function fetchWikiSummaries(titles: string[]): Promise<Map<string, WikiSummary | null>> {
  const entries = await Promise.all(
    titles.map(async (title) => [title, await fetchWikiSummary(title)] as const)
  );
  return new Map(entries);
}

// ---------------------------------------------------------------------------
// Arabic
// ---------------------------------------------------------------------------
//
// Most of what we discover comes from English Wikipedia, because that's where
// the geo-tagged coverage is. But a visitor reading the site in Arabic should
// get Arabic — so for every place we look up whether an Arabic article exists
// and, when it does, take the name and description from *that* article.
//
// What we never do is translate. A name we generated ourselves is a name no
// source stands behind, and on a commercial travel site that's the kind of
// detail a traveller acts on. A place with no Arabic article keeps its English
// name and is marked as such in the interface, so the reader knows why.

export type WikiLang = "en" | "ar";

function apiBase(lang: WikiLang) {
  return `https://${lang}.wikipedia.org/w/api.php`;
}

const WIKI_HEADERS = {
  "User-Agent": "iTravel/1.0 (https://itravel.almajedhsn.workers.dev; travel metasearch site)",
  Accept: "application/json",
};

/** Splits into API-sized chunks; every Wikipedia list parameter caps at 50. */
function chunk<T>(items: T[], size = 50): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * The Arabic article title for each English page id, where one exists.
 *
 * This is Wikipedia's own interlanguage link — the same "العربية" entry in an
 * article's sidebar — so it's an editorial mapping between two articles about
 * the same subject, not a transliteration we produced.
 */
export async function fetchArabicTitles(pageIds: number[]): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  if (pageIds.length === 0) return result;

  await Promise.all(
    chunk(pageIds).map(async (batch) => {
      const params = new URLSearchParams({
        action: "query",
        prop: "langlinks",
        lllang: "ar",
        lllimit: "500",
        pageids: batch.join("|"),
        format: "json",
        origin: "*",
      });
      try {
        const res = await fetch(`${apiBase("en")}?${params.toString()}`, {
          headers: WIKI_HEADERS,
          next: { revalidate: 86400 },
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          query?: { pages?: Record<string, { pageid?: number; langlinks?: { "*"?: string }[] }> };
        };
        for (const page of Object.values(data.query?.pages ?? {})) {
          const arTitle = page.langlinks?.[0]?.["*"];
          if (typeof page.pageid === "number" && arTitle) result.set(page.pageid, arTitle);
        }
      } catch {
        // A missing batch just means those places stay English — never a
        // failed page.
      }
    })
  );

  return result;
}

/**
 * Wikipedia's one-line description for each title, on whichever language
 * edition is asked for. Keyed by the title you passed in, so a redirect or a
 * normalised spelling still finds its way home.
 */
export async function fetchDescriptionsByTitle(
  lang: WikiLang,
  titles: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (titles.length === 0) return result;

  await Promise.all(
    chunk(titles).map(async (batch) => {
      const params = new URLSearchParams({
        action: "query",
        prop: "description",
        titles: batch.join("|"),
        redirects: "1",
        format: "json",
        origin: "*",
      });
      try {
        const res = await fetch(`${apiBase(lang)}?${params.toString()}`, {
          headers: WIKI_HEADERS,
          next: { revalidate: 86400 },
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          query?: {
            normalized?: { from: string; to: string }[];
            redirects?: { from: string; to: string }[];
            pages?: Record<string, { title?: string; description?: string }>;
          };
        };
        // Wikipedia answers under the *final* title, so walk the normalise
        // and redirect hops back to the title the caller asked about.
        const backToAsked = new Map<string, string>();
        for (const n of data.query?.normalized ?? []) backToAsked.set(n.to, n.from);
        for (const r of data.query?.redirects ?? []) {
          backToAsked.set(r.to, backToAsked.get(r.from) ?? r.from);
        }
        for (const page of Object.values(data.query?.pages ?? {})) {
          if (!page.title || !page.description) continue;
          const asked = backToAsked.get(page.title) ?? page.title;
          result.set(asked, page.description);
        }
      } catch {
        // Same as above: a missing batch costs a description, not a page.
      }
    })
  );

  return result;
}

/** Thumbnail URL for each page id — one batched request per 50 places. */
export async function fetchThumbnails(pageIds: number[], size = 480): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  if (pageIds.length === 0) return result;

  await Promise.all(
    chunk(pageIds).map(async (batch) => {
      const params = new URLSearchParams({
        action: "query",
        prop: "pageimages",
        piprop: "thumbnail",
        pithumbsize: String(size),
        pilimit: "50",
        pageids: batch.join("|"),
        format: "json",
        origin: "*",
      });
      try {
        const res = await fetch(`${apiBase("en")}?${params.toString()}`, {
          headers: WIKI_HEADERS,
          next: { revalidate: 86400 },
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          query?: { pages?: Record<string, { pageid?: number; thumbnail?: { source?: string } }> };
        };
        for (const page of Object.values(data.query?.pages ?? {})) {
          if (typeof page.pageid === "number" && page.thumbnail?.source) {
            result.set(page.pageid, page.thumbnail.source);
          }
        }
      } catch {
        // A place without a photo shows its name and category instead.
      }
    })
  );

  return result;
}
