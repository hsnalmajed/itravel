// Putting the curated landmarks back where they belong: in a city.
//
// Each country's guide holds a handful of hand-checked landmarks — Hagia
// Sophia, Diriyah, the Grand Bazaar — with something Wikipedia's geosearch
// cannot give us: how you actually get in. Whether the ticket is free, bought
// on an official site, or arranged through a tour operator is our own checked
// information, and it is the most useful line on the card.
//
// Those landmarks used to live in a "curated guide" section on the country
// page, one level above the city that actually contains them. Someone reading
// about Istanbul had to go back up to the country to learn that Hagia Sophia
// wants a ticket booked in advance. So the section is gone and the landmarks
// come down to the city.
//
// The join is geographic, because the guide data never recorded a city. Each
// landmark's coordinates come from its own Wikipedia article, each city's from
// its own, and a landmark belongs to the nearest city within MAX_KM. A
// landmark we cannot place — no coordinates, or nothing near enough — is
// dropped rather than guessed at: showing Cappadocia under Istanbul because it
// happened to be the first city in the list would be worse than not showing it.

import { COUNTRY_CITIES, type CityEntry } from "@/lib/cities";
import { COUNTRY_GUIDES, type LandmarkEntry } from "@/lib/countryGuides";
import { fetchWikiSummaries } from "@/lib/wikipedia";

/**
 * How far a landmark may sit from a city centre and still be that city's.
 *
 * Generous on purpose: a city's airport, its ruins and its national park are
 * routinely 30-40km out and every traveller would still call them that city's.
 * Past 60km it is a day trip to somewhere else, which is a different city's
 * page — or nobody's.
 */
const MAX_KM = 60;

export interface GuideHighlight {
  landmark: LandmarkEntry;
  /**
   * The landmark's own article, so a page can build a card for it.
   *
   * Needed because geosearch does not always return a landmark that is
   * plainly in the city: Diriyah is fifteen kilometres from the middle of
   * Riyadh, outside the radius the city list is built with, and a "merge into
   * the city" that quietly dropped Diriyah from Riyadh would not be a merge.
   */
  extract?: string;
  photo?: string;
}

/** Great-circle distance in kilometres. */
function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * The curated landmarks that belong to one city.
 *
 * Returns an empty list on any failure — an unreachable Wikipedia, a landmark
 * with no coordinates, a country with no guide. The city page still has its
 * own several hundred documented places, so a missing highlight costs a line,
 * not the page.
 */
export async function fetchCityHighlights(
  countryCode: string,
  city: CityEntry
): Promise<GuideHighlight[]> {
  const landmarks = COUNTRY_GUIDES[countryCode]?.attractions ?? [];
  if (landmarks.length === 0) return [];

  const cities = COUNTRY_CITIES[countryCode] ?? [];

  // One batch for every title this needs: the landmarks and every city in the
  // country. Every city, not just this one, because "nearest" is only
  // meaningful against the others — otherwise Cappadocia would land in
  // Istanbul simply for being the city we happened to ask about.
  const summaries = await fetchWikiSummaries([
    ...landmarks.map((l) => l.wikiTitle),
    ...cities.map((c) => c.wikiTitle),
  ]);

  const cityPoints = cities
    .map((c) => {
      const s = summaries.get(c.wikiTitle);
      return typeof s?.lat === "number" && typeof s?.lon === "number"
        ? { slug: c.slug, lat: s.lat, lon: s.lon }
        : null;
    })
    .filter((c): c is { slug: string; lat: number; lon: number } => c !== null);

  if (cityPoints.length === 0) return [];

  const mine: GuideHighlight[] = [];

  for (const landmark of landmarks) {
    const s = summaries.get(landmark.wikiTitle);
    if (typeof s?.lat !== "number" || typeof s?.lon !== "number") continue;

    let nearest = cityPoints[0];
    let best = distanceKm(s.lat, s.lon, nearest.lat, nearest.lon);
    for (const point of cityPoints.slice(1)) {
      const d = distanceKm(s.lat, s.lon, point.lat, point.lon);
      if (d < best) {
        best = d;
        nearest = point;
      }
    }

    if (nearest.slug === city.slug && best <= MAX_KM) {
      mine.push({ landmark, extract: s.extract, photo: s.thumbnail });
    }
  }

  return mine;
}
