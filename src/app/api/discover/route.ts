import { NextRequest, NextResponse } from "next/server";
import { searchFlights, searchHotels } from "@/lib/flights";
import { DESTINATIONS } from "@/lib/destinations";
import type {
  DestinationPairSuggestion,
  DestinationSuggestion,
  DiscoverParams,
  SearchParams,
  TripType,
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
    tripType: params.tripType,
    origin: params.origin,
    destination: destination.code,
    departDate: params.departDate,
    returnDate: addDays(params.departDate, nights),
    adults: params.adults,
    budgetTotal: params.budgetTotal,
    currency: params.currency,
    directFlightsOnly: params.directFlightsOnly,
    minHotelStars: params.minHotelStars,
    baggageIncluded: params.baggageIncluded,
    breakfastIncluded: params.breakfastIncluded,
    childrenAges: params.childrenAges,
    infants: params.infants,
    bedType: params.bedType,
  };

  // Only the sides the user actually asked to budget for are searched —
  // "hotels only" shouldn't require a matching flight to exist, and vice versa.
  const wantsFlight = params.tripType !== "hotel";
  const wantsHotel = params.tripType !== "flight";

  const [flights, hotels] = await Promise.all([
    wantsFlight ? searchFlights(searchParams) : Promise.resolve([]),
    wantsHotel ? searchHotels(searchParams, nights) : Promise.resolve([]),
  ]);

  const flight = flights[0];
  const hotel = hotels[0];
  if (wantsFlight && !flight) return null;
  if (wantsHotel && !hotel) return null;

  const totalPrice = (flight?.price ?? 0) + (hotel?.totalPrice ?? 0);
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
    tripType: (body.tripType as TripType) || "both",
    budgetTotal: Number(body.budgetTotal || 0),
    currency: body.currency || "SAR",
    departDate: body.departDate || "",
    returnDate: body.returnDate || "",
    nights: Math.min(Math.max(1, Number(body.nights || 5)), 21),
    adults: Math.max(1, Number(body.adults || 1)),
    directFlightsOnly: Boolean(body.directFlightsOnly),
    minHotelStars: Number(body.minHotelStars || 0),
    multiDestination: Boolean(body.multiDestination),
    baggageIncluded: Boolean(body.baggageIncluded),
    breakfastIncluded: Boolean(body.breakfastIncluded),
    childrenAges: Array.isArray(body.childrenAges) ? body.childrenAges.map(Number).filter(Number.isFinite) : [],
    infants: Number(body.infants || 0),
    bedType: body.bedType || undefined,
    preferenceCategory: body.preferenceCategory || undefined,
  };

  if (!params.origin || !params.departDate || !params.budgetTotal) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  const candidates = DESTINATIONS.filter(
    (d) =>
      d.code !== params.origin.toUpperCase() &&
      (!params.preferenceCategory || d.categories.includes(params.preferenceCategory))
  );

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
