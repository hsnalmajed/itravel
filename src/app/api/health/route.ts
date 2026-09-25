import { NextResponse } from "next/server";
import { configuredProviders } from "@/lib/providers";
import { travelpayouts } from "@/lib/providers/travelpayouts";

/**
 * Is the site actually wired up?
 *
 * Says which price sources hold credentials and whether a real search comes
 * back with anything — and never prints a credential, only whether one is
 * present. Without this, a page showing sample prices gives no way to tell a
 * missing key from a source that answered with nothing.
 */
export async function GET() {
  const configured = configuredProviders().map((p) => p.name);

  let probe: { ok: boolean; offers: number; error?: string } = { ok: false, offers: 0 };
  try {
    const offers = await travelpayouts.searchFlights!({
      tripType: "flight",
      origin: "RUH",
      destination: "IST",
      departDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      adults: 1,
      budgetTotal: 0,
      currency: "SAR",
      directFlightsOnly: false,
      minHotelStars: 0,
      baggageIncluded: false,
      childrenAges: [],
      infants: 0,
    });
    probe = { ok: true, offers: offers.length };
  } catch (err) {
    probe = { ok: false, offers: 0, error: String(err).slice(0, 200) };
  }

  return NextResponse.json(
    {
      configuredProviders: configured,
      keys: {
        travelpayoutsToken: Boolean(process.env.TRAVELPAYOUTS_TOKEN),
        pexels: Boolean(process.env.PEXELS_API_KEY),
      },
      flightProbe: probe,
    },
    { headers: { "cache-control": "no-store" } }
  );
}
