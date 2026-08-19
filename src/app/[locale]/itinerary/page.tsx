"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { ItineraryResult, Locale } from "@/lib/types";

export default function ItineraryPage() {
  return (
    <Suspense fallback={null}>
      <ItineraryContent />
    </Suspense>
  );
}

function ItineraryContent() {
  const params = useParams();
  const locale = (params.locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(locale);
  const sp = useSearchParams();

  const [destination, setDestination] = useState(sp.get("destination") || "");
  const [days, setDays] = useState(Number(sp.get("nights") || 3));
  const [budget, setBudget] = useState(Number(sp.get("budget") || 0));
  const [currency] = useState(sp.get("currency") || "SAR");
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ItineraryResult | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, days, budget, currency, interests, locale }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.75 text-sm text-gray-800 shadow-sm transition outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 hover:border-gray-300";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{dict.itinerary.title}</h1>
      <p className="text-gray-500 mt-1.5 mb-6">{dict.itinerary.subtitle}</p>

      <form
        onSubmit={generate}
        className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-brand-950/5 ring-1 ring-black/5"
      >
        <div className="h-1.5 bg-gradient-to-r from-brand-700 via-accent-500 to-brand-700" />
        <div className="p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{dict.form.destination}</label>
          <input
            className={inputClass}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={dict.form.destinationPlaceholder}
            required
          />
        </div>
        <div>
          <label className={labelClass}>{locale === "ar" ? "عدد الأيام" : "Number of days"}</label>
          <input
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
          <label className={labelClass}>
            {dict.form.budget} ({locale === "ar" ? "اختياري، بدون الطيران والفندق" : "optional, excl. flight/hotel"})
          </label>
          <input
            type="number"
            min={0}
            step={50}
            className={inputClass}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>{dict.form.currency}</label>
          <input className={inputClass} value={currency} disabled />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>{dict.itinerary.interests}</label>
          <input
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
            className="w-full rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 px-6 py-4 text-base font-bold text-white shadow-lg shadow-accent-600/25 hover:brightness-105 hover:-translate-y-0.5 active:scale-[0.99] transition disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? dict.itinerary.generating : `${dict.itinerary.generate} 🗺️`}
          </button>
        </div>
        </div>
      </form>

      {result && (
        <div className="mt-8 space-y-5">
          {result.isMock && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              {dict.itinerary.mockNotice}
            </div>
          )}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-gray-700 leading-relaxed">{result.summary}</p>
          </div>

          <div className="space-y-4">
            {result.plan.map((day) => (
              <div
                key={day.day}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md hover:ring-brand-100"
              >
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-900 text-white text-xs font-bold">
                    {day.day}
                  </span>
                  {dict.itinerary.day} {day.day}: {day.title.replace(/^Day \d+:\s*/i, "").replace(/^اليوم \d+:\s*/, "")}
                </h3>
                <ul className="list-disc ps-5 space-y-1 text-sm text-gray-600">
                  {day.activities.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
                {day.estimatedCost && (
                  <p className="mt-2 text-xs text-gray-400">
                    {locale === "ar" ? "تكلفة تقديرية" : "Estimated cost"}: {day.estimatedCost}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
            <h3 className="font-bold text-brand-900 mb-2">{dict.itinerary.tips}</h3>
            <ul className="list-disc ps-5 space-y-1 text-sm text-brand-900">
              {result.tips.map((t, idx) => (
                <li key={idx}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
