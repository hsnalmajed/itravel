"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FlightRoute, Locale, TripType } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface LegDraft {
  destination: string;
  nights: number;
}

export default function SearchForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();

  const [tripRoute, setTripRoute] = useState<FlightRoute>("roundtrip");
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
  const [legs, setLegs] = useState<LegDraft[]>([
    { destination: locale === "ar" ? "إسطنبول" : "Istanbul", nights: 3 },
    { destination: locale === "ar" ? "باريس" : "Paris", nights: 4 },
  ]);

  function updateLeg(index: number, patch: Partial<LegDraft>) {
    setLegs((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function addLeg() {
    setLegs((prev) => [...prev, { destination: "", nights: 2 }]);
  }
  function removeLeg(index: number) {
    setLegs((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (tripRoute === "multicity") {
      const validLegs = legs.filter((l) => l.destination.trim().length > 0);
      if (validLegs.length < 2) return;
      const params = new URLSearchParams({
        origin,
        departDate,
        adults: String(adults),
        budget: String(budget),
        currency,
        directOnly: String(directOnly),
        minStars: String(minStars),
        legs: JSON.stringify(validLegs),
      });
      router.push(`/${locale}/multicity-results?${params.toString()}`);
      return;
    }

    const params = new URLSearchParams({
      tripType,
      origin,
      destination,
      departDate,
      returnDate: tripRoute === "oneway" ? "" : returnDate,
      adults: String(adults),
      budget: String(budget),
      currency,
      directOnly: String(directOnly),
      minStars: String(minStars),
    });
    router.push(`/${locale}/results?${params.toString()}`);
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 outline-none transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 w-full max-w-4xl mx-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-5 sm:p-7"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {(["roundtrip", "oneway", "multicity"] as FlightRoute[]).map((r) => (
          <button
            type="button"
            key={r}
            onClick={() => setTripRoute(r)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition border ${
              tripRoute === r
                ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {r === "roundtrip"
              ? dict.form.tripRouteRoundtrip
              : r === "oneway"
              ? dict.form.tripRouteOneway
              : dict.form.tripRouteMulticity}
          </button>
        ))}
      </div>

      {tripRoute !== "multicity" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {(["both", "flight", "hotel"] as TripType[]).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTripType(t)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition border ${
                tripType === t
                  ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {t === "both" ? dict.form.tripTypeBoth : t === "flight" ? dict.form.tripTypeFlight : dict.form.tripTypeHotel}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(tripRoute === "multicity" || tripType !== "hotel") && (
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

        {tripRoute !== "multicity" && (
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
        )}

        <div>
          <label className={labelClass}>{tripRoute === "multicity" ? dict.multicity.departDate : dict.form.departDate}</label>
          <input
            type="date"
            className={inputClass}
            value={departDate}
            min={todayPlus(0)}
            onChange={(e) => setDepartDate(e.target.value)}
            required
          />
        </div>
        {tripRoute === "roundtrip" && (
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
        )}

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

        {(tripRoute === "multicity" || tripType !== "hotel") && (
          <label className="flex items-center gap-2 text-sm text-gray-700 mt-1">
            <input
              type="checkbox"
              checked={directOnly}
              onChange={(e) => setDirectOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
            />
            {dict.form.directOnly}
          </label>
        )}

        {(tripRoute === "multicity" || tripType !== "flight") && (
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

      {tripRoute === "multicity" && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between mb-3">
            <p className={labelClass + " mb-0"}>{dict.multicity.title}</p>
            <button
              type="button"
              onClick={addLeg}
              className="rounded-lg bg-brand-blue/5 px-3 py-1.5 text-xs font-semibold text-brand-navy hover:bg-brand-blue/10 transition"
            >
              + {dict.multicity.addLeg}
            </button>
          </div>

          <div className="space-y-3">
            {legs.map((leg, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-200 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">
                  {i + 1}
                </span>
                <input
                  className={inputClass}
                  value={leg.destination}
                  onChange={(e) => updateLeg(i, { destination: e.target.value })}
                  placeholder={dict.multicity.legDestination}
                  required
                />
                <input
                  type="number"
                  min={1}
                  max={30}
                  className={inputClass + " w-28 shrink-0"}
                  value={leg.nights}
                  onChange={(e) => updateLeg(i, { nights: Number(e.target.value) })}
                  title={dict.multicity.legNights}
                />
                <button
                  type="button"
                  onClick={() => removeLeg(i)}
                  disabled={legs.length <= 2}
                  className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  {dict.multicity.removeLeg}
                </button>
              </div>
            ))}
          </div>
          {legs.filter((l) => l.destination.trim()).length < 2 && (
            <p className="mt-2 text-xs text-amber-600">{dict.multicity.minLegsNotice}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-brand-green to-brand-green-dark px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-green/20 hover:brightness-105 active:scale-[0.99] transition"
      >
        {tripRoute === "multicity" ? dict.multicity.submit : dict.form.submit}
      </button>
    </form>
  );
}
