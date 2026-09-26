// When each city is in season — from its own measured weather.
//
// The country guides carry a hand-written "best months" line, and for a
// country that spans a continent's worth of climate that line is only ever
// right for some of it: Antalya in October is not Istanbul in October, and
// Salalah's monsoon summer is Muscat's furnace. So the season is decided per
// city, from two numbers a traveller actually feels, both averaged over
// twenty years of NASA's daily record for that city's coordinates (see
// src/data/cityClimate.ts for the source and how it was collected):
//
//   - the typical afternoon high (mean daily maximum, °C)
//   - the days in the month with at least 1 mm of rain
//
// A month is "in season" for a city when both are comfortable:
//
//   18 °C ≤ afternoon high ≤ 32 °C,  and  rainy days ≤ 8.
//
// The band is deliberately wider on the warm side than a European guide's
// would be — the people using this live with Gulf summers — and the rule is
// printed on the page with the numbers beside every city, so nobody has to
// take "in season" on trust.

import { CITY_CLIMATE, type CityClimate } from "@/data/cityClimate";
import { COUNTRY_CITIES } from "@/lib/cities";

export const SEASON_RULE = { minHigh: 18, maxHigh: 32, maxRainyDays: 8 } as const;

export interface CityInSeason {
  code: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  /** Mean afternoon high for the month, °C, one decimal. */
  high: number;
  /** Mean rainy days (≥ 1 mm) in the month. */
  rainyDays: number;
}

export function isInSeason(climate: CityClimate, month: number): boolean {
  const high = climate.high[month - 1];
  const wet = climate.rainyDays[month - 1];
  return (
    high >= SEASON_RULE.minHigh && high <= SEASON_RULE.maxHigh && wet <= SEASON_RULE.maxRainyDays
  );
}

/** The months (1–12) a city is in season. */
export function seasonMonthsForCity(slug: string): number[] {
  const climate = CITY_CLIMATE[slug];
  if (!climate) return [];
  return Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => isInSeason(climate, m));
}

/**
 * Every city in season in a month, most comfortable first — closest to a
 * 25 °C afternoon, fewest rainy days.
 */
export function citiesInSeason(month: number): CityInSeason[] {
  const out: CityInSeason[] = [];
  for (const [code, cities] of Object.entries(COUNTRY_CITIES)) {
    for (const city of cities) {
      const climate = CITY_CLIMATE[city.slug];
      if (!climate || !isInSeason(climate, month)) continue;
      out.push({
        code,
        slug: city.slug,
        nameAr: city.nameAr,
        nameEn: city.nameEn,
        high: climate.high[month - 1],
        rainyDays: climate.rainyDays[month - 1],
      });
    }
  }
  const score = (c: CityInSeason) => Math.abs(c.high - 25) + c.rainyDays * 0.5;
  return out.sort((a, b) => score(a) - score(b));
}

/**
 * A short list that is not six cities from one country: the most
 * comfortable city of each country first, then the rest.
 */
export function varietyFirst(cities: CityInSeason[], count: number): CityInSeason[] {
  const seen = new Set<string>();
  const first: CityInSeason[] = [];
  const rest: CityInSeason[] = [];
  for (const c of cities) {
    if (seen.has(c.code)) rest.push(c);
    else {
      seen.add(c.code);
      first.push(c);
    }
  }
  return [...first, ...rest].slice(0, count);
}
