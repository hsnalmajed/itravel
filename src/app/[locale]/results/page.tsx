"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { RoomType, FlightOffer, HotelOffer, Locale, SearchParams, TripType } from "@/lib/types";
import { buildAffiliateLinks } from "@/lib/affiliateLinks";
import TripBuilder from "@/components/TripBuilder";
import EntryRequirementsPanel from "@/components/EntryRequirementsPanel";
import TripCurrencyStrip from "@/components/TripCurrencyStrip";
import { currencyForCountry } from "@/lib/currencies";
import { parseChildrenAges, serializeChildrenAges } from "@/lib/searchParamsUtil";
import { findAirport } from "@/lib/airports";
import { findCountryByEnglishName, flagEmoji } from "@/lib/countries";

function nightsBetween(a: string, b: string) {
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  return Math.max(1, Math.round((t2 - t1) / (1000 * 60 * 60 * 24)));
}

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const params = useParams();
  const locale = (params.locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(locale);
  const sp = useSearchParams();

  const search: SearchParams = useMemo(
    () => ({
      tripType: (sp.get("tripType") as TripType) || "both",
      origin: sp.get("origin") || "",
      destination: sp.get("destination") || "",
      departDate: sp.get("departDate") || "",
      returnDate: sp.get("returnDate") || undefined,
      adults: Number(sp.get("adults") || 1),
      budgetTotal: Number(sp.get("budget") || 0),
      currency: sp.get("currency") || "SAR",
      directFlightsOnly: sp.get("directOnly") === "true",
      minHotelStars: Number(sp.get("minStars") || 0),
      baggageIncluded: sp.get("baggageIncluded") === "true",
      breakfastIncluded: sp.get("breakfastIncluded") === "true",
      childrenAges: parseChildrenAges(sp.get("childrenAges")),
      infants: Number(sp.get("infants") || 0),
      roomType: (sp.get("roomType") || undefined) as RoomType | undefined,
    }),
    [sp]
  );

  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [hotels, setHotels] = useState<HotelOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!search.destination || !search.departDate) return;
    // Kicking off a data fetch and flagging it as loading is the standard
    // pattern here; the fetch itself (and its completion) is fully async below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    const tasks: Promise<void>[] = [];

    if (search.tripType !== "hotel") {
      const q = new URLSearchParams({
        origin: search.origin,
        destination: search.destination,
        departDate: search.departDate,
        adults: String(search.adults),
        currency: search.currency,
        directOnly: String(search.directFlightsOnly),
        baggageIncluded: String(Boolean(search.baggageIncluded)),
        childrenAges: serializeChildrenAges(search.childrenAges || []),
        infants: String(search.infants || 0),
      });
      if (search.returnDate) q.set("returnDate", search.returnDate);
      tasks.push(
        fetch(`/api/flights?${q.toString()}`)
          .then((r) => r.json())
          .then((d) => setFlights(d.flights || []))
      );
    }

    if (search.tripType !== "flight") {
      const q = new URLSearchParams({
        destination: search.destination,
        departDate: search.departDate,
        returnDate: search.returnDate || search.departDate,
        adults: String(search.adults),
        currency: search.currency,
        minStars: String(search.minHotelStars),
        breakfastIncluded: String(Boolean(search.breakfastIncluded)),
        roomType: search.roomType || "",
      });
      tasks.push(
        fetch(`/api/hotels?${q.toString()}`)
          .then((r) => r.json())
          .then((d) => setHotels(d.hotels || []))
      );
    }

    Promise.all(tasks)
      .catch(() => setError("error"))
      .finally(() => setLoading(false));
  }, [search]);

  // Whether there is anything to build a trip out of at all. A flight-only
  // search needs flights; a hotel-only search needs hotels; "both" needs one
  // of each, since half a package has no price we could honestly show.
  const hasResults =
    search.tripType === "flight"
      ? flights.length > 0
      : search.tripType === "hotel"
        ? hotels.length > 0
        : flights.length > 0 && hotels.length > 0;

  // Everyone the fare has to cover. Flight prices are already priced for the
  // whole party (adults at full fare, children and infants at their usual
  // weights), so this is only used to *say so* — a total with no headcount
  // beside it reads as a per-person price and gets doubled in someone's head.
  const travelers = search.adults + (search.childrenAges?.length ?? 0) + (search.infants ?? 0);

  const affiliateLinks = useMemo(() => buildAffiliateLinks(search), [search]);
  const nights = search.returnDate ? nightsBetween(search.departDate, search.returnDate) : 0;
  const isMockData = flights.some((f) => f.isMock) || hotels.some((h) => h.isMock);

  // Bridges the destination airport to its country so we can link into the
  // "Tourist Attractions" guide. Airports in a non-UN territory (e.g. Hong
  // Kong, Taiwan) won't resolve — the explore card simply doesn't render.
  const destinationCountry = useMemo(() => {
    const airport = findAirport(search.destination);
    if (!airport) return undefined;
    return findCountryByEnglishName(airport.countryEn);
  }, [search.destination]);

  const originCountry = useMemo(() => {
    const airport = findAirport(search.origin);
    if (!airport) return undefined;
    return findCountryByEnglishName(airport.countryEn);
  }, [search.origin]);

  // The money they leave with and the money they'll spend. Both have to
  // resolve, and to different currencies, for the strip to have anything to
  // say — a Riyadh-to-Dammam trip doesn't need an exchange rate.
  const homeCurrency = currencyForCountry(originCountry?.code);
  const tripCurrency = currencyForCountry(destinationCountry?.code);
  const showCurrencyStrip =
    Boolean(homeCurrency && tripCurrency) && homeCurrency!.code !== tripCurrency!.code;

  const editSearchParams = useMemo(() => {
    const p = new URLSearchParams({
      mode: "known",
      tripRoute: search.returnDate ? "roundtrip" : "oneway",
      tripType: search.tripType,
      origin: search.origin,
      destination: search.destination,
      departDate: search.departDate,
      returnDate: search.returnDate || "",
      adults: String(search.adults),
      budget: String(search.budgetTotal),
      currency: search.currency,
      directOnly: String(search.directFlightsOnly),
      minStars: String(search.minHotelStars),
      baggageIncluded: String(Boolean(search.baggageIncluded)),
      breakfastIncluded: String(Boolean(search.breakfastIncluded)),
      childrenAges: serializeChildrenAges(search.childrenAges || []),
      infants: String(search.infants || 0),
      roomType: search.roomType || "",
    });
    return p.toString();
  }, [search]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-28 sm:px-6 sm:pt-32">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{dict.results.title}</h1>
          <p className="text-gray-500 mt-1.5">
            {search.origin && `${search.origin} → `}
            {search.destination} · {search.departDate}
            {search.returnDate ? ` – ${search.returnDate}` : ""} · {dict.results.subtitle}
          </p>
        </div>
        <Link
          href={`/${locale}?${editSearchParams}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">{locale === "ar" ? "→" : "←"}</span>
          {dict.results.backToSearch}
        </Link>
      </div>

      {/* Whether they can actually enter the country comes before what it
          costs — a fare is no use to someone who needs a visa they don't
          have, and finding that out after choosing a trip is too late. */}
      {destinationCountry && <EntryRequirementsPanel countryCode={destinationCountry.code} locale={locale} />}

      {/* What a riyal is worth where they're going — asked on this page
          anyway, and better answered before they price anything. */}
      {showCurrencyStrip && homeCurrency && tripCurrency && (
        <TripCurrencyStrip from={homeCurrency} to={tripCurrency} locale={locale} />
      )}

      {isMockData && !loading && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {dict.results.mockNotice}
        </div>
      )}

      {loading && <div className="h-72 animate-pulse rounded-2xl bg-white ring-1 ring-black/5" />}

      {!loading && error && (
        <p className="text-red-600 py-4 text-center text-sm">
          {locale === "ar" ? "حدث خطأ أثناء البحث، حاول مرة أخرى." : "Something went wrong while searching. Please try again."}
        </p>
      )}

      {!loading && !error && !hasResults && (
        <p className="text-gray-500 py-10 text-center">{dict.results.noResults}</p>
      )}

      {!loading && !error && hasResults && (
        <TripBuilder
          flights={flights}
          hotels={hotels}
          tripType={search.tripType}
          budgetTotal={search.budgetTotal}
          currency={search.currency}
          locale={locale}
          travelers={travelers}
          departDate={search.departDate}
          returnDate={search.returnDate}
        />
      )}

      {!loading && (
        <div className="mt-10 space-y-4">
          {/* Itinerary prompt — surfaced first, as requested, so the itinerary
              option always sits above the destination-exploration card. */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white">{dict.results.itineraryPromptTitle}</p>
              <p className="text-sm text-white/70 mt-1 max-w-xl">{dict.results.itineraryPromptBody}</p>
            </div>
            <Link
              // The country travels with the city so the plan page can offer
              // its map exports; the search budget deliberately does not —
              // that money is already spent on the flight and the hotel.
              href={`/${locale}/itinerary?city=${encodeURIComponent(search.destination)}&country=${destinationCountry?.code ?? ""}&nights=${nights || 3}&currency=${search.currency}`}
              className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-900 shadow-sm transition hover:bg-brand-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900"
            >
              {dict.results.viewItinerary}
            </Link>
          </div>

          {destinationCountry && (
            <Link
              // Straight to the guide, with the trip length already known —
              // the section is a long way down a country page, and someone
              // arriving from a search shouldn't have to hunt for it or
              // re-enter how many days they booked.
              href={`/${locale}/attractions/${destinationCountry.code}?nights=${nights || 3}#guide`}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-black/5 transition hover:ring-brand-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{flagEmoji(destinationCountry.code)}</span>
                <div>
                  <p className="font-bold text-gray-900">{dict.results.exploreDestinationTitle}</p>
                  <p className="text-sm text-gray-500 mt-1 max-w-xl">{dict.results.exploreDestinationBody}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-xl border border-brand-200 px-5 py-3 text-sm font-bold text-brand-800">
                {dict.results.exploreDestinationCta}
              </span>
            </Link>
          )}
        </div>
      )}

      <div className="mt-10 rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-black/5">
        <p className="text-sm font-bold text-gray-700 mb-3">🔗 {dict.results.compareOn}</p>
        <div className="flex flex-wrap gap-2">
          {affiliateLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
