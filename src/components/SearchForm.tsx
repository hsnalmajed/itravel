"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale, TripType } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function SearchForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();

  const [tripType, setTripType] = useState<TripType>("both");
  const [origin, setOrigin] = useState(locale === "ar" ? "الرياض" : "Riyadh");
  const [destination, setDestination] = useState(locale === "ar" ? "إسطنبول" : "Istanbul");
  const [departDate, setDepartDate] = useState(todayPlus(30));
  const [returnDate, setReturnDate] = useState(todayPlus(35));
  const [adults, setAdults] = useState(2);
  const [budget, setBudget] = useState(6000);
  const [currency, setCurrency] = useState("SAR");
  const [directOnly, setDirectOnly] = useState(false);
  const [minStars, setMinStars] = useState(0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({
      tripType,
      origin,
      destination,
      departDate,
      returnDate: tripType === "flight" && !returnDate ? "" : returnDate,
      adults: String(adults),
      budget: String(budget),
      currency,
      directOnly: String(directOnly),
      minStars: String(minStars),
    });
    router.push(`/${locale}/results?${params.toString()}`);
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 w-full max-w-4xl mx-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-5 sm:p-7"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {(["both", "flight", "hotel"] as TripType[]).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setTripType(t)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition border ${
              tripType === t
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {t === "both" ? dict.form.tripTypeBoth : t === "flight" ? dict.form.tripTypeFlight : dict.form.tripTypeHotel}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tripType !== "hotel" && (
          <div>
            <label className={labelClass}>{dict.form.origin}</label>
            <input
              className={inputClass}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder={dict.form.originPlaceholder}
              required
            />
          </div>
        )}
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
          <label className={labelClass}>{dict.form.departDate}</label>
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
          <label className={labelClass}>{dict.form.returnDate}</label>
          <input
            type="date"
            className={inputClass}
            value={returnDate}
            min={departDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>{dict.form.adults}</label>
          <input
            type="number"
            min={1}
            max={9}
            className={inputClass}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{dict.form.budget}</label>
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
            <label className={labelClass}>{dict.form.currency}</label>
            <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="SAR">SAR</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {tripType !== "hotel" && (
          <label className="flex items-center gap-2 text-sm text-gray-700 mt-1">
            <input
              type="checkbox"
              checked={directOnly}
              onChange={(e) => setDirectOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            {dict.form.directOnly}
          </label>
        )}

        {tripType !== "flight" && (
          <div>
            <label className={labelClass}>{dict.form.minStars}</label>
            <select
              className={inputClass}
              value={minStars}
              onChange={(e) => setMinStars(Number(e.target.value))}
            >
              <option value={0}>{dict.form.anyStars}</option>
              {[2, 3, 4, 5].map((s) => (
                <option key={s} value={s}>
                  {"★".repeat(s)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-[0.99] transition"
      >
        {dict.form.submit}
      </button>
    </form>
  );
}
