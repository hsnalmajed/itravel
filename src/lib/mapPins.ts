// Turning real Wikipedia articles into the places this site shows.
//
// Two sections are built on this: the tourist maps (places as pins) and the
// attractions guide (the same places as a browsable list). They ask for the
// same thing — every documented place around a set of city centres, sorted
// into what it is and named in the reader's own language — so the work lives
// here rather than being written twice.
//
// Nothing in this module touches the browser, so server components can use it
// freely. (MapCanvas loads Leaflet at module scope, and Leaflet reaches for
// `window` on import, so the pin *type* has to live outside it.)

import {
  fetchArabicTitles,
  fetchDescriptions,
  fetchDescriptionsByTitle,
  fetchNearbyPlaces,
  fetchThumbnails,
  fetchWikiSummaries,
} from "@/lib/wikipedia";
import { categorisePlace } from "@/lib/placeCategory";
import type { PinCategory } from "@/lib/pinStyles";
import type { Locale } from "@/lib/types";

export interface Place {
  pageId: number;
  /** Name to show the reader, in their own language where Wikipedia has one. */
  name: string;
  /** English article title — always present; it's what we discovered by. */
  enTitle: string;
  /** Arabic article title, when Wikipedia links one to the English article. */
  arTitle?: string;
  /** One-line description, in the reader's language where one exists. */
  description?: string;
  lat: number;
  lon: number;
  category: PinCategory;
  photo?: string;
  /**
   * True when this place has no article in the reader's language, so its name
   * and description above are English. The interface marks these rather than
   * quietly mixing languages — and rather than inventing a translation.
   */
  englishOnly: boolean;
}

export interface PinCentre {
  /** Exact English Wikipedia article title of the city. */
  wikiTitle: string;
}

/**
 * Every documented place within `radius` of each city centre, categorised and
 * named in `locale`.
 *
 * Each city's coordinates come from its own Wikipedia article, so a city we
 * can't resolve simply contributes nothing rather than putting places in the
 * wrong spot. Duplicates are dropped by page id, which matters when two cities
 * in the list sit close enough for their search circles to overlap.
 *
 * `withPhotos` costs one extra batched request per 50 places, so the maps skip
 * it (a pin has no room for a photo, and its popup loads one on demand) while
 * the attractions list asks for it.
 */
export async function fetchPlacesAroundCities(
  centres: PinCentre[],
  {
    locale,
    perCity = 300,
    radius = 10000,
    withPhotos = false,
  }: { locale: Locale; perCity?: number; radius?: number; withPhotos?: boolean }
): Promise<Place[]> {
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
  if (places.length === 0) return [];

  const pageIds = places.map((p) => p.pageId);

  // English descriptions decide the category no matter which language the
  // reader is in — the keyword lists that sort a place are English, and a
  // place's category shouldn't change with the interface language.
  const [enDescriptions, arTitles, photos] = await Promise.all([
    fetchDescriptions(pageIds),
    locale === "ar" ? fetchArabicTitles(pageIds) : Promise.resolve(new Map<number, string>()),
    withPhotos ? fetchThumbnails(pageIds) : Promise.resolve(new Map<number, string>()),
  ]);

  const arDescriptions =
    arTitles.size > 0
      ? await fetchDescriptionsByTitle("ar", [...arTitles.values()])
      : new Map<string, string>();

  return places.map((p): Place => {
    const arTitle = arTitles.get(p.pageId);
    const enDescription = enDescriptions.get(p.pageId);
    const arDescription = arTitle ? arDescriptions.get(arTitle) : undefined;
    const useArabic = locale === "ar" && Boolean(arTitle);

    return {
      pageId: p.pageId,
      name: useArabic ? (arTitle as string) : p.title,
      enTitle: p.title,
      arTitle,
      description: useArabic ? (arDescription ?? enDescription) : enDescription,
      lat: p.lat,
      lon: p.lon,
      category: categorisePlace(enDescription) as PinCategory,
      photo: photos.get(p.pageId),
      englishOnly: locale === "ar" && !arTitle,
    };
  });
}

// ---------------------------------------------------------------------------
// Map pins
// ---------------------------------------------------------------------------

export interface MapPin {
  key: string;
  /** Already resolved to the reader's language by whoever built the pin. */
  name: string;
  lat: number;
  lon: number;
  photo?: string;
  extract?: string;
  category: PinCategory;
  /**
   * Article title the popup should look up, and the language edition to look
   * it up on. Absent on curated pins, whose text we already have.
   */
  wikiTitle?: string;
  wikiLang?: Locale;
  /** Name and description are English because no Arabic article exists. */
  englishOnly?: boolean;
}

export function placeToPin(place: Place, locale: Locale): MapPin {
  const useArabic = locale === "ar" && Boolean(place.arTitle);
  return {
    key: String(place.pageId),
    name: place.name,
    lat: place.lat,
    lon: place.lon,
    photo: place.photo,
    category: place.category,
    wikiTitle: useArabic ? place.arTitle : place.enTitle,
    wikiLang: useArabic ? "ar" : "en",
    englishOnly: place.englishOnly,
  };
}

/**
 * The legend for a set of pins — only the categories this map actually has,
 * each with how many pins carry it. An empty entry would tell the reader a
 * colour is meaningful when nothing on the map wears it.
 */
export function buildLegend(
  pins: { category: PinCategory }[],
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

/**
 * A photo and a place count for each city, for the card grids that let a
 * visitor choose one.
 *
 * The count is how many documented places we can actually show for that city,
 * not an estimate of how many exist — a card that promises 900 and opens on
 * 300 is a card that lied.
 */
export async function fetchCityOverviews(
  centres: PinCentre[],
  { perCity = 300, radius = 10000 }: { perCity?: number; radius?: number } = {}
): Promise<Map<string, { photo?: string; count: number }>> {
  const result = new Map<string, { photo?: string; count: number }>();
  if (centres.length === 0) return result;

  const summaries = await fetchWikiSummaries(centres.map((c) => c.wikiTitle));

  await Promise.all(
    centres.map(async (c) => {
      const s = summaries.get(c.wikiTitle);
      if (typeof s?.lat !== "number" || typeof s?.lon !== "number") {
        result.set(c.wikiTitle, { photo: s?.thumbnail, count: 0 });
        return;
      }
      const places = await fetchNearbyPlaces(s.lat, s.lon, { radius, limit: perCity });

      // Not every city's article carries a lead photo — smaller ones often
      // don't. Rather than leave the card as a bare tile, borrow a photo from
      // one of the city's own notable places: it's still a real, sourced
      // picture of somewhere in that city, which is what the card is
      // promising. Only the nearest few are checked, since they're the ones
      // closest to the centre and most likely to be the landmark a visitor
      // pictures when they think of the place.
      let photo = s.thumbnail;
      if (!photo && places.length > 0) {
        const nearest = [...places].sort((a, b) => a.distance - b.distance).slice(0, 20);
        const thumbs = await fetchThumbnails(nearest.map((p) => p.pageId));
        photo = nearest.map((p) => thumbs.get(p.pageId)).find(Boolean);
      }

      result.set(c.wikiTitle, { photo, count: places.length });
    })
  );

  return result;
}
