"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { ItineraryResult, Locale } from "@/lib/types";
import { findAirport } from "@/lib/airports";
import { findCountry, findCountryByEnglishName } from "@/lib/countries";
import PlanActions from "@/components/PlanActions";

export default function ItineraryPage() {
  return (
    <Suspense fallback={null}>
      <ItineraryContent />
    </Suspense>
  );
}

/**
 * The plan, built for one named city.
 *
 * Two things this page gets asked for by name. It talks about the city, not
 * "your destination": someone arrives here from a Riyadh → Istanbul search
 * and the word on the screen should be Istanbul. And the budget starts empty
 * and is required, because it is a different number from the one they typed
 * into the search — that one bought the flight and the hotel, this one is
 * what is left for the days in between, and pre-filling it with the old
 * figure would quietly plan a trip against money already spent.
 */
function ItineraryContent() {
  const params = useParams();
  const locale = (params.locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(locale);
  const sp = useSearchParams();

  // The link in from the results page carries an airport code. A code is not
  // a place name, so resolve it to the city — and to the country, which is
  // what the map exports are keyed on.
  const incoming = sp.get("city") || sp.get("destination") || "";
  const resolved = useMemo(() => {
    const airport = findAirport(incoming);
    const countryFromParam = findCountry(sp.get("country") || "");
    if (airport) {
      return {
        city: locale === "ar" ? airport.cityAr : airport.cityEn,
        country: countryFromParam ?? findCountryByEnglishName(airport.countryEn),
      };
    }
    return { city: incoming, country: countryFromParam };
  }, [incoming, sp, locale]);

  const [city, setCity] = useState(resolved.city);
  const [days, setDays] = useState(Number(sp.get("nights") || 3));
  // Deliberately a string, and deliberately empty: a number field seeded with
  // 0 reads as "already answered" and gets submitted untouched.
  const [budget, setBudget] = useState("");
  const [currency] = useState(sp.get("currency") || "SAR");
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ItineraryResult | null>(null);

  const countryName = resolved.country
    ? locale === "ar"
      ? resolved.country.nameAr
      : resolved.country.nameEn
    : undefined;

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: city,
          days,
          budget: Number(budget),
          currency,
          interests,
          locale,
        }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  // Everything written in the plan, as plain lines — what the map export
  // searches for real place names in.
  const planLines = useMemo(() => {
    if (!result) return [];
    return result.plan.flatMap((day) => [day.title, ...day.activities, day.mealsSuggestion ?? ""]);
  }, [result]);

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.75 text-sm text-gray-800 shadow-sm transition outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 hover:border-gray-300";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  const heading = city
    ? dict.itinerary.titleForCity.replace("{city}", city)
    : dict.itinerary.title;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-28 sm:px-6 sm:pt-32">
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">{heading}</h1>
      <p className="mb-6 mt-1.5 text-gray-500">{dict.itinerary.subtitle}</p>

      <form
        onSubmit={generate}
        className="print:hidden overflow-hidden rounded-3xl bg-white shadow-xl shadow-brand-950/5 ring-1 ring-black/5"
      >
        <div className="h-1.5 bg-gradient-to-r from-brand-700 via-accent-500 to-brand-700" />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <div>
            <label className={labelClass} htmlFor="plan-city">
              {dict.itinerary.cityLabel}
            </label>
            <input
              id="plan-city"
              className={inputClass}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={dict.itinerary.cityPlaceholder}
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="plan-days">
              {dict.itinerary.daysLabel}
            </label>
            <input
              id="plan-days"
              type="number"
              min={1}
              max={21}
              className={inputClass}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="plan-budget">
              {dict.itinerary.budgetLabel}
            </label>
            <input
              id="plan-budget"
              type="number"
              min={1}
              // Not a multiple of anything: with min=1 a step of 50 makes
              // 1,500 invalid and the browser rejects it with a message about
              // "the two nearest valid values", which reads as a bug.
              step={1}
              inputMode="numeric"
              className={inputClass}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={dict.itinerary.budgetPlaceholder}
              required
            />
            <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{dict.itinerary.budgetHint}</p>
          </div>

          <div>
            <label className={labelClass} htmlFor="plan-currency">
              {dict.form.currency}
            </label>
            <input id="plan-currency" className={inputClass} value={currency} disabled />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="plan-interests">
              {dict.itinerary.interests}
            </label>
            <input
              id="plan-interests"
              className={inputClass}
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder={dict.itinerary.interestsPlaceholder}
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 px-6 py-4 text-base font-bold text-white shadow-lg shadow-accent-600/25 transition hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.99] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? dict.itinerary.generating : `${dict.itinerary.generate} 🗺️`}
            </button>
          </div>
        </div>
      </form>

      {result && (
        <div className="mt-8 space-y-4">
          <PlanActions
            locale={locale}
            countryCode={resolved.country?.code}
            countryName={countryName}
            planLines={planLines}
            fileBase={`sfratna-plan-${resolved.country?.code ?? "trip"}`}
            title={dict.itinerary.planTitleForCity.replace("{city}", city)}
          />

          {result.isMock && (
            <div className="print:hidden rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {dict.itinerary.mockNotice}
            </div>
          )}

          {/* The printed document starts here. */}
          <div className="space-y-4">
            <div className="print-block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="text-lg font-extrabold text-gray-900">
                {dict.itinerary.planTitleForCity.replace("{city}", city)}
              </h2>
              <p className="mt-1 text-sm font-semibold text-gray-500">
                {dict.itinerary.daysCount.replace("{count}", String(days))}
                {Number(budget) > 0 ? ` · ${Number(budget).toLocaleString()} ${currency}` : ""}
              </p>
              <p className="mt-3 leading-relaxed text-gray-700">{result.summary}</p>
            </div>

            {result.plan.map((day) => (
              <div
                key={day.day}
                className="print-block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md hover:ring-brand-100"
              >
                <h3 className="mb-2.5 flex items-center gap-2 font-bold text-gray-900">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                    {day.day}
                  </span>
                  {dict.itinerary.day} {day.day}
                  <span className="font-semibold text-gray-500">
                    — {day.title.replace(/^Day \d+:\s*/i, "").replace(/^اليوم \d+:\s*/, "")}
                  </span>
                </h3>

                <ul className="space-y-1.5 text-sm text-gray-700">
                  {day.activities.map((a, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" aria-hidden="true" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>

                {day.mealsSuggestion && (
                  <p className="mt-3 rounded-xl bg-accent-50/70 px-3.5 py-2.5 text-sm text-accent-900">
                    <span aria-hidden="true">🍽️ </span>
                    {day.mealsSuggestion}
                  </p>
                )}

                {day.estimatedCost && (
                  <p className="mt-2.5 text-xs font-semibold text-gray-500">
                    {dict.itinerary.estimatedCost}: {day.estimatedCost}
                  </p>
                )}
              </div>
            ))}

            {result.tips.length > 0 && (
              <div className="print-block rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
                <h3 className="mb-2 font-bold text-brand-900">{dict.itinerary.tips}</h3>
                <ul className="list-disc space-y-1 ps-5 text-sm text-brand-900">
                  {result.tips.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="hidden text-xs text-gray-400 print:block">{dict.plan.printedFrom}</p>
          </div>
        </div>
      )}
    </div>
  );
}
