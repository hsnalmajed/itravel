import { NextRequest, NextResponse } from "next/server";
import { searchFlights, searchHotels } from "@/lib/flights";
import { DESTINATIONS } from "@/lib/destinations";
import type {
  DestinationPairSuggestion,
  DestinationSuggestion,
  DiscoverParams,
  SearchParams,
} from "@/lib/types";

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function suggestForDestination(
  params: DiscoverParams,
  destination: (typeof DESTINATIONS)[number],
  nights: number
): Promise<DestinationSuggestion | null> {
  const searchParams: SearchParams = {
    tripType: "both",
    origin: params.origin,
    destination: destination.code,
    departDate: params.departDate,
    returnDate: addDays(params.departDate, nights),
    adults: params.adults,
    budgetTotal: params.budgetTotal,
    currency: params.currency,
    directFlightsOnly: params.directFlightsOnly,
    minHotelStars: params.minHotelStars,
  };

  const [flights, hotels] = await Promise.all([
    searchFlights(searchParams),
    searchHotels(searchParams, nights),
  ]);

  const flight = flights[0];
  const hotel = hotels[0];
  if (!flight || !hotel) return null;

  const totalPrice = flight.price + hotel.totalPrice;
  return {
    destinationCode: destination.code,
    destinationNameAr: destination.nameAr,
    destinationNameEn: destination.nameEn,
    emoji: destination.emoji,
    flight,
    hotel,
    nights,
    totalPrice,
    currency: params.currency,
    withinBudget: totalPrice <= params.budgetTotal,
    remainingBudget: params.budgetTotal - totalPrice,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const params: DiscoverParams = {
    origin: body.origin || "",
    budgetTotal: Number(body.budgetTotal || 0),
    currency: body.currency || "SAR",
    departDate: body.departDate || "",
    nights: Math.min(Math.max(1, Number(body.nights || 5)), 21),
    adults: Math.max(1, Number(body.adults || 1)),
    directFlightsOnly: Boolean(body.directFlightsOnly),
    minHotelStars: Number(body.minHotelStars || 0),
    multiDestination: Boolean(body.multiDestination),
  };

  if (!params.origin || !params.departDate || !params.budgetTotal) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  const candidates = DESTINATIONS.filter((d) => d.code !== params.origin.toUpperCase());

  if (!params.multiDestination) {
    const results = (
      await Promise.all(candidates.map((d) => suggestForDestination(params, d, params.nights)))
    ).filter((r): r is DestinationSuggestion => r !== null);

    const within = results.filter((r) => r.withinBudget).sort((a, b) => a.remainingBudget - b.remainingBudget);
    const over = results.filter((r) => !r.withinBudget).sort((a, b) => a.totalPrice - b.totalPrice);
    const suggestions = [...within, ...over].slice(0, 8);

    return NextResponse.json({ mode: "single", suggestions });
  }

  // Multi-destination: split the trip length across two cities and pair up
  // candidates whose combined estimated cost fits the budget. This is an
  // approximation (real multi-city fares differ from two separate round-trip
  // estimates) — flagged clearly to the user in the UI.
  const halfNights = Math.max(1, Math.ceil(params.nights / 2));
  const legResults = (
    await Promise.all(candidates.map((d) => suggestForDestination(params, d, halfNights)))
  ).filter((r): r is DestinationSuggestion => r !== null);

  const pairs: DestinationPairSuggestion[] = [];
  for (let i = 0; i < legResults.length; i++) {
    for (let j = i + 1; j < legResults.length; j++) {
      const a = legResults[i];
      const b = legResults[j];
      const totalPrice = a.totalPrice + b.totalPrice;
      pairs.push({
        legs: [a, b],
        totalPrice,
        currency: params.currency,
        withinBudget: totalPrice <= params.budgetTotal,
        remainingBudget: params.budgetTotal - totalPrice,
      });
    }
  }

  const within = pairs.filter((p) => p.withinBudget).sort((a, b) => a.remainingBudget - b.remainingBudget);
  const over = pairs.filter((p) => !p.withinBudget).sort((a, b) => a.totalPrice - b.totalPrice);
  const suggestions = [...within, ...over].slice(0, 6);

  return NextResponse.json({ mode: "multi", suggestions });
}
