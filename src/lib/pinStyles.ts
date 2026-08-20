// Pin appearance lives here, deliberately apart from the map component.
//
// MapCanvas imports Leaflet at module scope, and Leaflet reaches for `window`
// the moment it loads. Server components need these styles to render the map
// legend, so importing them *from* MapCanvas would drag Leaflet into the
// server bundle and crash the request. Keeping them in a plain module with no
// browser dependencies lets both sides share one definition.

// The four kinds of place a traveller cares about telling apart on a map.
// These are the same four buckets `categorisePlace` sorts a Wikipedia
// description into, so a place's category never has to be translated between
// vocabularies on its way to a pin.
export type PinCategory =
  /** Landmarks, museums, mosques, palaces, ruins. */
  | "historic"
  /** Restaurants, cafés, bakeries. */
  | "food"
  /** Parks, markets, beaches, theatres, hammams. */
  | "activity"
  /** Documented, but not confidently any of the above. */
  | "place";

// Each kind of place gets its own colour *and* its own glyph — colour alone
// would leave the categories indistinguishable to anyone with colour vision
// deficiency, and unreadable in a printed screenshot.
export const PIN_STYLES: Record<PinCategory, { color: string; glyph: string }> = {
  historic: { color: "#0f5132", glyph: "🏛" },
  food: { color: "#b91c1c", glyph: "🍽" },
  activity: { color: "#c2410c", glyph: "🎟" },
  place: { color: "#1e50a2", glyph: "📍" },
};
