"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function DiscoverForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const sp = useSearchParams();

  // Pre-fill from the query string when arriving via "Edit search" so the
  // user edits their previous search instead of starting from scratch.
  const [origin, setOrigin] = useState(sp.get("origin") || (locale === "ar" ? "الرياض" : "Riyadh"));
  const [budget, setBudget] = useState(Number(sp.get("budget")) || 6000);
  const [currency, setCurrency] = useState(sp.get("currency") || "SAR");
  const [departDate, setDepartDate] = useState(sp.get("departDate") || todayPlus(30));
  const [nights, setNights] = useState(Number(sp.get("nights")) || 5);
  const [adults, setAdults] = useState(Number(sp.get("adults")) || 2);
  const [directOnly, setDirectOnly] = useState(sp.get("directOnly") === "true");
  const [minStars, setMinStars] = useState(Number(sp.get("minStars")) || 0);
  const [multiDestination, setMultiDestination] = useState(sp.get("multiDestination") === "true");
  const [baggageIncluded, setBaggageIncluded] = useState(sp.get("baggageIncluded") === "true");
  const [breakfastIncluded, setBreakfastIncluded] = useState(sp.get("breakfastIncluded") === "true");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      mode: "discover",
      origin,
      budget: String(budget),
      currency,
      departDate,
      nights: String(nights),
      adults: String(adults),
      directOnly: String(directOnly),
      minStars: String(minStars),
      multiDestination: String(multiDestination),
      baggageIncluded: String(baggageIncluded),
      breakfastIncluded: String(breakfastIncluded),
    });
    router.push(`/${locale}/discover-results?${params.toString()}`);
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const checkboxLabelClass = "flex items-center gap-2 text-sm text-gray-700";
  const checkboxClass = "h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600";

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 w-full max-w-4xl mx-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-5 sm:p-7"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{dict.discoverForm.origin}</label>
          <input
            className={inputClass}
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{dict.discoverForm.budget}</label>
            <input
              type="number"
              min={0}
              step={50}
              className={inputClass}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{dict.discoverForm.currency}</label>
            <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="SAR">SAR</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>{dict.discoverForm.departDate}</label>
          <input
            type="date"
            className={inputClass}
            value={departDate}
            min={todayPlus(0)}
            onChange={(e) => setDepartDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass}>{dict.discoverForm.nights}</label>
          <input
            type="number"
            min={1}
            max={21}
            className={inputClass}
            value={nights}
            onChange={(e) => setNights(Number(e.target.value))}
            required
          />
        </div>

        <div>
          <label className={labelClass}>{dict.discoverForm.adults}</label>
          <input
            type="number"
            min={1}
            max={9}
            className={inputClass}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
          />
        </div>

        <div>
          <label className={labelClass}>{dict.discoverForm.minStars}</label>
          <select
            className={inputClass}
            value={minStars}
            onChange={(e) => setMinStars(Number(e.target.value))}
          >
            <option value={0}>{dict.discoverForm.anyStars}</option>
            {[2, 3, 4, 5].map((s) => (
              <option key={s} value={s}>
                {"★".repeat(s)}
              </option>
            ))}
          </select>
        </div>

        <label className={checkboxLabelClass}>
          <input
            type="checkbox"
            checked={directOnly}
            onChange={(e) => setDirectOnly(e.target.checked)}
            className={checkboxClass}
          />
          {dict.discoverForm.directOnly}
        </label>

        <label className={checkboxLabelClass}>
          <input
            type="checkbox"
            checked={baggageIncluded}
            onChange={(e) => setBaggageIncluded(e.target.checked)}
            className={checkboxClass}
          />
          {dict.discoverForm.baggageIncluded}
        </label>

        <label className={checkboxLabelClass}>
          <input
            type="checkbox"
            checked={breakfastIncluded}
            onChange={(e) => setBreakfastIncluded(e.target.checked)}
            className={checkboxClass}
          />
          {dict.discoverForm.breakfastIncluded}
        </label>

        <div className="sm:col-span-2">
          <label className={labelClass}>{dict.discoverForm.destinationsCount}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMultiDestination(false)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
                !multiDestination
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
              }`}
            >
              {dict.discoverForm.singleDestination}
            </button>
            <button
              type="button"
              onClick={() => setMultiDestination(true)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
                multiDestination
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
              }`}
            >
              {dict.discoverForm.multiDestination}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-accent-600/20 transition hover:brightness-105 hover:shadow-xl hover:shadow-accent-600/25 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
      >
        {dict.discoverForm.submit}
      </button>
    </form>
  );
}
