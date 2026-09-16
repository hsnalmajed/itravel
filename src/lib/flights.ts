import type { FlightOffer, HotelOffer, RoomType, SearchParams } from "./types";
import { DESTINATIONS } from "./destinations";
import { AIRPORTS } from "./airports";
import { occupancy, roomCapacity } from "./stayType";

// ---------------------------------------------------------------------------
// Real data provider: Duffel (https://duffel.com)
//
// We previously used Amadeus for Developers' self-service API, but Amadeus
// fully decommissioned that self-service portal on July 17, 2026 (it now
// requires an enterprise sales process). Duffel is the modern self-serve
// replacement: one API for both flights (300+ airlines) and hotels (Duffel
// Stays, 2M+ properties), instant test-mode signup, pay-as-you-go with no
// monthly fee (searches are free; small fees only apply to confirmed
// bookings). Set DUFFEL_API_KEY to enable real data; without it, or if a
// call fails, we fall back to deterministic mock data so the site always
// renders something.
// ---------------------------------------------------------------------------

const DUFFEL_BASE = "https://api.duffel.com";

function hasDuffelCredentials() {
  return Boolean(process.env.DUFFEL_API_KEY);
}

async function duffelPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${DUFFEL_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
      "Duffel-Version": "v2",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Duffel API error ${path}: ${res.status} ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

// Minimal shapes for the parts of Duffel's responses we actually read.
interface DuffelCarrier {
  name: string;
  iata_code?: string;
}
interface DuffelSegment {
  departing_at: string;
  arriving_at: string;
  origin?: { iata_code: string };
  destination?: { iata_code: string };
  marketing_carrier?: DuffelCarrier;
  operating_carrier?: DuffelCarrier;
}
interface DuffelSlice {
  origin: { iata_code: string };
  destination: { iata_code: string };
  duration?: string;
  segments: DuffelSegment[];
}
interface DuffelBaggage {
  type?: string; // "checked" | "carry_on"
  quantity?: number;
}
interface DuffelOfferPassenger {
  baggages?: DuffelBaggage[];
}
interface DuffelOfferRaw {
  id?: string;
  total_amount: string;
  total_currency: string;
  slices: DuffelSlice[];
  // Best-effort field name from Duffel's offer schema — not yet verified
  // against a live response since real keys aren't activated. Defaults to
  // "no baggage" if the field is absent or shaped differently.
  passengers?: DuffelOfferPassenger[];
}
interface DuffelOfferRequestResponse {
  data?: { offers?: DuffelOfferRaw[] };
}
interface DuffelAccommodation {
  id?: string;
  name: string;
  rating?: number;
  location?: { geographic_coordinates?: { latitude: number; longitude: number } };
  photos?: { url?: string }[];
}
interface DuffelStayResult {
  id?: string;
  cheapest_rate_total_amount?: string;
  cheapest_rate_currency?: string;
  // Best-effort field name — Duffel Stays' actual board-type field may live
  // elsewhere (e.g. per-room rate); verify once real keys are activated.
  cheapest_rate_board_type?: string;
  accommodation?: DuffelAccommodation;
}
interface DuffelStaysSearchResponse {
  data?: { results?: DuffelStayResult[] };
}

// Approximate city-center coordinates for Duffel Stays' geo search. Only
// cities we already support in CITY_TO_IATA / DESTINATIONS need an entry;
// unknown destinations transparently fall back to mock hotel data.
const IATA_COORDS: Record<string, { lat: number; lon: number }> = {
  RUH: { lat: 24.7136, lon: 46.6753 },
  JED: { lat: 21.4858, lon: 39.1925 },
  DMM: { lat: 26.4207, lon: 50.0888 },
  MED: { lat: 24.5247, lon: 39.5692 },
  AHB: { lat: 18.2164, lon: 42.5053 },
  DXB: { lat: 25.2048, lon: 55.2708 },
  AUH: { lat: 24.4539, lon: 54.3773 },
  DOH: { lat: 25.2854, lon: 51.5310 },
  KWI: { lat: 29.3759, lon: 47.9774 },
  BAH: { lat: 26.2285, lon: 50.5860 },
  MCT: { lat: 23.5859, lon: 58.4059 },
  CAI: { lat: 30.0444, lon: 31.2357 },
  IST: { lat: 41.0082, lon: 28.9784 },
  LON: { lat: 51.5072, lon: -0.1276 },
  PAR: { lat: 48.8566, lon: 2.3522 },
  DUB: { lat: 53.3498, lon: -6.2603 },
  ROM: { lat: 41.9028, lon: 12.4964 },
  BCN: { lat: 41.3874, lon: 2.1686 },
  MAD: { lat: 40.4168, lon: -3.7038 },
  KUL: { lat: 3.1390, lon: 101.6869 },
  BKK: { lat: 13.7563, lon: 100.5018 },
  JKT: { lat: -6.2088, lon: 106.8456 },
  NYC: { lat: 40.7128, lon: -74.0060 },
  GYD: { lat: 40.4093, lon: 49.8671 },
  TBS: { lat: 41.7151, lon: 44.8271 },
};

// A small static lookup so users can type city names in Arabic or English.
// Falls through to using the raw input (uppercased) as an IATA code if unknown.
const CITY_TO_IATA: Record<string, string> = {
  "الرياض": "RUH", riyadh: "RUH",
  "جدة": "JED", jeddah: "JED", jedda: "JED",
  "الدمام": "DMM", dammam: "DMM",
  "المدينة": "MED", "المدينة المنورة": "MED", medina: "MED",
  "مكة": "JED", makkah: "JED", mecca: "JED",
  "أبها": "AHB", abha: "AHB",
  "دبي": "DXB", dubai: "DXB",
  "أبوظبي": "AUH", "ابوظبي": "AUH", "abu dhabi": "AUH",
  "الدوحة": "DOH", doha: "DOH",
  "الكويت": "KWI", kuwait: "KWI",
  "المنامة": "BAH", manama: "BAH", bahrain: "BAH",
  "مسقط": "MCT", muscat: "MCT",
  "القاهرة": "CAI", cairo: "CAI",
  "اسطنبول": "IST", "إسطنبول": "IST", istanbul: "IST",
  "لندن": "LON", london: "LON",
  "باريس": "PAR", paris: "PAR",
  "دبلن": "DUB", dublin: "DUB",
  "روما": "ROM", rome: "ROM",
  "برشلونة": "BCN", barcelona: "BCN",
  "مدريد": "MAD", madrid: "MAD",
  "كوالالمبور": "KUL", "kuala lumpur": "KUL",
  "بانكوك": "BKK", bangkok: "BKK",
  "جاكرتا": "JKT", jakarta: "JKT",
  "نيويورك": "NYC", "new york": "NYC",
};

// Merge in every discover-mode destination's ar/en names so cards built from
// DestinationSuggestion always resolve back to the right IATA code, even for
// cities (e.g. Baku, Tbilisi) not covered by the hand-written list above.
for (const d of DESTINATIONS) {
  CITY_TO_IATA[d.nameAr.toLowerCase()] = d.code;
  CITY_TO_IATA[d.nameEn.toLowerCase()] = d.code;
}

export function resolveIata(input: string): string {
  const key = input.trim().toLowerCase();
  if (CITY_TO_IATA[key]) return CITY_TO_IATA[key];
  const cleaned = input.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(cleaned)) return cleaned;
  // Fallback: first 3 letters, not accurate but keeps the demo running
  return cleaned.replace(/[^A-Z]/g, "").slice(0, 3) || "RUH";
}

