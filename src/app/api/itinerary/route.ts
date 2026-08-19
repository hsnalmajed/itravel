import { NextRequest, NextResponse } from "next/server";
import { generateItinerary } from "@/lib/itinerary";
import type { Locale } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { destination, days, budget, currency, interests, locale } = body as {
    destination: string;
    days: number;
    budget?: number;
    currency?: string;
    interests?: string;
    locale: Locale;
  };

  if (!destination || !days) {
    return NextResponse.json({ error: "Missing destination or days" }, { status: 400 });
  }

  const result = await generateItinerary({
    destination,
    days: Math.min(Math.max(1, days), 21),
    budget,
    currency,
    interests,
    locale: locale === "en" ? "en" : "ar",
  });

  return NextResponse.json(result);
}
