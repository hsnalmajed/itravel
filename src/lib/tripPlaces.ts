// Shared pieces for turning a plan into something a map app can open.
//
// Two rules govern everything here.
//
// First, we never invent a coordinate. A plan's activities are sentences — a
// line of an itinerary, or a dish a country is known for — and most of them
// are not a point on a map at all. Only the ones we can match to a place
// Wikipedia actually geolocated get exported, and the interface says how many
// that was rather than quietly dropping the rest.
//
// Second, "add to Google Maps" is not something a website can do to someone
// else's account. Google publishes no API for writing into a person's saved
// places, and anything claiming otherwise is asking for their password. What
// Google does support is importing a KML file into My Maps, so that is what
// we build, and the interface says so in those words.

import { normalizeSearch } from "@/lib/search";
import type { ExportPlace } from "@/lib/mapExport";

export interface CountryPlace {
  name: string;
  lat: number;
  lon: number;
  description?: string;
  category?: string;
}

/** Where a KML file is imported into the traveller's own Google account. */
export const GOOGLE_MY_MAPS_URL = "https://www.google.com/maps/d/";

/**
 * Fetch every mapped place in a country, or an empty list if we have none.
 *
 * Errors are swallowed on purpose: an export button that can't reach the API
 * should disappear, not throw a page away.
 */
export async function fetchCountryPlaces(code: string, locale: string): Promise<CountryPlace[]> {
  try {
    const res = await fetch(`/api/country-places?code=${encodeURIComponent(code)}&locale=${locale}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { places?: CountryPlace[] };
    return data.places ?? [];
  } catch {
    return [];
  }
}

/**
 * The places named in a set of lines.
 *
 * Matching is deliberately conservative — the place's own name has to appear
 * in the line, under the same Arabic-tolerant folding the search boxes use —
 * because a loose match would pin someone's evening to the wrong museum.
 * Short names are skipped entirely: a three-letter place name matches half a
 * paragraph by accident.
 */
export function matchPlacesInLines(lines: string[], places: CountryPlace[]): CountryPlace[] {
  const haystack = lines.map((line) => normalizeSearch(line)).filter(Boolean);
  if (!haystack.length) return [];

  const matched = new Map<string, CountryPlace>();
  for (const place of places) {
    const needle = normalizeSearch(place.name);
    if (needle.length < 5) continue;
    if (haystack.some((line) => line.includes(needle))) {
      matched.set(`${place.lat},${place.lon}`, place);
    }
  }
  return [...matched.values()];
}

export function toExportPlaces(places: CountryPlace[]): ExportPlace[] {
  return places.map((p) => ({
    name: p.name,
    lat: p.lat,
    lon: p.lon,
    description: p.description,
    category: p.category,
  }));
}