function minutesBetween(a: string, b: string) {
  return Math.max(30, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));
}

function parseIsoDurationMinutes(iso?: string): number | null {
  if (!iso) return null;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || "0", 10);
  const mins = parseInt(match[2] || "0", 10);
  const total = hours * 60 + mins;
  return total > 0 ? total : null;
}

function addDaysIso(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Common connecting hubs used to generate a plausible layover city for mock
// one-stop itineraries.
const LAYOVER_HUBS = ["DXB", "DOH", "IST", "CAI", "AUH", "AMM"];

function pickLayoverCity(rand: () => number, origin: string, destination: string): string {
  const candidates = LAYOVER_HUBS.filter((c) => c !== origin && c !== destination);
  const pool = candidates.length ? candidates : LAYOVER_HUBS;
  return pool[Math.floor(rand() * pool.length)];
}

// Full-service carriers include checked baggage far more often than
// budget/low-cost carriers — used to make mock baggage inclusion realistic.
const FULL_SERVICE_AIRLINE_CODES = new Set(["SV", "TK", "EK", "QR"]);

function mockBaggageIncluded(rand: () => number, airlineCode: string): boolean {
  const probability = FULL_SERVICE_AIRLINE_CODES.has(airlineCode) ? 0.85 : 0.25;
  return rand() < probability;
}

function mockBreakfastIncluded(rand: () => number, stars: number): boolean {
  const probability = Math.min(0.85, 0.25 + stars * 0.12);
  return rand() < probability;
}

function mockDistanceFromCenterKm(rand: () => number, stars: number): number {
  const spread = stars >= 4 ? 4 : 9;
  return Math.round((0.3 + rand() * spread) * 10) / 10;
}

const ROOM_TYPES: RoomType[] = ["single", "twin", "double", "triple", "suite", "apartment"];
// Weighted so double rooms (the most common hotel inventory) come up most
// often, with apartments/suites rarer — roughly mirrors real availability.
const ROOM_TYPE_WEIGHTS = [0.12, 0.18, 0.38, 0.14, 0.08, 0.1];

/**
 * A room the party can actually sleep in, at a hotel that would actually
 * have it.
 *
 * Two things were wrong. The generator offered a "single · one bed" to two
 * adults, because it never saw the party size — the search form worked out
 * the right room type and put it in the URL, and then the offer pipeline
 * ignored it. And it offered a *suite* in a one-star hotel for 280 riyals,
 * because star rating and room type were drawn independently.
 *
 * So the pool is filtered twice before the weighted draw: to rooms that fit
 * the party, and to rooms the property's class would plausibly sell.
 */
function mockRoomType(rand: () => number, guests: number, stars: number): RoomType {
  const fits = ROOM_TYPES.filter((t) => {
    if (roomCapacity(t) < guests) return false;
    // Suites are a four-star-and-up product; a one-star property sells rooms.
    if (t === "suite" && stars < 4) return false;
    return true;
  });
  // A party too large for anything in the list still needs somewhere to
  // sleep: the largest option is the honest answer.
  const pool = fits.length ? fits : ["apartment" as RoomType];

  const weights = pool.map((t) => ROOM_TYPE_WEIGHTS[ROOM_TYPES.indexOf(t)]);
  const total = weights.reduce((n, w) => n + w, 0);
  let r = rand() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// Fare-weight per passenger type: children pay a discounted fare, infants
// (usually lap infants) a small fraction — matches typical airline pricing.
function travelerWeight(params: SearchParams): number {
  const children = params.childrenAges?.length ?? 0;
  const infants = params.infants ?? 0;
  return Math.max(1, params.adults) + children * 0.75 + infants * 0.1;
}

/**
 * Which carrier can plausibly fly which route.
 *
 * Without this the generator offered flyadeal — a Saudi domestic low-cost
 * airline — from Riyadh to Cairo with a stop in Doha, and sold Emirates as a
 * *direct* flight to Bahrain. Both are impossible, and a traveller who knows
 * the region spots them instantly, which costs more trust than a rough price
 * ever could.
 *
 * Two rules capture almost all of it:
 *
 *  - A **hub carrier** (Emirates, Qatar, Turkish) flies its own hub and
 *    nothing else. It can only be direct when one end of the trip *is* the
 *    hub; otherwise the itinerary connects there, and the layover city is
 *    the hub, not a hub picked at random.
 *  - A **national carrier** (Saudia, flynas, flyadeal) needs one end of the
 *    trip in its own country. The two low-cost ones also have a range: a
 *    narrow-body fleet does not reach Tokyo.
 */
interface MockAirline {
  code: string;
  name: string;
  /** The single airport this carrier connects through, if it is a hub carrier. */
  hub?: string;
  /** Country (as spelled in AIRPORTS.countryEn) one endpoint must be in. */
  homeCountry?: string;
  /** Furthest great-circle distance this carrier's fleet serves, in km. */
  rangeKm?: number;
}

const MOCK_AIRLINES: MockAirline[] = [
  { code: "SV", name: "Saudia", homeCountry: "Saudi Arabia" },
  { code: "XY", name: "flynas", homeCountry: "Saudi Arabia", rangeKm: 5200 },
  { code: "F3", name: "flyadeal", homeCountry: "Saudi Arabia", rangeKm: 3200 },
  { code: "TK", name: "Turkish Airlines", hub: "IST" },
  { code: "EK", name: "Emirates", hub: "DXB" },
  { code: "QR", name: "Qatar Airways", hub: "DOH" },
];

function countryOfAirport(iata: string): string | undefined {
  return AIRPORTS.find((a) => a.iata === iata)?.countryEn;
}

/** Great-circle distance when we have coordinates for both ends. */
function routeDistanceKm(origin: string, destination: string): number | null {
  const a = IATA_COORDS[origin];
  const b = IATA_COORDS[destination];
  if (!a || !b) return null;
  return haversineKm(a.lat, a.lon, b.lat, b.lon);
}

function airlineServesRoute(airline: MockAirline, origin: string, destination: string): boolean {
  if (airline.hub) {
    // A hub carrier will sell this trip via its hub from almost anywhere —
    // it just cannot be the hub at both ends.
    return origin !== destination;
  }
  if (airline.homeCountry) {
    const home =
      countryOfAirport(origin) === airline.homeCountry ||
      countryOfAirport(destination) === airline.homeCountry;
    if (!home) return false;
    if (airline.rangeKm) {
      const km = routeDistanceKm(origin, destination);
      // Unknown coordinates: let it through rather than emptying the list.
      if (km !== null && km > airline.rangeKm) return false;
    }
    return true;
  }
  return true;
}

/**
 * How many stops this carrier must make on this route, and where.
 *
 * A hub carrier touching neither end of the trip has to connect at its hub —
 * that is the whole shape of its network — so "direct" is not a choice the
 * random number generator gets to make.
 */
function mockStops(
  rand: () => number,
  airline: MockAirline,
  origin: string,
  destination: string,
  directOnly: boolean
): { stops: number; layoverCity: string | null } {
  const mustConnectAt =
    airline.hub && origin !== airline.hub && destination !== airline.hub ? airline.hub : null;

  if (mustConnectAt) {
    // Asking for direct-only removes this carrier from the route entirely;
    // the caller drops offers with stops when directFlightsOnly is set.
    return { stops: 1, layoverCity: mustConnectAt };
  }
  if (directOnly) return { stops: 0, layoverCity: null };

  // A third of itineraries are non-stop, the rest take one connection. The
  // old expression here was `Math.floor(rand() * 3 === 0 ? 0 : rand() * 2)`,
  // which parses as a comparison rather than a remainder: it was never zero,
  // so the intended one-in-three direct never happened.
  const stops = rand() < 0.34 ? 0 : 1;
  return {
    stops,
    layoverCity: stops > 0 ? pickLayoverCity(rand, origin, destination) : null,
  };
}

export function generateMockFlights(params: SearchParams): FlightOffer[] {
  const origin = resolveIata(params.origin);
  const destination = resolveIata(params.destination);
  // Seeded on the *resolved* codes, so the same trip reached from the
  // discover cards and from the results page produces the same offers —
  // see the note on stableSearchKey below.
  const rand = seededRandom(`${origin}${destination}${params.departDate}`);
  const basePrice = 350 + Math.floor(rand() * 1400);
  const weight = travelerWeight(params);

  const carriers = MOCK_AIRLINES.filter((a) => airlineServesRoute(a, origin, destination));
  // Every route keeps at least the hub carriers, so this is a guard, not a
  // path we expect to take.
  const pool = carriers.length ? carriers : MOCK_AIRLINES.filter((a) => a.hub);

  const offers: FlightOffer[] = [];
  const count = 6;
  for (let i = 0; i < count; i++) {
    const airline = pool[Math.floor(rand() * pool.length)];
    const { stops, layoverCity } = mockStops(
      rand,
      airline,
      origin,
      destination,
      Boolean(params.directFlightsOnly)
    );
    const durationMinutes = 90 + Math.floor(rand() * 500) + stops * 90;
    const priceFactor = 0.75 + rand() * 0.7 - stops * 0.08;
    const price = Math.max(180, Math.round((basePrice * priceFactor * weight) / 5) * 5);
    const departHour = 1 + Math.floor(rand() * 22);
    const departTime = `${params.departDate}T${String(departHour).padStart(2, "0")}:${rand() > 0.5 ? "00" : "30"}:00`;
    const arriveTime = new Date(new Date(departTime).getTime() + durationMinutes * 60000).toISOString();
    offers.push({
      id: `mock-flight-${i}`,
      airline: airline.name,
      airlineCode: airline.code,
      origin,
      destination,
      departTime,
      arriveTime,
      durationMinutes,
      stops,
      price,
      currency: params.currency,
      isMock: true,
      bookingHint: airline.name,
      layoverCity,
      layoverDurationMinutes: stops > 0 ? 45 + Math.floor(rand() * 180) : null,
      baggageIncluded: mockBaggageIncluded(rand, airline.code),
    });
  }
  return offers
    .filter((o) => !params.directFlightsOnly || o.stops === 0)
    .filter((o) => !params.baggageIncluded || o.baggageIncluded)
    .sort((a, b) => a.price - b.price);
}

const MOCK_HOTEL_NAMES = [
  "Grand Plaza Hotel", "Boutique Garden Suites", "City Center Inn",
  "Skyline Tower Hotel", "Al Waha Resort", "Marina View Hotel",
  "Heritage Palace Hotel", "Comfort Stay Residence",
];

export function generateMockHotels(params: SearchParams, nights: number): HotelOffer[] {
  const destination = resolveIata(params.destination);
  // Same resolved code as the flight seed, for the same reason: the offers a
  // traveller sees on a suggestion card must be the offers they find when
  // they open it.
  const rand = seededRandom(`${destination}${params.departDate}h`);
  const minStars = params.minHotelStars || 1;
  const party = occupancy({
    adults: params.adults,
    childrenAges: params.childrenAges ?? [],
    infants: params.infants ?? 0,
  });
  // A party bigger than the largest single unit is sold more than one of
  // them. Sizing every room to the whole party instead returned nothing at
  // all for seven people, and the destination vanished from the results with
  // no explanation — the worst of the three possible answers.
  const LARGEST_UNIT = roomCapacity("apartment");
  const units = Math.max(1, Math.ceil(party / LARGEST_UNIT));
  const guests = Math.ceil(party / units);
  const offers: HotelOffer[] = [];
  for (let i = 0; i < 8; i++) {
    const stars = Math.min(5, minStars + Math.floor(rand() * (6 - minStars)));
    const basePerNight = 120 + stars * 90 + Math.floor(rand() * 200);
    const pricePerNight = Math.round(basePerNight / 5) * 5;
    offers.push({
      id: `mock-hotel-${i}`,
      name: `${MOCK_HOTEL_NAMES[i % MOCK_HOTEL_NAMES.length]} ${destination}`,
      stars,
      city: destination,
      pricePerNight: pricePerNight * units,
      totalPrice: pricePerNight * units * nights,
      currency: params.currency,
      nights,
      units,
      rating: Math.round((7 + rand() * 3) * 10) / 10,
      isMock: true,
      bookingHint: MOCK_HOTEL_NAMES[i % MOCK_HOTEL_NAMES.length],
      distanceFromCenterKm: mockDistanceFromCenterKm(rand, stars),
      breakfastIncluded: mockBreakfastIncluded(rand, stars),
      roomType: mockRoomType(rand, guests, stars),
    });
  }
  return (
    offers
      .filter((h) => h.stars >= minStars)
      .filter((h) => !params.breakfastIncluded || h.breakfastIncluded)
      // The requested room type is a floor, not an exact match. Asking for an
      // apartment for five people used to compare strings, and since only one
      // in ten generated rooms was an apartment it frequently returned
      // nothing at all — which made the destination vanish from the results
      // with no explanation. Anything that sleeps the party qualifies.
      .filter((h) => roomCapacity(h.roomType) >= guests)
      .sort((a, b) => a.totalPrice - b.totalPrice)
  );
}

export async function searchFlights(params: SearchParams): Promise<FlightOffer[]> {
  if (!hasDuffelCredentials()) {
    return generateMockFlights(params);
  }
  try {
    const origin = resolveIata(params.origin);
    const destination = resolveIata(params.destination);
    const slices: { origin: string; destination: string; departure_date: string }[] = [
      { origin, destination, departure_date: params.departDate },
    ];
    if (params.returnDate) {
      slices.push({ origin: destination, destination: origin, departure_date: params.returnDate });
    }

    // Duffel accepts either {type: "adult"} or {age} per passenger — children
    // and infants are specified by age so Duffel applies the right fare.
    const passengers: ({ type: "adult" } | { age: number })[] = [
      ...Array.from({ length: params.adults || 1 }, () => ({ type: "adult" as const })),
      ...(params.childrenAges ?? []).map((age) => ({ age })),
      ...Array.from({ length: params.infants ?? 0 }, () => ({ age: 0 })),
    ];

    const data = await duffelPost<DuffelOfferRequestResponse>(
      "/air/offer_requests?return_offers=true",
      {
        data: {
          slices,
          passengers,
          cabin_class: "economy",
          max_connections: params.directFlightsOnly ? 0 : 2,
        },
      }
    );

    const rawOffers = data.data?.offers ?? [];
    const offers: FlightOffer[] = rawOffers.map((offer, idx) => {
      const outbound = offer.slices[0];
      const segments = outbound.segments;
      const first = segments[0];
      const last = segments[segments.length - 1];
      const carrier = first.marketing_carrier ?? first.operating_carrier;
      const stops = segments.length - 1;
      // Layover city/duration are derived directly from segment timestamps —
      // reliable regardless of Duffel's exact offer schema. Baggage is a
      // best-effort read of `passengers[].baggages` (see interface note
      // above); defaults to false if that shape doesn't match.
      const layoverSegment = stops > 0 ? segments[0] : null;
      return {
        id: offer.id ?? `duffel-flight-${idx}`,
        airline: carrier?.name ?? "Unknown",
        airlineCode: carrier?.iata_code ?? "",
        origin: outbound.origin.iata_code,
        destination: outbound.destination.iata_code,
        departTime: first.departing_at,
        arriveTime: last.arriving_at,
        durationMinutes:
          parseIsoDurationMinutes(outbound.duration) ?? minutesBetween(first.departing_at, last.arriving_at),
        stops,
        price: Math.round(parseFloat(offer.total_amount)),
        currency: offer.total_currency,
        isMock: false,
        bookingHint: carrier?.name ?? "Duffel",
        layoverCity: layoverSegment?.destination?.iata_code ?? null,
        layoverDurationMinutes:
          stops > 0 ? minutesBetween(segments[0].arriving_at, segments[1].departing_at) : null,
        baggageIncluded: Boolean(
          offer.passengers?.[0]?.baggages?.some((b) => b.type === "checked" && (b.quantity ?? 0) > 0)
        ),
      } as FlightOffer;
    });

    const filtered = offers
      .filter((o) => !params.directFlightsOnly || o.stops === 0)
      .filter((o) => !params.baggageIncluded || o.baggageIncluded);
    if (!filtered.length) return generateMockFlights(params);
    return filtered.sort((a, b) => a.price - b.price);
  } catch (err) {
    console.error("Falling back to mock flights (Duffel):", err);
    return generateMockFlights(params);
  }
}

export async function searchHotels(params: SearchParams, nights: number): Promise<HotelOffer[]> {
  if (!hasDuffelCredentials()) {
    return generateMockHotels(params, nights);
  }
  try {
    const destIata = resolveIata(params.destination);
    const coords = IATA_COORDS[destIata];
    if (!coords) {
      // We don't have coordinates for this destination yet — stay safe with
      // demo data rather than sending a search Duffel would reject.
      return generateMockHotels(params, nights);
    }
    const checkOutDate = params.returnDate || addDaysIso(params.departDate, nights);

    const data = await duffelPost<DuffelStaysSearchResponse>("/stays/search", {
      data: {
        location: {
          geographic_coordinates: { latitude: coords.lat, longitude: coords.lon },
          radius: 15,
        },
        check_in_date: params.departDate,
        check_out_date: checkOutDate,
        guests: Array.from({ length: params.adults || 1 }, () => ({ type: "adult" })),
        rooms: 1,
      },
    });

    const results = data.data?.results ?? [];
    const offers: HotelOffer[] = results
      .filter((r) => r.cheapest_rate_total_amount && r.accommodation)
      .map((r, idx) => {
        const total = parseFloat(r.cheapest_rate_total_amount as string);
        const stars = r.accommodation?.rating ? Math.round(r.accommodation.rating) : 0;
        const geo = r.accommodation?.location?.geographic_coordinates;
        // Distance from the searched city center: computed precisely when
        // Duffel returns the property's coordinates, otherwise a stable
        // per-property estimate (still deterministic, never random per call).
        const distanceFromCenterKm = geo
          ? Math.round(haversineKm(coords.lat, coords.lon, geo.latitude, geo.longitude) * 10) / 10
          : mockDistanceFromCenterKm(seededRandom(r.accommodation?.id ?? r.id ?? String(idx)), stars);
        // Best-effort board-type read — see DuffelStayResult note above.
        const breakfastIncluded = Boolean(r.cheapest_rate_board_type?.toLowerCase().includes("breakfast"));
        // Duffel Stays doesn't expose bed configuration at the search-result
        // level (it's a per-room-rate detail) — fall back to the same stable
        // per-property estimate used for distance until that's wired up.
        const roomType = mockRoomType(
          seededRandom(`${r.accommodation?.id ?? r.id ?? String(idx)}bed`),
          occupancy({
            adults: params.adults,
            childrenAges: params.childrenAges ?? [],
            infants: params.infants ?? 0,
          }),
          stars
        );
        return {
          id: r.accommodation?.id ?? r.id ?? `duffel-hotel-${idx}`,
          name: r.accommodation?.name ?? "Hotel",
          stars,
          city: params.destination,
          pricePerNight: Math.round(total / nights),
          totalPrice: Math.round(total),
          currency: r.cheapest_rate_currency ?? params.currency,
          nights,
          isMock: false,
          bookingHint: r.accommodation?.name ?? "Duffel",
          distanceFromCenterKm,
          breakfastIncluded,
          roomType,
          photoUrl: r.accommodation?.photos?.find((ph) => ph?.url)?.url,
        } as HotelOffer;
      })
      // Unrated (stars === 0) properties are kept rather than dropped, since
      // Duffel doesn't always return a star rating.
      .filter((h) => h.stars === 0 || h.stars >= (params.minHotelStars || 0))
      .filter((h) => !params.breakfastIncluded || h.breakfastIncluded)
      .filter((h) => !params.roomType || h.roomType === params.roomType);

    if (!offers.length) return generateMockHotels(params, nights);
    return offers.sort((a, b) => a.totalPrice - b.totalPrice);
  } catch (err) {
    console.error("Falling back to mock hotels (Duffel):", err);
    return generateMockHotels(params, nights);
  }
}
