"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale, MultiCityLegInput, MultiCityTripResult } from "@/lib/types";
import { formatDuration } from "@/lib/format";

function formatTime(iso: string | undefined, locale: Locale) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function MultiCityResultsPage() {
  return (
    <Suspense fallback={null}>
      <MultiCityResultsContent />
    </Suspense>
  );
}

function MultiCityResultsContent() {
  const params = useParams();
  const locale = (params.locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(locale);
  const sp = useSearchParams();

  const origin = sp.get("origin") || "";
  const departDate = sp.get("departDate") || "";
  const adults = sp.get("adults") || "1";
  const budget = sp.get("budget") || "0";
  const currency = sp.get("currency") || "SAR";
  const directOnly = sp.get("directOnly") === "true";
  const minStars = sp.get("minStars") || "0";
  const legsRaw = sp.get("legs") || "[]";
  const baggageIncluded = sp.get("baggageIncluded") === "true";
  const breakfastIncluded = sp.get("breakfastIncluded") === "true";
  const editSearchParams = useMemo(() => {
    const p = new URLSearchParams(sp.toString());
    p.set("mode", "known");
    p.set("tripRoute", "multicity");
    return p.toString();
  }, [sp]);

  const [result, setResult] = useState<MultiCityTripResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!origin || !departDate) return;
    let legs: MultiCityLegInput[] = [];
    try {
      legs = JSON.parse(legsRaw);
    } catch {
      legs = [];
    }
    if (!Array.isArray(legs) || legs.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("error");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch("/api/multicity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin,
        legs,
        departDate,
        adults: Number(adults),
        budgetTotal: Number(budget),
        currency,
        directFlightsOnly: directOnly,
        minHotelStars: Number(minStars),
        baggageIncluded,
        breakfastIncluded,
      }),
    })
      .then((r) => r.json())
      .then((data) => setResult(data))
      .catch(() => setError("error"))
      .finally(() => setLoading(false));
  }, [
    origin,
    departDate,
    adults,
    budget,
    currency,
    directOnly,
    minStars,
    legsRaw,
    baggageIncluded,
    breakfastIncluded,
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{dict.multicity.resultsTitle}</h1>
          <p className="text-gray-500 mt-1.5">
            {origin} · {departDate} · {budget} {currency}
          </p>
        </div>
        <Link
          href={`/${locale}?${editSearchParams}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">{locale === "ar" ? "→" : "←"}</span>
          {dict.multicity.backToSearch}
        </Link>
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white ring-1 ring-black/5 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-red-600 py-4 text-center text-sm">
          {locale === "ar" ? "حدث خطأ أثناء البحث، حاول مرة أخرى." : "Something went wrong while searching. Please try again."}
        </p>
      )}

      {!loading && !error && result && (
        <>
          {result.isMock && (
            <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              {dict.results.mockNotice}
            </div>
          )}

          <div className="space-y-4">
            {result.legs.map((leg, i) => (
              <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="font-bold text-gray-900">
                    {dict.multicity.legLabel} {i + 1}: {leg.destination} ({leg.destinationIata})
                  </p>
                  <span className="ms-auto text-sm text-gray-500">
                    {leg.nights} {dict.results.nights}
                  </span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                    {dict.multicity.flightTo} {leg.destination}
                  </p>
                  {leg.flight ? (
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-gray-800">{leg.flight.airline}</p>
                        <p className="text-gray-500">
                          {leg.flight.origin} → {leg.flight.destination} · {leg.departDate}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-gray-800">
                          {formatTime(leg.flight.departTime, locale)} - {formatTime(leg.flight.arriveTime, locale)}
                        </p>
                        <p className="font-bold text-gray-900">
                          {leg.flight.price.toLocaleString()} {leg.flight.currency}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">{dict.multicity.noFlightFound}</p>
                  )}
                  {leg.flight && leg.flight.stops > 0 && leg.flight.layoverCity && (
                    <p className="mt-1 text-xs text-gray-400">
                      {dict.results.layoverIn
                        .replace("{city}", leg.flight.layoverCity)
                        .replace(
                          "{duration}",
                          leg.flight.layoverDurationMinutes
                            ? formatDuration(leg.flight.layoverDurationMinutes, locale)
                            : ""
                        )}
                    </p>
                  )}
                  {leg.flight && (
                    <span
                      className={`mt-2 inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        leg.flight.baggageIncluded ? "bg-accent-50 text-accent-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      🧳 {leg.flight.baggageIncluded ? dict.results.baggageYes : dict.results.baggageNo}
                    </span>
                  )}
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3 mt-3">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{dict.multicity.hotelStay}</p>
                  {leg.hotel ? (
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-gray-800">{leg.hotel.name}</p>
                        <p className="text-amber-500">{"★".repeat(Math.max(1, leg.hotel.stars))}</p>
                      </div>
                      <div className="text-end">
                        <p className="text-gray-800">
                          {leg.hotel.pricePerNight.toLocaleString()} {leg.hotel.currency} / {dict.results.perNight}
                        </p>
                        <p className="font-bold text-gray-900">
                          {leg.hotel.totalPrice.toLocaleString()} {leg.hotel.currency}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">{dict.multicity.noHotelFound}</p>
                  )}
                  {leg.hotel && (
                    <>
                      <p className="mt-1 text-xs text-gray-400">
                        {dict.results.distanceFromCenter.replace("{km}", String(leg.hotel.distanceFromCenterKm))}
                      </p>
                      <span
                        className={`mt-2 inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          leg.hotel.breakfastIncluded ? "bg-accent-50 text-accent-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        🍳 {leg.hotel.breakfastIncluded ? dict.results.breakfastYes : dict.results.breakfastNo}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                {dict.multicity.returnFlight} {origin}
              </p>
              {result.returnFlight ? (
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-gray-800">{result.returnFlight.airline}</p>
                    <p className="text-gray-500">
                      {result.returnFlight.origin} → {result.returnFlight.destination}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-gray-800">
                      {formatTime(result.returnFlight.departTime, locale)} - {formatTime(result.returnFlight.arriveTime, locale)}
                    </p>
                    <p className="font-bold text-gray-900">
                      {result.returnFlight.price.toLocaleString()} {result.returnFlight.currency}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-500">{dict.multicity.noFlightFound}</p>
              )}
              {result.returnFlight && result.returnFlight.stops > 0 && result.returnFlight.layoverCity && (
                <p className="mt-1 text-xs text-gray-400">
                  {dict.results.layoverIn
                    .replace("{city}", result.returnFlight.layoverCity)
                    .replace(
                      "{duration}",
                      result.returnFlight.layoverDurationMinutes
                        ? formatDuration(result.returnFlight.layoverDurationMinutes, locale)
                        : ""
                    )}
                </p>
              )}
              {result.returnFlight && (
                <span
                  className={`mt-2 inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    result.returnFlight.baggageIncluded ? "bg-accent-50 text-accent-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  🧳 {result.returnFlight.baggageIncluded ? dict.results.baggageYes : dict.results.baggageNo}
                </span>
              )}
            </div>
          </div>

          <div
            className={`mt-6 rounded-2xl p-5 shadow-sm ring-1 ${
              result.withinBudget ? "bg-white ring-brand-100" : "bg-white ring-red-100"
            }`}
          >
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">{dict.multicity.totalFlights}</span>
              <span className="font-semibold text-gray-800">
                {result.totalFlightsPrice.toLocaleString()} {result.currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">{dict.multicity.totalHotels}</span>
              <span className="font-semibold text-gray-800">
                {result.totalHotelsPrice.toLocaleString()} {result.currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-base border-t border-gray-100 pt-2 mt-2">
              <span className="font-bold text-gray-900">{dict.multicity.totalTrip}</span>
              <span className="font-extrabold text-gray-900">
                {result.totalPrice.toLocaleString()} {result.currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500">{dict.results.remainingBudget}</span>
              <span className={result.remainingBudget >= 0 ? "text-brand-900 font-semibold" : "text-red-600 font-semibold"}>
                {result.remainingBudget.toLocaleString()} {result.currency}
              </span>
            </div>
            <span
              className={`mt-3 inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                result.withinBudget ? "bg-brand-50 text-brand-900" : "bg-red-50 text-red-600"
              }`}
            >
              {result.withinBudget ? dict.results.withinBudget : dict.results.overBudget}
            </span>
          </div>

          {!result.withinBudget && result.advice && (
            <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-5">
              <p className="font-bold text-amber-900 mb-2">{dict.multicity.adviceTitle}</p>
              <ul className="text-sm text-amber-800 space-y-1.5 list-disc ps-5">
                <li>
                  {dict.multicity.adviceIncreaseBudget} {result.advice.suggestedBudget.toLocaleString()} {result.currency}
                </li>
                {result.advice.suggestedNightsToReduce > 0 && (
                  <li>
                    {dict.multicity.adviceReduceNights.replace("{n}", String(result.advice.suggestedNightsToReduce))}
                  </li>
                )}
                {result.advice.canRemoveDestination && <li>{dict.multicity.adviceRemoveDestination}</li>}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
