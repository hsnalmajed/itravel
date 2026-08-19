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
