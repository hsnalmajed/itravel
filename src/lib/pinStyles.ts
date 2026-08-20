// Pin appearance lives here, deliberately apart from the map component.
//
// MapCanvas imports Leaflet at module scope, and Leaflet reaches for `window`
// the moment it loads. Server components need these styles to render the map
// legend, so importing them *from* MapCanvas would drag Leaflet into the
// server bundle and crash the request. Keeping them in a plain module with no
// browser dependencies lets both sides share one definition.

export type PinCategory =
  // From the curated country guide.
  | "attraction"
  | "activity"
  // Discovered on a city map, sorted by what Wikipedia says the place is.
  | "historic"
  | "food"
  | "cityActivity"
  | "place";

// Each kind of place gets its own colour *and* its own glyph — colour alone
// would leave the categories indistinguishable to anyone with colour vision
// deficiency, and unreadable in a printed screenshot.
export const PIN_STYLES: Record<PinCategory, { color: string; glyph: string }> = {
  attraction: { color: "#0f5132", glyph: "🏛" },
  activity: { color: "#c2410c", glyph: "🎟" },
  historic: { color: "#0f5132", glyph: "🏛" },
  food: { color: "#b91c1c", glyph: "🍽" },
  cityActivity: { color: "#c2410c", glyph: "🎟" },
  place: { color: "#1e50a2", glyph: "📍" },
};
