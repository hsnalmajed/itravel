import type { FlightOffer, SearchParams } from "@/lib/types";
import type { PriceProvider } from "./types";
import { resolveIata } from "@/lib/flights";
import { searchHotellook } from "./hotellook";

/**
 * Travelpayouts — the first real price source.
 *
 * Why this one, and why not the booking APIs it replaced:
 *
 * Duffel, Amadeus, Hotelbeds and the rest are *booking* APIs. They earn when
 * a reservation completes through them, and they price accordingly — Duffel
 * charges per order and adds a per-search fee once the search-to-book ratio
 * passes 1500:1. Sfrtna never takes a booking, so that ratio is infinite by
 * construction: every search is a cost and no booking is ever ours. A pure
 * comparison site on a booking API pays to exist and earns nothing.
 *
 * Travelpayouts is the other kind: it pays *for the referral*. The same
 * account that serves the prices pays a commission when a visitor clicks
 * through and books at the other end, which is exactly this site's business
 * model, and it is self-service — no contract, no minimum, no sales call.
 *
 * ── The honest limitation ────────────────────────────────────────────────
 * The free Data API returns prices **observed over the past few days**, not a
 * live quote. Travelpayouts gates its live search behind 50,000 monthly
 * active users, and we do not have them yet.
 *
 * That is a real constraint and it is handled by telling the truth rather
 * than by dressing a cached number up as a live one. Every offer from here
 * carries `observedAt` and `priceOnly`, and the interface is required to say
 * when the price was seen. Cached prices are still worth showing — "the
 * cheapest fare seen on Riyadh→Istanbul this month" is a real, useful,
 * checkable answer — but they are not a booking, and the page must not
 * pretend otherwise.
 *
 * `priceOnly` also covers a second gap: this endpoint gives a price, a
 * carrier, a flight number and a departure time, and says nothing about
 * arrival, duration, stops or baggage. Those fields are therefore absent
 * rather than estimated. A plausible-looking timeline computed from a
 * great-circle distance would be a fabrication, and this site does not put
 * invented numbers in front of travellers.
 *
 * Credentials:
 *   TRAVELPAYOUTS_TOKEN   — the API token. Secret. A Cloudflare secret,
 *                           read on the server at run time.
 *   TRAVELPAYOUTS_MARKER  — the affiliate id. Public. A constant below, for
 *                           the reason given there.
 *
 * Docs: https://travelpayouts-data-api.readthedocs.io/
 */

const BASE = "https://api.travelpayouts.com";

/** Carrier names we can print. Anything else shows its IATA code. */
const AIRLINE_NAMES: Record<string, string> = {
  SV: "Saudia",
  XY: "flynas",
  F3: "flyadeal",
  TK: "Turkish Airlines",
  EK: "Emirates",
  QR: "Qatar Airways",
  EY: "Etihad Airways",
  GF: "Gulf Air",
  WY: "Oman Air",
  KU: "Kuwait Airways",
  MS: "EgyptAir",
  RJ: "Royal Jordanian",
  G9: "Air Arabia",
  FZ: "flydubai",
  J9: "Jazeera Airways",
  AF: "Air France",
  LH: "Lufthansa",
  BA: "British Airways",
  KL: "KLM",
  QF: "Qantas",
  SQ: "Singapore Airlines",
  MH: "Malaysia Airlines",
  GA: "Garuda Indonesia",
  TG: "Thai Airways",
  JL: "Japan Airlines",
  NH: "ANA",
  AZ: "ITA Airways",
  IB: "Iberia",
  PC: "Pegasus Airlines",
};

/** One entry of the `data[DEST]` map the v1 price endpoints return. */
interface TpPrice {
  price?: number;
  airline?: string;
  flight_number?: number | string;
  departure_at?: string;
  return_at?: string;
  expires_at?: string;
}

interface TpResponse {
  success?: boolean;
  data?: Record<string, Record<string, TpPrice>>;
  currency?: string;
}

function token(): string {
  return process.env.TRAVELPAYOUTS_TOKEN || "";
}

/**
 * The affiliate marker — the number that makes an outgoing link pay.
 *
 * It lives in the code, not in a Cloudflare secret, and that is deliberate.
 * The flight handoff is built in the browser, and a Next.js NEXT_PUBLIC_*
 * value is baked into the browser bundle at *build* time; a secret added
 * with `wrangler secret put` only exists at run time on the server, so the
 * browser would never see it and every link would go out unpaid, silently.
 *
 * Nothing is lost by committing it: the marker is not a secret. It is printed
 * in the query string of every link the site sends a visitor to. The API
 * token is the secret, and that one stays in Cloudflare.
 */
const TRAVELPAYOUTS_MARKER = "778874";

