import { NextRequest, NextResponse } from "next/server";
import { resolveIata, searchFlights, searchHotels } from "@/lib/flights";
import type {
  FlightOffer,
  HotelOffer,
  MultiCityAdvice,
  MultiCityLegInput,
  MultiCityLegResult,
  MultiCitySearchParams,
  SearchParams,
} from "@/lib/types";

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function bestFlight(origin: string, destination: string, departDate: string, params: MultiCitySearchParams): Promise<FlightOffer | null> {
  const searchParams: SearchParams = {
    tripType: "flight",
    origin,
    destination,
    departDate,
    adults: params.adults,
    budgetTotal: params.budgetTotal,
    currency: params.currency,
    directFlightsOnly: params.directFlightsOnly,
    minHotelStars: 0,
    baggageIncluded: params.baggageIncluded,
  };
  const flights = await searchFlights(searchParams);
  return flights[0] ?? null;
}

async function bestHotel(destination: string, departDate: string, nights: number, params: MultiCitySearchParams): Promise<HotelOffer | null> {
  const searchParams: SearchParams = {
    tripType: "hotel",
    origin: params.origin,
    destination,
    departDate,
    returnDate: addDays(departDate, nights),
    adults: params.adults,
    budgetTotal: params.budgetTotal,
    currency: params.currency,
    directFlightsOnly: false,
    minHotelStars: params.minHotelStars,
    breakfastIncluded: params.breakfastIncluded,
  };
  const hotels = await searchHotels(searchParams, nights);
  return hotels[0] ?? null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rawLegs = Array.isArray(body.legs) ? body.legs : [];
  const params: MultiCitySearchParams = {
    origin: body.origin || "",
    legs: rawLegs
      .map((l: { destination?: string; nights?: number }) => ({
        destination: String(l?.destination || "").trim(),
        nights: Math.min(Math.max(1, Number(l?.nights || 1)), 30),
      }))
      .filter((l: MultiCityLegInput) => l.destination.length > 0),
    departDate: body.departDate || "",
    adults: Math.max(1, Number(body.adults || 1)),
    budgetTotal: Number(body.budgetTotal || 0),
    currency: body.currency || "SAR",
    directFlightsOnly: Boolean(body.directFlightsOnly),
    minHotelStars: Number(body.minHotelStars || 0),
    baggageIncluded: Boolean(body.baggageIncluded),
    breakfastIncluded: Boolean(body.breakfastIncluded),
  };

  if (!params.origin || !params.departDate || params.legs.length < 2) {
    return NextResponse.json(
      { error: "Missing origin, departDate, or fewer than 2 destinations" },
      { status: 400 }
    );
  }
  // Cap the number of legs so one request can't fan out into dozens of
  // sequential searches (each leg needs its own flight + hotel lookup).
  if (params.legs.length > 6) {
    params.legs = params.legs.slice(0, 6);
  }

  const legResults: MultiCityLegResult[] = [];
  let cursorCity = params.origin;
  let cursorDate = params.departDate;

  for (const leg of params.legs) {
    const [flight, hotel] = await Promise.all([
      bestFlight(cursorCity, leg.destination, cursorDate, params),
      bestHotel(leg.destination, cursorDate, leg.nights, params),
    ]);
    legResults.push({
      destination: leg.destination,
      destinationIata: resolveIata(leg.destination),
      nights: leg.nights,
      departDate: cursorDate,
      flight,
      hotel,
    });
    cursorCity = leg.destination;
    cursorDate = addDays(cursorDate, leg.nights);
  }

  const returnFlight = await bestFlight(cursorCity, params.origin, cursorDate, params);

  const totalFlightsPrice =
    legResults.reduce((sum, l) => sum + (l.flight?.price ?? 0), 0) + (returnFlight?.price ?? 0);
  const totalHotelsPrice = legResults.reduce((sum, l) => sum + (l.hotel?.totalPrice ?? 0), 0);
  const totalPrice = totalFlightsPrice + totalHotelsPrice;
  const withinBudget = params.budgetTotal > 0 ? totalPrice <= params.budgetTotal : true;
  const remainingBudget = params.budgetTotal - totalPrice;

  let advice: MultiCityAdvice | null = null;
  if (!withinBudget) {
    const overage = totalPrice - params.budgetTotal;
    const totalNights = legResults.reduce((sum, l) => sum + l.nights, 0);
    const avgHotelPerNight = totalNights > 0 ? totalHotelsPrice / totalNights : 0;
    const suggestedNightsToReduce =
      avgHotelPerNight > 0 ? Math.min(totalNights - legResults.length, Math.ceil(overage / avgHotelPerNight)) : 0;
    advice = {
      suggestedBudget: Math.ceil(totalPrice / 50) * 50,
      suggestedNightsToReduce: Math.max(0, suggestedNightsToReduce),
      canRemoveDestination: legResults.length >= 3,
    };
  }

  const isMock =
    legResults.some((l) => l.flight?.isMock || l.hotel?.isMock) || Boolean(returnFlight?.isMock);

  const result = {
    origin: params.origin,
    legs: legResults,
    returnFlight,
    totalFlightsPrice,
    totalHotelsPrice,
    totalPrice,
    currency: params.currency,
    budgetTotal: params.budgetTotal,
    withinBudget,
    remainingBudget,
    advice,
    isMock,
  };

  return NextResponse.json(result);
}
