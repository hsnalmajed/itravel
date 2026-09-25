import { NextRequest, NextResponse } from "next/server";
import { findCountry } from "@/lib/countries";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchPlacesAroundCities } from "@/lib/mapPins";
import type { Locale } from "@/lib/types";

/**
 * Every mapped place in a country, with its coordinates.
 *
 * The country and city map pages resolve this on the server. The itinerary
 * and the attractions basket need the same set in the browser, to turn a plan
 * into a file a map app can open — so it is exposed here rather than
 * reading the stored OpenStreetMap data in two more places.
 *
 * Only the fields an export needs come back.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const code = (sp.get("code") || "").toUpperCase();
  const locale: Locale = sp.get("locale") === "en" ? "en" : "ar";

  const country = findCountry(code);
  if (!country) {
    return NextResponse.json({ error: "unknown_country" }, { status: 404 });
  }

  const cities = COUNTRY_CITIES[country.code] ?? [];
  if (cities.length === 0) {
    // A country with no city list isn't an error — it just has nothing mapped
    // yet, and the caller hides its export button.
    return NextResponse.json({ code: country.code, places: [] });
  }

  const places = await fetchPlacesAroundCities(cities, { locale, perCity: 120, radius: 12000 });

  return NextResponse.json({
    code: country.code,
    places: places.map((p) => ({
      name: p.name,
      lat: p.lat,
      lon: p.lon,
      description: p.description,
      category: p.category,
    })),
  });
}
