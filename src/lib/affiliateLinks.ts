import type { SearchParams } from "./types";
import { resolveIata } from "./flights";

// Best-effort deep links to trusted booking sites for comparison / affiliate revenue.
// Replace the *_AFFILIATE_ID env vars with your real partner IDs once approved.
// Some providers (Wego, flynas, most airlines) don't support public deep-link query
// params without an approved partner integration — those link to the site's search
// entry point instead.

export interface AffiliateLink {
  name: string;
  url: string;
}

export function buildAffiliateLinks(params: SearchParams): AffiliateLink[] {
  const origin = resolveIata(params.origin);
  const destination = resolveIata(params.destination);
  const checkin = params.departDate;
  const checkout = params.returnDate || params.departDate;
  const bookingAid = process.env.BOOKING_AFFILIATE_ID || "";
  const almosaferAid = process.env.ALMOSAFER_AFFILIATE_ID || "";

  const links: AffiliateLink[] = [];

  if (params.tripType !== "flight") {
    const bookingUrl = new URL("https://www.booking.com/searchresults.html");
    bookingUrl.searchParams.set("ss", params.destination);
    bookingUrl.searchParams.set("checkin", checkin);
    bookingUrl.searchParams.set("checkout", checkout);
    bookingUrl.searchParams.set("group_adults", String(params.adults || 1));
    if (bookingAid) bookingUrl.searchParams.set("aid", bookingAid);
    links.push({ name: "Booking.com", url: bookingUrl.toString() });

    const almosaferUrl = new URL("https://www.almosafer.com/en/hotels/search-results");
    almosaferUrl.searchParams.set("city", params.destination);
    almosaferUrl.searchParams.set("checkIn", checkin);
    almosaferUrl.searchParams.set("checkOut", checkout);
    almosaferUrl.searchParams.set("adults", String(params.adults || 1));
    if (almosaferAid) almosaferUrl.searchParams.set("ref", almosaferAid);
    links.push({ name: "Almosafer", url: almosaferUrl.toString() });

    links.push({ name: "Wego", url: "https://www.wego.com/hotels" });
  }

  if (params.tripType !== "hotel") {
    const skyscannerUrl = `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${checkin.replace(/-/g, "").slice(2)}${
      params.returnDate ? `/${params.returnDate.replace(/-/g, "").slice(2)}` : ""
    }/`;
    links.push({ name: "Skyscanner", url: skyscannerUrl });

    links.push({ name: "المسافر (Almosafer Flights)", url: "https://www.almosafer.com/en/flights" });
    links.push({ name: "flynas", url: "https://www.flynas.com/en" });
    links.push({ name: "flyadeal", url: "https://www.flyadeal.com/en" });
    links.push({ name: "Saudia", url: "https://www.saudia.com/" });
  }

  return links;
}
