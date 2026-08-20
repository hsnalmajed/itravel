// Turning real Wikipedia articles into map pins.
//
// Both the country map and the city map want the same thing: every documented
// place around a set of centre points, sorted into the pin that says what it
// is. The only difference is how many centres they pass in — one city, or all
// of a country's cities at once — so the work lives here rather than being
// written twice.
//
// Nothing in this module touches the browser, so server components can use it
// freely. (MapCanvas loads Leaflet at module scope, and Leaflet reaches for
// `window` on import, so the pin *type* has to live outside it.)

import { fetchDescriptions, fetchNearbyPlaces, fetchWikiSummaries } from "@/lib/wikipedia";
import { categorisePlace } from "@/lib/placeCategory";
import type { PinCategory } from "@/lib/pinStyles";

export interface MapPin {
  key: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lon: number;
  photo?: string;
  extract?: string;
  category: PinCategory;
  /**
   * Wikipedia article title. Present on pins discovered by GeoSearch, where
   * we deliberately don't pre-fetch a photo for every one of several hundred
   * places — the popup loads it on demand instead.
   */
  wikiTitle?: string;
}

export interface PinCentre {
  /** Exact English Wikipedia article title of the city. */
  wikiTitle: string;
}

/**
 * Every documented place within `radius` of each city centre, already sorted
 * into its pin category.
 *
 * Each city's coordinates come from its own Wikipedia article, so a city we
 * can't resolve simply contributes nothing rather than putting pins in the
 * wrong place. Duplicates are dropped by page id, which matters when two
 * cities in the list sit close enough for their search circles to overlap.
 */
export async function pinsAroundCities(
  centres: PinCentre[],
  { perCity = 300, radius = 10000 }: { perCity?: number; radius?: number } = {}
): Promise<MapPin[]> {
  if (centres.length === 0) return [];

  const summaries = await fetchWikiSummaries(centres.map((c) => c.wikiTitle));

  const found = await Promise.all(
    centres.map(async (c) => {
      const s = summaries.get(c.wikiTitle);
      if (typeof s?.lat !== "number" || typeof s?.lon !== "number") return [];
      return fetchNearbyPlaces(s.lat, s.lon, { radius, limit: perCity });
    })
  );

  const byPageId = new Map<number, { pageId: number; title: string; lat: number; lon: number }>();
  for (const place of found.flat()) {
    if (!byPageId.has(place.pageId)) byPageId.set(place.pageId, place);
  }
  const places = [...byPageId.values()];

  // Wikipedia's own one-line description of each place is what decides its
  // pin, fetched 50 at a time.
  const descriptions = await fetchDescriptions(places.map((p) => p.pageId));

  return places.map((p) => ({
    key: String(p.pageId),
    // GeoSearch returns English article titles only, so both locales show the
    // same name here rather than us inventing an Arabic one. The popup's
    // "read more" link goes to the article itself.
    nameAr: p.title,
    nameEn: p.title,
    lat: p.lat,
    lon: p.lon,
    category: categorisePlace(descriptions.get(p.pageId)) as PinCategory,
    wikiTitle: p.title,
  }));
}

/**
 * The legend for a set of pins — only the categories this map actually has,
 * each with how many pins carry it. An empty entry would tell the reader a
 * colour is meaningful when nothing on the map wears it.
 */
export function buildLegend(
  pins: MapPin[],
  labels: { historic: string; food: string; activity: string; place: string }
): { category: PinCategory; label: string; count: number }[] {
  const order: PinCategory[] = ["historic", "food", "activity", "place"];
  return order
    .map((category) => ({
      category,
      label: labels[category],
      count: pins.filter((p) => p.category === category).length,
    }))
    .filter((l) => l.count > 0);
}
