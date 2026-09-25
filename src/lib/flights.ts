import type { FlightOffer, HotelOffer, RoomType, SearchParams } from "./types";
import { DESTINATIONS } from "./destinations";
import { AIRPORTS } from "./airports";
import { occupancy, roomCapacity } from "./stayType";
import { hasLivePrices, searchFlightsFromProviders, searchHotelsFromProviders } from "./providers";

// ---------------------------------------------------------------------------
// Prices come from the provider registry in ./providers, not from this file.
//
// This module used to call Duffel directly. Duffel is a *booking* API: it
// charges per order and adds a per-search fee once the search-to-book ratio
// passes 1500:1. Sfrtna never takes a booking, so that ratio is infinite by
// construction — every search a cost, every booking someone else's. A pure
// comparison site on a booking API pays to exist and earns nothing.
//
// What remains here is the deterministic generator below. It is not a price
// source and never reaches a visitor in production: `isMock` is true on
// everything it makes, and the results pages replace mock data with an
// honest "not yet" rather than showing an invented fare. It exists so the
// whole results surface stays testable without live credentials.
// ---------------------------------------------------------------------------

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
  const { offers } = await searchFlightsFromProviders(params);
  // With a real source configured, "nothing found" is the answer. Filling the
  // gap with sample fares would put invented numbers in front of a traveller
  // who has no way to tell them from the real ones. The demo data is only for
  // a site with no price source at all.
  if (offers.length === 0) return hasLivePrices() ? [] : generateMockFlights(params);

  return offers
    .filter((o) => !params.directFlightsOnly || o.stops === 0)
    // Baggage is only a filter when the source actually stated it. A
    // price-only offer says nothing about baggage, and dropping every such
    // fare because a box was ticked would hide the whole result set behind a
    // fact we never had.
    .filter((o) => !params.baggageIncluded || o.priceOnly || o.baggageIncluded)
    .sort((a, b) => a.price - b.price);
}

export async function searchHotels(params: SearchParams, nights: number): Promise<HotelOffer[]> {
  const { offers } = await searchHotelsFromProviders(params, nights);
  if (offers.length === 0) return hasLivePrices() ? [] : generateMockHotels(params, nights);

  return offers
    .filter((h) => h.stars === 0 || h.stars >= (params.minHotelStars || 0))
    .filter((h) => !params.breakfastIncluded || h.breakfastIncluded)
    .filter((h) => !params.roomType || h.roomType === params.roomType)
    .sort((a, b) => a.totalPrice - b.totalPrice);
}
