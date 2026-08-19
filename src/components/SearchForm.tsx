"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { BedType, FlightRoute, Locale, TravelerCounts, TripType } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import TravelersPicker from "@/components/TravelersPicker";
import { parseChildrenAges, serializeChildrenAges } from "@/lib/searchParamsUtil";

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface LegDraft {
  destination: string;
  nights: number;
}

const DEFAULT_LEGS_AR: LegDraft[] = [
  { destination: "إسطنبول", nights: 3 },
  { destination: "باريس", nights: 4 },
];
const DEFAULT_LEGS_EN: LegDraft[] = [
  { destination: "Istanbul", nights: 3 },
  { destination: "Paris", nights: 4 },
];

export default function SearchForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const sp = useSearchParams();

  // When arriving here from a results page's "Edit search" link, every
  // field below is pre-filled from the query string instead of resetting
  // to defaults — the user edits their previous search rather than
  // starting over.
  const [tripType, setTripType] = useState<TripType>((sp.get("tripType") as TripType) || "both");
  const [tripRoute, setTripRoute] = useState<FlightRoute>(
    (sp.get("tripRoute") as FlightRoute) || "roundtrip"
  );
  const [origin, setOrigin] = useState(sp.get("origin") || (locale === "ar" ? "الرياض" : "Riyadh"));
  const [destination, setDestination] = useState(
    sp.get("destination") || (locale === "ar" ? "إسطنبول" : "Istanbul")
  );
  const [departDate, setDepartDate] = useState(sp.get("departDate") || todayPlus(30));
  const [returnDate, setReturnDate] = useState(sp.get("returnDate") || todayPlus(35));
  const [travelers, setTravelers] = useState<TravelerCounts>({
    adults: Number(sp.get("adults")) || 2,
    childrenAges: parseChildrenAges(sp.get("childrenAges")),
    infants: Number(sp.get("infants")) || 0,
  });
  const [budget, setBudget] = useState(Number(sp.get("budget")) || 6000);
  const [currency, setCurrency] = useState(sp.get("currency") || "SAR");
  const [directOnly, setDirectOnly] = useState(sp.get("directOnly") === "true");
  const [minStars, setMinStars] = useState(Number(sp.get("minStars")) || 0);
  const [bedType, setBedType] = useState<BedType | "">((sp.get("bedType") as BedType) || "");
  const [baggageIncluded, setBaggageIncluded] = useState(sp.get("baggageIncluded") === "true");
  const [breakfastIncluded, setBreakfastIncluded] = useState(sp.get("breakfastIncluded") === "true");
  const [legs, setLegs] = useState<LegDraft[]>(() => {
    const raw = sp.get("legs");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
      } catch {
        // fall through to defaults
      }
    }
    return locale === "ar" ? DEFAULT_LEGS_AR : DEFAULT_LEGS_EN;
  });

  // Trip route (round-trip/one-way/multi-city) only makes sense when a
  // flight is involved — hotel-only search has no "route".
  const showTripRoute = tripType !== "hotel";
  const showReturnDate = tripRoute === "multicity" ? false : tripType === "hotel" || tripRoute === "roundtrip";
  const showHotelFields = tripRoute === "multicity" || tripType !== "flight";
  const showFlightFields = tripRoute === "multicity" || tripType !== "hotel";

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
        adults: String(travelers.adults),
        childrenAges: serializeChildrenAges(travelers.childrenAges),
        infants: String(travelers.infants),
        budget: String(budget),
        currency,
        directOnly: String(directOnly),
        minStars: String(minStars),
        bedType,
        baggageIncluded: String(baggageIncluded),
        breakfastIncluded: String(breakfastIncluded),
        legs: JSON.stringify(validLegs),
      });
      router.push(`/${locale}/multicity-results?${params.toString()}`);
      return;
    }

    const params = new URLSearchParams({
      tripRoute,
      tripType,
      origin,
      destination,
      departDate,
      returnDate: showReturnDate ? returnDate : "",
      adults: String(travelers.adults),
      childrenAges: serializeChildrenAges(travelers.childrenAges),
      infants: String(travelers.infants),
      budget: String(budget),
      currency,
      directOnly: String(directOnly),
      minStars: String(minStars),
      bedType,
      baggageIncluded: String(baggageIncluded),
      breakfastIncluded: String(breakfastIncluded),
    });
    router.push(`/${locale}/results?${params.toString()}`);
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const checkboxLabelClass = "flex items-center gap-2 text-sm text-gray-700";
  const checkboxClass = "h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600";
  const segmentClass = (active: boolean) =>
    `rounded-xl px-4 py-2.5 text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
      active
        ? "bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20"
        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative z-10 w-full max-w-4xl mx-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-5 sm:p-7"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {(["both", "flight", "hotel"] as TripType[]).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => {
              setTripType(t);
              if (t === "hotel" && tripRoute === "multicity") setTripRoute("roundtrip");
            }}
            className={segmentClass(tripType === t)}
          >
            {t === "both" ? dict.form.tripTypeBoth : t === "flight" ? dict.form.tripTypeFlight : dict.form.tripTypeHotel}
          </button>
        ))}
      </div>

      {showTripRoute && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {(["roundtrip", "oneway", "multicity"] as FlightRoute[]).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setTripRoute(r)}
              className={segmentClass(tripRoute === r)}
            >
              {r === "roundtrip"
                ? dict.form.tripRouteRoundtrip
                : r === "oneway"
                ? dict.form.tripRouteOneway
                : dict.form.tripRouteMulticity}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {showFlightFields && (
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
        {showReturnDate && (
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
          <label className={labelClass}>{dict.travelers.label}</label>
          <TravelersPicker locale={locale} value={travelers} onChange={setTravelers} />
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

        {showFlightFields && (
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={directOnly}
              onChange={(e) => setDirectOnly(e.target.checked)}
              className={checkboxClass}
            />
            {dict.form.directOnly}
          </label>
        )}

        {showHotelFields && (
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

        {showFlightFields && (
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={baggageIncluded}
              onChange={(e) => setBaggageIncluded(e.target.checked)}
              className={checkboxClass}
            />
            {dict.form.baggageIncluded}
          </label>
        )}

        {showHotelFields && (
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={breakfastIncluded}
              onChange={(e) => setBreakfastIncluded(e.target.checked)}
              className={checkboxClass}
            />
            {dict.form.breakfastIncluded}
          </label>
        )}

        {showHotelFields && (
          <div className="sm:col-span-2">
            <label className={labelClass}>{dict.bedType.label}</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["", dict.bedType.any],
                ["shared", dict.bedType.shared],
                ["single", dict.bedType.single],
              ] as [BedType | "", string][]).map(([val, label]) => (
                <button
                  type="button"
                  key={val || "any"}
                  onClick={() => setBedType(val)}
                  className={segmentClass(bedType === val)}
                >
                  {label}
                </button>
              ))}
            </div>
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
              className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-900 hover:bg-brand-100 transition"
            >
              + {dict.multicity.addLeg}
            </button>
          </div>

          <div className="space-y-3">
            {legs.map((leg, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-200 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
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
        className="mt-6 w-full rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-accent-600/20 transition hover:brightness-105 hover:shadow-xl hover:shadow-accent-600/25 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
      >
        {tripRoute === "multicity" ? dict.multicity.submit : dict.form.submit}
      </button>
    </form>
  );
}
