import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { findCountry } from "@/lib/countries";
import { searchPexelsPhotos, type PexelsQuery } from "@/lib/pexels";

/**
 * One photograph per country, for the destination cards.
 *
 * The search tries the country's best-known landmark first — "Petra Jordan"
 * finds Petra; "Jordan" alone finds a basketball player — then the next
 * landmark, then the country with "travel" to steer it towards places rather
 * than people. Photos come from Pexels (see pexels.ts); a country with no
 * result keeps its navy tile rather than borrowing someone else's picture.
 */
export async function fetchCountryPhotos(
  codes: string[],
  { full = false }: { full?: boolean } = {}
): Promise<Map<string, string>> {
  const wanted = new Map<string, PexelsQuery[]>();
  for (const code of codes) {
    const country = findCountry(code)?.nameEn;
    if (!country) continue;
    const landmarks = (COUNTRY_GUIDES[code]?.attractions ?? []).slice(0, 2);
    wanted.set(code, [
      ...landmarks.map((a) => ({ query: `${a.nameEn} ${country}`, mention: [a.nameEn, country] })),
      { query: `${country} travel`, mention: [country] },
    ]);
  }
  const found = await searchPexelsPhotos(wanted);
  const photos = new Map<string, string>();
  for (const [code, p] of found) photos.set(code, full ? p.url : p.small);
  return photos;
}
