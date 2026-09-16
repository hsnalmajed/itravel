import type { Locale } from "./types";

// Compact "1h 30m" / "١س ٣٠د"-style duration formatting shared by every
// place that shows flight duration or layover length.
export function formatDuration(totalMinutes: number, locale: Locale): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (locale === "ar") {
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}س`);
    if (m > 0 || h === 0) parts.push(`${m}د`);
    return parts.join(" ");
  }
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h === 0) parts.push(`${m}m`);
  return parts.join(" ");
}

/**
 * "6 مدن" / "6 cities".
 *
 * Arabic counts nouns in four shapes, not two: one city, two cities, three
 * to ten (broken plural), and eleven upwards (singular again). Writing
 * "{count} مدينة" for every number reads as broken Arabic to a native
 * speaker, which on a commercial site is the kind of detail that costs
 * trust — so each shape gets its own string.
 */
export function cityCountLabel(
  count: number,
  dict: { citiesCount: string; cityOne: string; cityTwo: string; cityFew: string }
): string {
  if (count === 1) return dict.cityOne;
  if (count === 2) return dict.cityTwo;
  if (count >= 3 && count <= 10) return dict.cityFew.replace("{count}", String(count));
  return dict.citiesCount.replace("{count}", String(count));
}

/**
 * The same four Arabic shapes, for any noun.
 *
 * `cityCountLabel` above solved this for cities before a second noun needed
 * it. This is that logic with the noun's four strings passed in, so months —
 * and whatever comes next — never have to repeat it. English supplies the
 * same string for `two` and `few`, which collapses it back to the usual
 * singular/plural pair at no cost.
 */
export interface CountShapes {
  /** The "{count} x" form, used for 11 and above (and for all of English). */
  many: string;
  one: string;
  two: string;
  /** 3-10, the Arabic broken plural. */
  few: string;
}

export function countLabel(count: number, shapes: CountShapes): string {
  if (count === 1) return shapes.one;
  if (count === 2) return shapes.two;
  if (count >= 3 && count <= 10) return shapes.few.replace("{count}", String(count));
  return shapes.many.replace("{count}", String(count));
}

/**
 * "6 أماكن" / "6 places".
 *
 * The city cards were reading "6 مكان", which is the singular — correct
 * English grammar applied to Arabic, and wrong in the same way "6 place"
 * would be. Four shapes, like every other counted noun on the site.
 */
export function placeCountLabel(
  count: number,
  dict: { placesCount: string; placeOne: string; placeTwo: string; placeFew: string }
): string {
  return countLabel(count, {
    many: dict.placesCount,
    one: dict.placeOne,
    two: dict.placeTwo,
    few: dict.placeFew,
  });
}
