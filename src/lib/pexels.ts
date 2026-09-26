/**
 * Photographs from Pexels — the site's one source of pictures.
 *
 * Why Pexels: every photo on it is licensed for commercial use without a fee,
 * the API key is free and issued on sign-up, and the pictures are by working
 * photographers rather than whatever happened to be uploaded to an
 * free-encyclopaedia upload. The owner chose it as the site's one source.
 *
 * Their API guidelines ask for two things, and the site does both: a visible
 * link to Pexels wherever its photos appear (the footer carries one), and the
 * photographer's name where it reasonably fits (the large heroes carry one).
 *
 * Credentials:
 *   PEXELS_API_KEY — a Cloudflare secret, read on the server at run time.
 *   Without it every search returns null and the cards fall back to their
 *   navy tiles; nothing breaks and nothing is invented.
 *
 * Docs: https://www.pexels.com/api/documentation/
 */

import { cachedJson, readJson, writeJson } from "@/lib/edgeCache";

const API = "https://api.pexels.com/v1/search";

export interface PexelsPhoto {
  /** 1920 wide — heroes and large cards. */
  url: string;
  /** 3840 wide, for 4K screens. */
  url4k: string;
  /** 800 wide — grid cards. */
  small: string;
  photographer: string;
  photographerUrl: string;
  /** The photo's own page on pexels.com. */
  pageUrl: string;
}

interface PexelsApiPhoto {
  id: number;
  url: string;
  alt?: string;
  photographer: string;
  photographer_url: string;
  src: { original: string };
}

function key(): string {
  return process.env.PEXELS_API_KEY || "";
}

/** Builds the sized URLs from Pexels' original, using their own resizer. */
export function pexelsSizes(original: string): Pick<PexelsPhoto, "url" | "url4k" | "small"> {
  const at = (w: number) => `${original}?auto=compress&cs=tinysrgb&w=${w}`;
  return { url: at(1920), url4k: at(3840), small: at(800) };
}

/** One search, and the words its result must be captioned with. */
export interface PexelsQuery {
  query: string;
  /**
   * The photo's caption must mention one of these (case-insensitive), or the
   * result is skipped. A search for "Jeddah" on Pexels returns Dubai's skyline
   * and the pyramids among its first results; the caption is what tells them
   * apart, and a card with no photo is better than a card with the wrong city.
   */
  mention: string[];
}

function fold(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * The first landscape photo for a search whose caption names the place, or
 * null.
 *
 * Cached for a week at the edge: a city's photograph does not change from day
 * to day, and the free tier's monthly allowance is the constraint that
 * matters.
 */
/** One search, uncached: `{ photo }` (null photo = nothing fitting), or null if the call failed. */
async function rawSearch({ query, mention }: PexelsQuery): Promise<{ photo: PexelsPhoto | null } | null> {
  const url = new URL(API);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "15");
  url.searchParams.set("orientation", "landscape");
  try {
    const res = await fetch(url.toString(), { headers: { Authorization: key() } });
    if (!res.ok) return null;
    const body = (await res.json()) as { photos?: PexelsApiPhoto[] };
    const words = mention.map(fold).filter(Boolean);
    const p = (body.photos ?? []).find(
      (ph) => ph.src?.original && words.some((w) => fold(ph.alt ?? "").includes(w))
    );
    if (!p) return { photo: null };
    return {
      photo: {
        ...pexelsSizes(p.src.original),
        photographer: p.photographer,
        photographerUrl: p.photographer_url,
        pageUrl: p.url,
      },
    };
  } catch {
    return null;
  }
}

export async function searchPexelsPhoto(q: PexelsQuery): Promise<PexelsPhoto | null> {
  if (!key() || !q.query.trim()) return null;
  // Cached at Cloudflare's edge (see edgeCache.ts). A search that found no
  // fitting photo is remembered too; one that failed is not.
  const found = await cachedJson(`pexels:${q.query}|${q.mention.join(",")}`, 604800, () => rawSearch(q));
  return found?.photo ?? null;
}

/**
 * Several searches at once, keyed however the caller likes. Each key tries
 * its queries in order and keeps the first that returns a photo — a
 * landmark first, then the city, then the country.
 *
 * Why the whole set is one cache entry, filled in over several visits:
 * Cloudflare's Free plan allows 50 subrequests per page view, and cache
 * reads and writes count towards the same 50. The attractions page wants 41
 * countries at up to three searches each; asked all at once, the searches
 * past the cap failed and those cards came up blank — a different set on
 * every load. So each page's set lives under one key (one read, one write),
 * and a visit spends at most SEARCH_BUDGET searches on keys not yet settled
 * (18: two sets on one page, plus their reads and writes, stay under 50).
 * The first visits after a deploy fill it in; after that it is one read.
 */
const SEARCH_BUDGET = 18;
const SET_TTL = 604800;

interface PhotoSet {
  /** Settled keys: a photo, or null when every query was tried and none fit. */
  photos: Record<string, PexelsPhoto | null>;
}

/** A short stable hash, so the cache key does not grow with the list. */
function hashOf(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export async function searchPexelsPhotos(
  wanted: Map<string, PexelsQuery[]>
): Promise<Map<string, PexelsPhoto>> {
  const out = new Map<string, PexelsPhoto>();
  if (!key() || wanted.size === 0) return out;
  const entries = [...wanted.entries()];
  const setKey = `pexels-set:${hashOf(JSON.stringify(entries))}`;

  const cached = await readJson<PhotoSet>(setKey);
  const photos: PhotoSet["photos"] = { ...(cached?.photos ?? {}) };
  const pending = entries.filter(([k]) => !(k in photos));

  if (pending.length > 0) {
    let budget = SEARCH_BUDGET;
    let next = 0;
    let changed = false;
    const CONCURRENCY = 6;
    async function worker() {
      while (next < pending.length && budget > 0) {
        const [k, queries] = pending[next++];
        let settled = true;
        let photo: PexelsPhoto | null = null;
        for (const q of queries) {
          if (budget <= 0) {
            settled = false;
            break;
          }
          budget--;
          const r = await rawSearch(q);
          if (r === null) {
            // A failed call proves nothing about this place; try it again
            // on a later visit rather than recording "no photo".
            settled = false;
            break;
          }
          if (r.photo) {
            photo = r.photo;
            break;
          }
        }
        if (photo || settled) {
          photos[k] = photo;
          changed = true;
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
    if (changed) await writeJson(setKey, { photos }, SET_TTL);
  }

  for (const [k, p] of Object.entries(photos)) if (p && wanted.has(k)) out.set(k, p);
  return out;
}