export function travelpayoutsMarker(): string {
  return process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || TRAVELPAYOUTS_MARKER;
}

/**
 * Aviasales wants the whole search encoded in the path: origin, day+month,
 * destination, day+month, then cabin letter (empty for economy) and the
 * passenger counts. PAR1607NYC2007c321 is Paris→New York, 16 July to 20
 * July, business, three adults, two children, one infant.
 *
 * Documented at
 * https://support.travelpayouts.com/hc/en-us/articles/5711895629714-Aviasales-affiliate-links
 */
export function aviasalesSearchUrl(params: {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
}): string {
  const ddmm = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const out = ddmm(params.departDate);
  if (!out) return "https://www.aviasales.com/";
  const back = params.returnDate ? ddmm(params.returnDate) : "";

  const adults = Math.min(9, Math.max(1, params.adults || 1));
  const children = Math.min(9, params.children ?? 0);
  const infants = Math.min(9, params.infants ?? 0);
  // Position matters: an infant digit is only read if a child digit precedes
  // it, so once there are infants the zero has to be written out.
  const party =
    infants > 0 ? `${adults}${children}${infants}` : children > 0 ? `${adults}${children}` : `${adults}`;

  const path = `${resolveIata(params.origin)}${out}${resolveIata(params.destination)}${back}${party}`;
  const url = new URL(`https://www.aviasales.com/search/${path}`);
  const marker = travelpayoutsMarker();
  if (marker) url.searchParams.set("marker", marker);
  return url.toString();
}

async function get(path: string, query: Record<string, string>): Promise<TpResponse | null> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v) url.searchParams.set(k, v);
  }
  try {
    const res = await fetch(url.toString(), {
      headers: { "X-Access-Token": token(), Accept: "application/json" },
      // Their data changes daily at most, and the Worker's subrequest budget
      // is the recurring production constraint on this site — an hour of
      // edge caching costs nothing in freshness and saves a call per visitor.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as TpResponse;
  } catch {
    return null;
  }
}

/**
 * The response is `{ data: { DEST: { "0": {...}, "1": {...} } } }`, keyed by
 * destination then by an index that is a string. Anything that isn't a number
 * with a price is dropped rather than coerced.
 */
function toOffers(
  body: TpResponse | null,
  params: SearchParams,
  opts: { direct: boolean; currency: string }
): FlightOffer[] {
  if (!body?.success || !body.data) return [];

  const origin = resolveIata(params.origin);
  const destination = resolveIata(params.destination);
  const bucket = body.data[destination] ?? Object.values(body.data)[0];
  if (!bucket || typeof bucket !== "object") return [];

  const offers: FlightOffer[] = [];
  for (const [key, row] of Object.entries(bucket)) {
    const price = Number(row?.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    const code = (row.airline || "").toUpperCase();

    offers.push({
      id: `tp-${destination}-${key}-${code}-${row.flight_number ?? ""}`,
      airline: AIRLINE_NAMES[code] || code || "—",
      airlineCode: code,
      origin,
      destination,
      departTime: row.departure_at || params.departDate,
      // Not given by this endpoint. Left equal to departure so nothing
      // downstream has to handle an empty string, and suppressed in the UI
      // by `priceOnly` rather than being shown as a real arrival.
      arriveTime: row.departure_at || params.departDate,
      durationMinutes: 0,
      stops: opts.direct ? 0 : 0,
      price: Math.round(price),
      currency: opts.currency.toUpperCase(),
      isMock: false,
      bookingHint: "Aviasales",
      layoverCity: null,
      layoverDurationMinutes: null,
      baggageIncluded: false,
      priceOnly: true,
      observedAt: row.expires_at || undefined,
      stopsKnown: opts.direct,
    });
  }

  return offers.sort((a, b) => a.price - b.price);
}

export const travelpayouts: PriceProvider = {
  name: "Travelpayouts",

  isConfigured() {
    return Boolean(token());
  },

  async searchFlights(params: SearchParams): Promise<FlightOffer[]> {
    const origin = resolveIata(params.origin);
    const destination = resolveIata(params.destination);
    if (!origin || !destination || !params.departDate) return [];

    const currency = (params.currency || "SAR").toLowerCase();
    const query: Record<string, string> = {
      origin,
      destination,
      depart_date: params.departDate,
      currency,
    };
    if (params.returnDate) query.return_date = params.returnDate;

    // "Direct only" is a different endpoint rather than a filter, which is
    // the only way this source can state a stop count at all.
    const path = params.directFlightsOnly ? "/v1/prices/direct" : "/v1/prices/cheap";
    const body = await get(path, query);
    return toOffers(body, params, { direct: Boolean(params.directFlightsOnly), currency });
  },

  async searchHotels(params, nights) {
    return searchHotellook(params, nights);
  },
};
