// Putting the curated landmarks back where they belong: in a city.
//
// Each country's guide holds a handful of hand-checked landmarks — Hagia
// Sophia, Diriyah, the Grand Bazaar — with something a map cannot give us:
// how you actually get in. Whether the ticket is free, bought
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
// landmark's and each city's coordinates come from OpenStreetMap (stored in
// src/data/cityCoords.ts), and a landmark belongs to the nearest city within
// MAX_KM. A landmark we cannot place is dropped rather than guessed at:
// showing Cappadocia under Istanbul because it happened to be the first city
// in the list would be worse than not showing it.

import { COUNTRY_CITIES, type CityEntry } from "@/lib/cities";
import { COUNTRY_GUIDES, type LandmarkEntry } from "@/lib/countryGuides";
import { CITY_COORDS, LANDMARK_COORDS } from "@/data/cityCoords";
import { findCountry } from "@/lib/countries";
import { searchPexelsPhotos } from "@/lib/pexels";

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
  /** Where it is, from OpenStreetMap — so a page can pin it and build a card. */
  lat: number;
  lon: number;
  /** A Pexels photograph whose caption names the landmark, when there is one. */
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
 * Returns an empty list on any failure — a landmark
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

  const cityPoints = cities
    .map((c) => {
      const p = CITY_COORDS[c.slug];
      return p ? { slug: c.slug, lat: p.lat, lon: p.lon } : null;
    })
    .filter((c): c is { slug: string; lat: number; lon: number } => c !== null);

  if (cityPoints.length === 0) return [];

  const mine: GuideHighlight[] = [];

  for (const landmark of landmarks) {
    const s = LANDMARK_COORDS[`${countryCode}:${landmark.nameEn}`];
    if (!s) continue;

    // "Nearest" is only meaningful against every city in the country, not
    // just this one — otherwise Cappadocia would land in Istanbul simply for
    // being the city we happened to ask about.
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
      mine.push({ landmark, lat: s.lat, lon: s.lon });
    }
  }

  // A photo per landmark, from Pexels, only where the caption names it.
  const country = findCountry(countryCode)?.nameEn ?? "";
  const photos = await searchPexelsPhotos(
    new Map(
      mine.map((h) => [
        h.landmark.nameEn,
        [{ query: `${h.landmark.nameEn} ${country}`, mention: [h.landmark.nameEn] }],
      ])
    )
  );
  for (const h of mine) h.photo = photos.get(h.landmark.nameEn)?.small;

  return mine;
}
