"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { RoomType, DestinationCategory, DestinationPairSuggestion, DestinationSuggestion, Locale, TripType } from "@/lib/types";
import DestinationCard from "@/components/DestinationCard";
import DestinationPairCard from "@/components/DestinationPairCard";
import { parseChildrenAges } from "@/lib/searchParamsUtil";

export default function DiscoverResultsPage() {
  return (
    <Suspense fallback={null}>
      <DiscoverResultsContent />
    </Suspense>
  );
}

function DiscoverResultsContent() {
  const params = useParams();
  const locale = (params.locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(locale);
  const sp = useSearchParams();

  const tripType = (sp.get("tripType") as TripType) || "both";
  const origin = sp.get("origin") || "";
  const budget = sp.get("budget") || "0";
  const currency = sp.get("currency") || "SAR";
  const departDate = sp.get("departDate") || "";
  const returnDate = sp.get("returnDate") || "";
  const nights = sp.get("nights") || "5";
  const adults = sp.get("adults") || "1";
  const childrenAges = parseChildrenAges(sp.get("childrenAges"));
  const infants = sp.get("infants") || "0";
  const directOnly = sp.get("directOnly") === "true";
  const minStars = sp.get("minStars") || "0";
  const roomType = (sp.get("roomType") || undefined) as RoomType | undefined;
  const multiDestination = sp.get("multiDestination") === "true";
  const oneWayOnly = sp.get("oneWayOnly") === "true";
  const baggageIncluded = sp.get("baggageIncluded") === "true";
  const breakfastIncluded = sp.get("breakfastIncluded") === "true";
  const preferenceCategory = (sp.get("preferenceCategory") || undefined) as DestinationCategory | undefined;
  const editSearchParams = sp.toString();

  const [mode, setMode] = useState<"single" | "multi">(multiDestination ? "multi" : "single");
  const [singleSuggestions, setSingleSuggestions] = useState<DestinationSuggestion[]>([]);
  const [pairSuggestions, setPairSuggestions] = useState<DestinationPairSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!origin || !departDate) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    fetch("/api/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin,
        tripType,
        budgetTotal: Number(budget),
        currency,
        departDate,
        returnDate,
        nights: Number(nights),
        adults: Number(adults),
        childrenAges,
        infants: Number(infants),
        directFlightsOnly: directOnly,
        minHotelStars: Number(minStars),
        roomType,
        multiDestination,
        oneWayOnly,
        baggageIncluded,
        breakfastIncluded,
        preferenceCategory,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setMode(data.mode);
        if (data.mode === "multi") {
          setPairSuggestions(data.suggestions || []);
        } else {
          setSingleSuggestions(data.suggestions || []);
        }
      })
      .catch(() => setError("error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    origin,
    tripType,
    budget,
    currency,
    departDate,
    returnDate,
    nights,
    adults,
    directOnly,
    minStars,
    roomType,
    multiDestination,
    oneWayOnly,
    baggageIncluded,
    breakfastIncluded,
    preferenceCategory,
  ]);

  const isMockData = useMemo(() => {
    if (mode === "multi")
      return pairSuggestions.some((p) => p.legs.some((l) => l.flight?.isMock || l.hotel?.isMock));
    return singleSuggestions.some((s) => s.flight?.isMock || s.hotel?.isMock);
  }, [mode, singleSuggestions, pairSuggestions]);

  const hasResults = mode === "multi" ? pairSuggestions.length > 0 : singleSuggestions.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{dict.discoverResults.title}</h1>
          <p className="text-gray-500 mt-1">
            {origin} · {departDate} · {budget} {currency} · {dict.discoverResults.subtitle}
          </p>
        </div>
        <Link
          href={`/${locale}?${editSearchParams}`}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
          {dict.discoverResults.backToSearch}
        </Link>
      </div>

      {isMockData && !loading && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {dict.results.mockNotice}
        </div>
      )}

      {mode === "multi" && !loading && hasResults && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          {dict.discoverResults.multiNotice}
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

      {!loading && !error && !hasResults && (
        <p className="text-gray-500 py-10 text-center">{dict.discoverResults.noResults}</p>
      )}

      {!loading && mode === "single" && singleSuggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {singleSuggestions.map((s) => (
            <DestinationCard
              key={s.destinationCode}
              suggestion={s}
              locale={locale}
              origin={origin}
              tripType={tripType}
              departDate={departDate}
              returnDate={returnDate}
              travelers={{ adults: Number(adults), childrenAges, infants: Number(infants) }}
              currency={currency}
              directOnly={directOnly}
              minStars={Number(minStars)}
              roomType={roomType}
            />
          ))}
        </div>
      )}

      {!loading && mode === "multi" && pairSuggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pairSuggestions.map((p, i) => (
            <DestinationPairCard key={i} pair={p} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
