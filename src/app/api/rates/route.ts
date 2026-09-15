import { NextRequest, NextResponse } from "next/server";
import { fetchRates, rateBetween } from "@/lib/rates";

/**
 * One cross rate, for pages that render on the client.
 *
 * The currency converter is a server component and calls `fetchRates`
 * directly. The results page can't — it is a client component driven by query
 * parameters — so it asks here instead. The feed's own hourly cache sits
 * behind this, so a page view costs nothing extra.
 *
 * Returns `rate: null` rather than an error when the feed doesn't quote one of
 * the pair: the caller then shows nothing, which is the honest outcome. A rate
 * invented by routing through a third currency we also don't have would be a
 * number no one published.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const from = (sp.get("from") || "").toUpperCase();
  const to = (sp.get("to") || "").toUpperCase();

  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) {
    return NextResponse.json({ error: "bad_currency" }, { status: 400 });
  }

  const rates = await fetchRates();
  if (!rates) {
    return NextResponse.json({ rate: null, source: null, updatedAt: null });
  }

  return NextResponse.json({
    from,
    to,
    rate: rateBetween(from, to, rates),
    source: rates.source,
    updatedAt: rates.updatedAt,
  });
}
