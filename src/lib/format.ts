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
