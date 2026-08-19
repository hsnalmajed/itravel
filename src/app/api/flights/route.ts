import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/flights";
import type { SearchParams } from "@/lib/types";
import { parseChildrenAges } from "@/lib/searchParamsUtil";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const params: SearchParams = {
    tripType: "flight",
    origin: sp.get("origin") || "",
    destination: sp.get("destination") || "",
    departDate: sp.get("departDate") || "",
    returnDate: sp.get("returnDate") || undefined,
    adults: Number(sp.get("adults") || 1),
    budgetTotal: Number(sp.get("budget") || 0),
    currency: sp.get("currency") || "SAR",
    directFlightsOnly: sp.get("directOnly") === "true",
    minHotelStars: 0,
    baggageIncluded: sp.get("baggageIncluded") === "true",
    childrenAges: parseChildrenAges(sp.get("childrenAges")),
    infants: Number(sp.get("infants") || 0),
  };

  if (!params.origin || !params.destination || !params.departDate) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  const flights = await searchFlights(params);
  return NextResponse.json({ flights });
}
