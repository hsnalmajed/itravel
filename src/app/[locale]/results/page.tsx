"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { BedType, FlightOffer, HotelOffer, Locale, PackageCombo, SearchParams, TripType } from "@/lib/types";
import { buildCombos, sortCombos, type SortMode } from "@/lib/combine";
import { buildAffiliateLinks } from "@/lib/affiliateLinks";
import PackageCard from "@/components/PackageCard";
import { parseChildrenAges, serializeChildrenAges } from "@/lib/searchParamsUtil";

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
      bedType: (sp.get("bedType") || undefined) as BedType | undefined,
    }),
    [sp]
  );

  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [hotels, setHotels] = useState<HotelOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recommended");

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
        bedType: search.bedType || "",
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

  const combos: PackageCombo[] = useMemo(
    () => buildCombos(search.tripType, flights, hotels, search.budgetTotal),
    [search, flights, hotels]
  );
  const sortedCombos = useMemo(() => sortCombos(combos, sortMode), [combos, sortMode]);

  const affiliateLinks = useMemo(() => buildAffiliateLinks(search), [search]);
  const nights = search.returnDate ? nightsBetween(search.departDate, search.returnDate) : 0;
  const isMockData = flights.some((f) => f.isMock) || hotels.some((h) => h.isMock);

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
      bedType: search.bedType || "",
    });
    return p.toString();
  }, [search]);

  const sortOptions: { mode: SortMode; label: string }[] = [
    { mode: "recommended", label: dict.results.sortRecommended },
    { mode: "cheapest", label: dict.results.sortCheapest },
    ...(search.tripType !== "hotel" ? [{ mode: "fastest" as SortMode, label: dict.results.sortFastest }] : []),
    ...(search.tripType !== "flight"
      ? [{ mode: "topRatedHotels" as SortMode, label: dict.results.sortTopRatedHotels }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{dict.results.title}</h1>
          <p className="text-gray-500 mt-1">
            {search.origin && `${search.origin} → `}
            {search.destination} · {search.departDate}
            {search.returnDate ? ` – ${search.returnDate}` : ""} · {dict.results.subtitle}
          </p>
        </div>
        <Link
          href={`/${locale}?${editSearchParams}`}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
          {dict.results.backToSearch}
        </Link>
      </div>

      {isMockData && !loading && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {dict.results.mockNotice}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white ring-1 ring-black/5 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-red-600 py-4 text-center text-sm">
          {locale === "ar" ? "حدث خطأ أثناء البحث، حاول مرة أخرى." : "Something went wrong while searching. Please try again."}
        </p>
      )}

      {!loading && !error && combos.length === 0 && (
        <p className="text-gray-500 py-10 text-center">{dict.results.noResults}</p>
      )}

      {!loading && !error && combos.length > 0 && sortOptions.length > 1 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-500 me-1">{dict.results.sortBy}:</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setSortMode(opt.mode)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
                sortMode === opt.mode
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {!loading && combos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sortedCombos.map((combo, i) => (
            <PackageCard key={i} combo={combo} locale={locale} />
          ))}
        </div>
      )}

      {!loading && (
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/itinerary?destination=${encodeURIComponent(search.destination)}&nights=${nights || 3}&budget=${search.budgetTotal}&currency=${search.currency}`}
            className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          >
            {dict.results.viewItinerary}
          </Link>
        </div>
      )}

      <div className="mt-10 rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <p className="text-sm font-semibold text-gray-700 mb-3">{dict.results.compareOn}</p>
        <div className="flex flex-wrap gap-2">
          {affiliateLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              className="rounded-full border border-gray-200 px-4 py-1.5 text-sm text-gray-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
