import type { FlightOffer, HotelOffer, SearchParams } from "./types";
import { DESTINATIONS } from "./destinations";

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
  marketing_carrier?: DuffelCarrier;
  operating_carrier?: DuffelCarrier;
}
interface DuffelSlice {
  origin: { iata_code: string };
  destination: { iata_code: string };
  duration?: string;
  segments: DuffelSegment[];
}
interface DuffelOfferRaw {
  id?: string;
  total_amount: string;
  total_currency: string;
  slices: DuffelSlice[];
}
interface DuffelOfferRequestResponse {
  data?: { offers?: DuffelOfferRaw[] };
}
interface DuffelAccommodation {
  id?: string;
  name: string;
  rating?: number;
}
interface DuffelStayResult {
  id?: string;
  cheapest_rate_total_amount?: string;
  cheapest_rate_currency?: string;
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

const MOCK_AIRLINES = [
  { code: "SV", name: "Saudia" },
  { code: "XY", name: "flynas" },
  { code: "F3", name: "flyadeal" },
  { code: "TK", name: "Turkish Airlines" },
  { code: "EK", name: "Emirates" },
  { code: "QR", name: "Qatar Airways" },
];

export function generateMockFlights(params: SearchParams): FlightOffer[] {
  const rand = seededRandom(`${params.origin}${params.destination}${params.departDate}`);
  const origin = resolveIata(params.origin);
  const destination = resolveIata(params.destination);
  const basePrice = 350 + Math.floor(rand() * 1400);
  const offers: FlightOffer[] = [];
  const count = 6;
  for (let i = 0; i < count; i++) {
    const airline = MOCK_AIRLINES[Math.floor(rand() * MOCK_AIRLINES.length)];
    const stops = params.directFlightsOnly ? 0 : Math.floor(rand() * 3 === 0 ? 0 : rand() * 2);
    const durationMinutes = 90 + Math.floor(rand() * 500) + stops * 90;
    const priceFactor = 0.75 + rand() * 0.7 - stops * 0.08;
    const price = Math.max(180, Math.round((basePrice * priceFactor * params.adults) / 5) * 5);
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
    });
  }
  return offers
    .filter((o) => !params.directFlightsOnly || o.stops === 0)
    .sort((a, b) => a.price - b.price);
}

const MOCK_HOTEL_NAMES = [
  "Grand Plaza Hotel", "Boutique Garden Suites", "City Center Inn",
  "Skyline Tower Hotel", "Al Waha Resort", "Marina View Hotel",
  "Heritage Palace Hotel", "Comfort Stay Residence",
];

export function generateMockHotels(params: SearchParams, nights: number): HotelOffer[] {
  const rand = seededRandom(`${params.destination}${params.departDate}h`);
  const destination = params.destination;
  const minStars = params.minHotelStars || 1;
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
      pricePerNight,
      totalPrice: pricePerNight * nights,
      currency: params.currency,
      nights,
      rating: Math.round((7 + rand() * 3) * 10) / 10,
      isMock: true,
      bookingHint: "Demo",
    });
  }
  return offers
    .filter((h) => h.stars >= minStars)
    .sort((a, b) => a.totalPrice - b.totalPrice);
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

    const data = await duffelPost<DuffelOfferRequestResponse>(
      "/air/offer_requests?return_offers=true",
      {
        data: {
          slices,
          passengers: Array.from({ length: params.adults || 1 }, () => ({ type: "adult" })),
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
        stops: segments.length - 1,
        price: Math.round(parseFloat(offer.total_amount)),
        currency: offer.total_currency,
        isMock: false,
        bookingHint: carrier?.name ?? "Duffel",
      } as FlightOffer;
    });

    const filtered = params.directFlightsOnly ? offers.filter((o) => o.stops === 0) : offers;
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
        } as HotelOffer;
      })
      // Unrated (stars === 0) properties are kept rather than dropped, since
      // Duffel doesn't always return a star rating.
      .filter((h) => h.stars === 0 || h.stars >= (params.minHotelStars || 0));

    if (!offers.length) return generateMockHotels(params, nights);
    return offers.sort((a, b) => a.totalPrice - b.totalPrice);
  } catch (err) {
    console.error("Falling back to mock hotels (Duffel):", err);
    return generateMockHotels(params, nights);
  }
}
