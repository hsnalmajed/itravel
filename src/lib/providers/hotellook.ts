import type { HotelOffer, SearchParams } from "@/lib/types";

/**
 * Hotel prices from Hotellook — Travelpayouts' hotel arm, same account and
 * same marker as the flights.
 *
 * What this endpoint is, and what it is not: `/api/v2/cache.json` returns the
 * cheapest nightly price *seen* for hotels in a city over a recent window. It
 * is not a live quote and not an availability check. So every offer from here
 * carries `priceOnly` and `observedAt`, and the card drops the fields this
 * source cannot fill — distance from the centre, breakfast, room type —
 * rather than printing a plausible guess beside a real price.
 *
 * What it does give, and why that is still worth showing: a real hotel name,
 * a star rating, and a floor price for the dates asked about. "Four-star in
 * Istanbul from SAR 310 a night, seen last week" is a useful, checkable
 * answer for someone deciding whether a trip fits their budget, which is the
 * question this whole site exists to answer.
 *
 * Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163
 */

const CACHE = "https://engine.hotellook.com/api/v2/cache.json";

interface HotellookRow {
  hotelId?: number;
  hotelName?: string;
  stars?: number;
  priceFrom?: number;
  priceAvg?: number;
  location?: { name?: string; country?: string };
}

function token(): string {
  return process.env.TRAVELPAYOUTS_TOKEN || "";
}

/** Hotellook's search page for a city, carrying the affiliate marker. */
export function hotellookSearchUrl(params: {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  marker: string;
}): string {
  const url = new URL("https://search.hotellook.com/");
  url.searchParams.set("destination", params.destination);
  if (params.checkIn) url.searchParams.set("checkIn", params.checkIn);
  if (params.checkOut) url.searchParams.set("checkOut", params.checkOut);
  url.searchParams.set("adults", String(Math.max(1, params.adults || 1)));
  if (params.marker) url.searchParams.set("marker", params.marker);
  return url.toString();
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The cheapest hotels seen in the destination city for these dates.
 *
 * Returns an empty array on anything unexpected — no token, no dates, a shape
 * we do not recognise, a network failure. The registry then asks the next
 * provider, and the page says it has no live prices rather than inventing
 * some.
 */
export async function searchHotellook(
  params: SearchParams,
  nights: number
): Promise<HotelOffer[]> {
  const city = (params.destination || "").trim();
  const checkIn = params.departDate;
  if (!token() || !city || !checkIn) return [];

  const checkOut = params.returnDate || addDays(checkIn, Math.max(1, nights));
  if (!checkOut) return [];

  const currency = (params.currency || "SAR").toLowerCase();
  const url = new URL(CACHE);
  url.searchParams.set("location", city);
  url.searchParams.set("checkIn", checkIn);
  url.searchParams.set("checkOut", checkOut);
  url.searchParams.set("currency", currency);
  url.searchParams.set("limit", "30");
  url.searchParams.set("token", token());

  let rows: HotellookRow[];
  try {
    const res = await fetch(url.toString(), {
      // Same reasoning as the flight cache: the data behind it changes daily
      // at most, and the Worker's subrequest budget is the real constraint.
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const body = await res.json();
    rows = Array.isArray(body) ? (body as HotellookRow[]) : [];
  } catch {
    return [];
  }

  const observedAt = new Date().toISOString();
  const offers: HotelOffer[] = [];

  for (const row of rows) {
    const perNight = Number(row.priceFrom ?? row.priceAvg);
    if (!Number.isFinite(perNight) || perNight <= 0) continue;
    const name = (row.hotelName || "").trim();
    if (!name) continue;

    offers.push({
      id: `hl-${row.hotelId ?? name}`,
      name,
      // Stars are the one quality signal this endpoint gives. Zero means the
      // source did not say, and the UI treats it as unknown rather than bad.
      stars: Number.isFinite(row.stars) ? Number(row.stars) : 0,
      city: row.location?.name || city,
      pricePerNight: Math.round(perNight),
      totalPrice: Math.round(perNight * Math.max(1, nights)),
      currency: (params.currency || "SAR").toUpperCase(),
      nights: Math.max(1, nights),
      isMock: false,
      bookingHint: "Hotellook",
      // Not given by this endpoint. Zero here means "unknown", and priceOnly
      // below is what tells the card to hide the line rather than print it.
      distanceFromCenterKm: 0,
      breakfastIncluded: false,
      roomType: "double",
      priceOnly: true,
      observedAt,
    });
  }

  return offers.sort((a, b) => a.pricePerNight - b.pricePerNight);
}
