// Generated, not written by hand. See scripts/collect-coords.
//
// Every city centre and every curated landmark, as OpenStreetMap places
// them. Nothing else in the codebase knows a coordinate: the maps, the
// attractions guide and the landmark-to-city join all read from here, so
// there is exactly one answer to "where is Istanbul" and it came from a
// source that can be checked.
//
// Coordinates are rounded to five decimals — about a metre, far finer than
// anything a city centre needs.

export interface Point {
  lat: number;
  lon: number;
}

/** City centres, keyed by the slug in cities.ts, with their country. */
export const CITY_COORDS: Record<string, Point & { code: string }> = {};

/** Curated landmarks, keyed by "<country code>:<English name>". */
export const LANDMARK_COORDS: Record<string, Point> = {};
