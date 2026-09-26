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

import { cachedJson } from "@/lib/edgeCache";

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
export async function searchPexelsPhoto({ query, mention }: PexelsQuery): Promise<PexelsPhoto | null> {
  if (!key() || !query.trim()) return null;
  // Cached at Cloudflare's edge (see edgeCache.ts) — the `revalidate` below
  // alone never persisted on this deployment. A search that found no fitting
  // photo is remembered too; one that failed (429, network) is not.
  const found = await cachedJson<{ photo: PexelsPhoto | null }>(
    `pexels:${query}|${mention.join(",")}`,
    604800,
    async () => {
      const url = new URL(API);
      url.searchParams.set("query", query);
      url.searchParams.set("per_page", "15");
      url.searchParams.set("orientation", "landscape");
      try {
        const res = await fetch(url.toString(), {
          headers: { Authorization: key() },
          next: { revalidate: 604800 },
        });
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
  );
  return found?.photo ?? null;
}

/**
 * Several searches at once, a few at a time, keyed however the caller likes.
 * Each key tries its queries in order and keeps the first that returns a
 * photo — a landmark first, then the city, then the country.
 */
export async function searchPexelsPhotos(
  wanted: Map<string, PexelsQuery[]>
): Promise<Map<string, PexelsPhoto>> {
  const out = new Map<string, PexelsPhoto>();
  if (!key()) return out;
  const entries = [...wanted.entries()];
  const CONCURRENCY = 6;
  let next = 0;
  async function worker() {
    while (next < entries.length) {
      const [k, queries] = entries[next++];
      for (const q of queries) {
        const photo = await searchPexelsPhoto(q);
        if (photo) {
          out.set(k, photo);
          break;
        }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, entries.length) }, worker));
  return out;
}
