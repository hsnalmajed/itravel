import { strictIata } from "@/lib/flights";
import type { SearchParams } from "@/lib/types";

/**
 * The trip, written the way the flight widget reads it.
 *
 * The White Label search box takes its starting values from one query
 * parameter on the page it loads in — `?flightSearch=RUH1611IST23112` — and,
 * when that parameter is there, runs the search itself. That string is the
 * whole reason the traveller does not have to type their trip a second time:
 * they tell us where and when once, on our own form, and the live results for
 * exactly those dates are already on screen when the page opens.
 *
 * The shape is positional, with no separators:
 *
 *     RUH 16 11 IST 23 11 2
 *     │   │  │  │   │  │  └── seats
 *     │   │  │  │   └──┴───── date home, day then month
 *     │   │  │  └───────────── where to
 *     │   └──┴──────────────── date out, day then month
 *     └──────────────────────── where from
 *
 * A one-way trip simply leaves the second date out. The year is not in it at
 * all: the widget reads a day-and-month as the next time that date comes
 * round, which is what a traveller means by "16 November" anyway.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "2026-11-16" → "1611", or null if the date is missing or unparseable. */
function dayMonth(iso: string | undefined): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${pad(day)}${pad(month)}`;
}

function iata(place: string | undefined): string | null {
  return strictIata(place || "");
}

/**
 * The code for this search, or null when the trip is not specific enough to
 * ask a real airline about — no destination, no date, nowhere to fly from.
 *
 * Seats are everyone who occupies one: adults and children. Infants travel on
 * a lap and are not part of this count, and the widget takes a single digit,
 * so nine is the ceiling.
 */
export function flightSearchCode(search: SearchParams): string | null {
  if (search.tripType === "hotel") return null;

  const from = iata(search.origin);
  const to = iata(search.destination);
  const out = dayMonth(search.departDate);
  if (!from || !to || !out || from === to) return null;

  const back = dayMonth(search.returnDate);
  const seats = Math.min(9, Math.max(1, (search.adults || 1) + (search.childrenAges?.length ?? 0)));

  return `${from}${out}${to}${back ?? ""}${seats}`;
}
