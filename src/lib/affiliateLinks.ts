import type { FlightOffer, HotelOffer, SearchParams } from "./types";
import { resolveIata } from "./flights";
import { aviasalesSearchUrl, travelpayoutsMarker } from "./providers/travelpayouts";
import { hotellookSearchUrl } from "./providers/hotellook";

/**
 * Where a traveller actually goes to pay.
 *
 * Sfrtna never takes a booking or a payment — it compares, and then hands
 * over. That handover is the entire business model, and for a while it did
 * not exist: the button said "view details & book", the details page had no
 * booking control on it, and this module sat in the tree with nothing
 * importing it. A metasearch site with no way out to a partner is a
 * catalogue.
 *
 * Two rules the links below follow:
 *
 *  - **Only real, public URL shapes.** Booking.com's `searchresults.html`
 *    and Skyscanner's `/transport/flights/<from>/<to>/<yymmdd>/` are
 *    documented, stable entry points. Nothing here invents a deep link to a
 *    specific offer, because we cannot know the partner still has it — the
 *    link opens *their* search for the same trip, and the UI says so.
 *  - **The partner sets the price.** Every caller of this module has to
 *    print that alongside the button. Our number came from a different
 *    source and may be minutes or days old.
 *
 * The partner ids are public tags that travel in the query string of a URL
 * the visitor's own browser opens — they are not secrets, so they are read
 * from NEXT_PUBLIC_* and work in the browser. Without them the links still
 * work; they just earn nothing.
 */

const BOOKING_AID = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID || "";
const ALMOSAFER_REF = process.env.NEXT_PUBLIC_ALMOSAFER_AFFILIATE_ID || "";

export interface BookingHandoff {
  /** The partner's own name, shown to the traveller before they leave. */
  partner: string;
  url: string;
}

/** Skyscanner wants YYMMDD. */
function compactDate(iso: string): string {
  return iso.replace(/-/g, "").slice(2);
}

/**
 * Flights: the airline's own site when we know the carrier and it sells
 * direct, otherwise Skyscanner.
 *
 * Sending someone to Saudia for a Saudia fare is a better handover than
 * sending them to a metasearch that will show them Saudia — one fewer step,
 * and the price they land on is the airline's own.
 */
const AIRLINE_SITES: Record<string, { name: string; url: string }> = {
  SV: { name: "Saudia", url: "https://www.saudia.com/" },
  XY: { name: "flynas", url: "https://www.flynas.com/" },
  F3: { name: "flyadeal", url: "https://www.flyadeal.com/" },
  TK: { name: "Turkish Airlines", url: "https://www.turkishairlines.com/" },
  EK: { name: "Emirates", url: "https://www.emirates.com/" },
  QR: { name: "Qatar Airways", url: "https://www.qatarairways.com/" },
};

export function flightBookingHandoff(
  params: SearchParams,
  flight?: FlightOffer
): BookingHandoff | null {
  if (params.tripType === "hotel") return null;
  if (!params.origin || !params.destination || !params.departDate) return null;

  /**
   * Aviasales first, once the affiliate marker exists.
   *
   * This used to send the traveller to the carrier's own website when we knew
   * the carrier, on the reasoning that one fewer step is a better handover.
   * That reasoning held while the site had no revenue model; it does not now.
   * A referral to saudia.com earns nothing, and a site with no income is one
   * that stops being maintained — which serves the traveller worst of all.
   *
   * The trade is small and honest: Aviasales opens the same search across
   * every carrier, including the one we just showed, and the price the
   * traveller pays is unchanged. The commission comes out of the partner's
   * margin, never out of the fare.
   */
  const marker = travelpayoutsMarker();
  if (marker) {
    return {
      partner: "Aviasales",
      url: aviasalesSearchUrl({
        origin: params.origin,
        destination: params.destination,
        departDate: params.departDate,
        returnDate: params.returnDate,
        adults: params.adults || 1,
        children: params.childrenAges?.length ?? 0,
        infants: params.infants ?? 0,
      }),
    };
  }

  const direct = flight?.airlineCode ? AIRLINE_SITES[flight.airlineCode] : undefined;
  if (direct) return { partner: direct.name, url: direct.url };

  const from = resolveIata(params.origin).toLowerCase();
  const to = resolveIata(params.destination).toLowerCase();
  const out = compactDate(params.departDate);
  const back = params.returnDate ? `/${compactDate(params.returnDate)}` : "";
  return {
    partner: "Skyscanner",
    url: `https://www.skyscanner.net/transport/flights/${from}/${to}/${out}${back}/`,
  };
}

/**
 * Hotels: Hotellook first when the marker is set, because that is the
 * handover that pays and it compares Booking, Agoda and the rest in one
 * screen. Booking.com's own search otherwise.
 *
 * `destinationName` is the city as a person would type it — free text search
 * does far better with "Istanbul" than with "IST".
 */
export function hotelBookingHandoff(
  params: SearchParams,
  destinationName: string,
  hotel?: HotelOffer
): BookingHandoff | null {
  if (params.tripType === "flight") return null;
  if (!params.departDate) return null;

  const marker = travelpayoutsMarker();
  if (marker) {
    return {
      partner: "Hotellook",
      url: hotellookSearchUrl({
        destination: destinationName || params.destination,
        checkIn: params.departDate,
        checkOut: params.returnDate || params.departDate,
        adults: params.adults || 1,
        marker,
      }),
    };
  }

  const checkin = params.departDate;
  const checkout = params.returnDate || params.departDate;
  const url = new URL("https://www.booking.com/searchresults.html");
  url.searchParams.set("ss", destinationName || params.destination);
  url.searchParams.set("checkin", checkin);
  url.searchParams.set("checkout", checkout);
  url.searchParams.set("group_adults", String(params.adults || 1));
  const children = params.childrenAges?.length ?? 0;
  if (children > 0) url.searchParams.set("group_children", String(children));
  if (params.minHotelStars) url.searchParams.set("nflt", `class=${params.minHotelStars}`);
  if (BOOKING_AID) url.searchParams.set("aid", BOOKING_AID);
  // The hotel we picked is a suggestion to search for, not a promise it is
  // still bookable at that price.
  if (hotel?.name) url.searchParams.set("ss", hotel.name);

  return { partner: "Booking.com", url: url.toString() };
}

/** A second hotel option, for travellers who prefer a regional agency. */
export function hotelBookingAlternative(
  params: SearchParams,
  destinationName: string
): BookingHandoff | null {
  if (params.tripType === "flight") return null;
  const url = new URL("https://www.almosafer.com/en/hotels/search-results");
  url.searchParams.set("city", destinationName || params.destination);
  url.searchParams.set("checkIn", params.departDate);
  url.searchParams.set("checkOut", params.returnDate || params.departDate);
  url.searchParams.set("adults", String(params.adults || 1));
  if (ALMOSAFER_REF) url.searchParams.set("ref", ALMOSAFER_REF);
  return { partner: "Almosafer", url: url.toString() };
}
