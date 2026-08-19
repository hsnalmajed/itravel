import { NextRequest, NextResponse } from "next/server";
import { searchHotels } from "@/lib/flights";
import type { SearchParams } from "@/lib/types";

function nightsBetween(checkin: string, checkout: string) {
  const a = new Date(checkin).getTime();
  const b = new Date(checkout).getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const departDate = sp.get("departDate") || "";
  const returnDate = sp.get("returnDate") || departDate;

  const params: SearchParams = {
    tripType: "hotel",
    origin: sp.get("origin") || "",
    destination: sp.get("destination") || "",
    departDate,
    returnDate,
    adults: Number(sp.get("adults") || 1),
    budgetTotal: Number(sp.get("budget") || 0),
    currency: sp.get("currency") || "SAR",
    directFlightsOnly: false,
    minHotelStars: Number(sp.get("minStars") || 0),
  };

  if (!params.destination || !params.departDate) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  const nights = nightsBetween(departDate, returnDate);
  const hotels = await searchHotels(params, nights);
  return NextResponse.json({ hotels, nights });
}
