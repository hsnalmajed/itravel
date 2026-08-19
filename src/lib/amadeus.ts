import type { FlightOffer, HotelOffer, SearchParams } from "./types";
import { DESTINATIONS } from "./destinations";

// Minimal shapes for the parts of the raw Amadeus API responses we read.
// The full Amadeus schemas are much larger; we only type what we consume.
interface AmadeusFlightSegment {
  carrierCode: string;
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
}
interface AmadeusFlightOfferRaw {
  id?: string;
  itineraries: { segments: AmadeusFlightSegment[] }[];
  price: { grandTotal?: string; total: string; currency: string };
}
interface AmadeusFlightSearchResponse {
  data?: AmadeusFlightOfferRaw[];
  dictionaries?: { carriers?: Record<string, string> };
}
interface AmadeusHotelListEntry {
  hotelId: string;
}
interface AmadeusHotelListResponse {
  data?: AmadeusHotelListEntry[];
}
interface AmadeusHotelOfferRaw {
  hotel: { hotelId?: string; name: string; rating?: string };
  offers: { price: { total: string; currency: string } }[];
}
interface AmadeusHotelSearchResponse {
  data?: AmadeusHotelOfferRaw[];
}

const AMADEUS_BASE = process.env.AMADEUS_ENV === "production"
  ? "https://api.amadeus.com"
  : "https://test.api.amadeus.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

function hasAmadeusCredentials() {
  return Boolean(process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET);
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.token;
  }
  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.AMADEUS_API_KEY as string,
      client_secret: process.env.AMADEUS_API_SECRET as string,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Amadeus auth failed: ${res.status}`);
  }
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 1800) * 1000,
  };
  return cachedToken.token;
}

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
  if (!hasAmadeusCredentials()) {
    return generateMockFlights(params);
  }
  try {
    const token = await getAccessToken();
    const search = new URLSearchParams({
      originLocationCode: resolveIata(params.origin),
      destinationLocationCode: resolveIata(params.destination),
      departureDate: params.departDate,
      adults: String(params.adults || 1),
      currencyCode: params.currency,
      max: "15",
      nonStop: params.directFlightsOnly ? "true" : "false",
    });
    if (params.returnDate) search.set("returnDate", params.returnDate);

    const res = await fetch(`${AMADEUS_BASE}/v2/shopping/flight-offers?${search.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Amadeus flight search failed: ${res.status}`);
    const data: AmadeusFlightSearchResponse = await res.json();

    const offers: FlightOffer[] = (data.data ?? []).map((offer, idx) => {
      const itinerary = offer.itineraries[0];
      const segments = itinerary.segments;
      const first = segments[0];
      const last = segments[segments.length - 1];
      const carrierCode = first.carrierCode;
      const carrierName = data.dictionaries?.carriers?.[carrierCode] ?? carrierCode;
      return {
        id: offer.id ?? `flight-${idx}`,
        airline: carrierName,
        airlineCode: carrierCode,
        origin: first.departure.iataCode,
        destination: last.arrival.iataCode,
        departTime: first.departure.at,
        arriveTime: last.arrival.at,
        durationMinutes: minutesBetween(first.departure.at, last.arrival.at),
        stops: segments.length - 1,
        price: Math.round(parseFloat(offer.price.grandTotal ?? offer.price.total)),
        currency: offer.price.currency,
        isMock: false,
        bookingHint: carrierName,
      } as FlightOffer;
    });
    return offers;
  } catch (err) {
    console.error("Falling back to mock flights:", err);
    return generateMockFlights(params);
  }
}

export async function searchHotels(params: SearchParams, nights: number): Promise<HotelOffer[]> {
  if (!hasAmadeusCredentials()) {
    return generateMockHotels(params, nights);
  }
  try {
    const token = await getAccessToken();
    const cityCode = resolveIata(params.destination);

    const listRes = await fetch(
      `${AMADEUS_BASE}/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!listRes.ok) throw new Error(`Amadeus hotel list failed: ${listRes.status}`);
    const listData: AmadeusHotelListResponse = await listRes.json();
    const hotelIds = (listData.data ?? [])
      .slice(0, 20)
      .map((h) => h.hotelId)
      .join(",");
    if (!hotelIds) throw new Error("No hotels found for city");

    const search = new URLSearchParams({
      hotelIds,
      adults: String(params.adults || 1),
      checkInDate: params.departDate,
      checkOutDate: params.returnDate || params.departDate,
      currency: params.currency,
      bestRateOnly: "true",
    });
    const offersRes = await fetch(`${AMADEUS_BASE}/v3/shopping/hotel-offers?${search.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!offersRes.ok) throw new Error(`Amadeus hotel offers failed: ${offersRes.status}`);
    const offersData: AmadeusHotelSearchResponse = await offersRes.json();

    const offers: HotelOffer[] = (offersData.data ?? [])
      .filter((h) => h.offers && h.offers.length > 0)
      .map((h, idx) => {
        const offer = h.offers[0];
        const stars = parseInt(h.hotel.rating ?? "0", 10) || 0;
        const total = parseFloat(offer.price.total);
        return {
          id: h.hotel.hotelId ?? `hotel-${idx}`,
          name: h.hotel.name,
          stars,
          city: params.destination,
          pricePerNight: Math.round(total / nights),
          totalPrice: Math.round(total),
          currency: offer.price.currency,
          nights,
          isMock: false,
          bookingHint: h.hotel.name,
        } as HotelOffer;
      })
      .filter((h: HotelOffer) => h.stars >= (params.minHotelStars || 0));
    return offers;
  } catch (err) {
    console.error("Falling back to mock hotels:", err);
    return generateMockHotels(params, nights);
  }
}
