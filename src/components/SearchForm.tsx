"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FlightRoute, Locale, TravelerCounts, TripType } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import TravelersPicker from "@/components/TravelersPicker";
import AirportInput from "@/components/AirportInput";
import CurrencySelect, { currencyForOrigin } from "@/components/CurrencySelect";
import DateRangeInput from "@/components/DateRangeInput";
import HotelPreferences from "@/components/HotelPreferences";
import {
  occupancy,
  resolveRoomType,
  roomFitsParty,
  stayTypeFromRoomType,
  type StayType,
} from "@/lib/stayType";
import { parseChildrenAges, serializeChildrenAges } from "@/lib/searchParamsUtil";
import { focusFirstError, hasErrors, type FieldErrors } from "@/lib/formErrors";

interface LegDraft {
  destination: string;
  nights: number;
}

export default function SearchForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const sp = useSearchParams();

  // When arriving here from a results page's "Edit search" link, every
  // field below is pre-filled from the query string instead of resetting
  // to defaults — the user edits their previous search rather than
  // starting over. Otherwise trip type starts unselected: the rest of the
  // form (trip route, origin, flight/hotel-specific fields) only appears
  // once the customer actually picks flights/hotels/both, instead of
  // showing everything against a default that was never really chosen.
  const [tripType, setTripType] = useState<TripType | "">((sp.get("tripType") as TripType) || "");
  const [tripRoute, setTripRoute] = useState<FlightRoute>(
    (sp.get("tripRoute") as FlightRoute) || "roundtrip"
  );
  const [origin, setOrigin] = useState(sp.get("origin") || "");
  const [destination, setDestination] = useState(sp.get("destination") || "");
  // Empty by default (never a date pre-filled in as if the visitor had
  // typed it themselves) — the field shows a plain DD/MM/YYYY placeholder
  // until they actually pick one.
  const [departDate, setDepartDate] = useState(sp.get("departDate") || "");
  const [returnDate, setReturnDate] = useState(sp.get("returnDate") || "");
  const [travelers, setTravelers] = useState<TravelerCounts>({
    adults: Number(sp.get("adults")) || 2,
    childrenAges: parseChildrenAges(sp.get("childrenAges")),
    infants: Number(sp.get("infants")) || 0,
  });
  const [budget, setBudget] = useState(sp.get("budget") || "");
  const [currency, setCurrency] = useState(sp.get("currency") || "SAR");
  const [directOnly, setDirectOnly] = useState(sp.get("directOnly") === "true");
  const [minStars, setMinStars] = useState(Number(sp.get("minStars")) || 0);
  // The traveller picks a room or an apartment; the concrete room type is
  // worked out from the party size at submit. See stayType.ts.
  const [stayType, setStayType] = useState<StayType | "">(() =>
    stayTypeFromRoomType(sp.get("roomType"))
  );
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
    return [
      { destination: "", nights: 3 },
      { destination: "", nights: 4 },
    ];
  });

  // Trip route (round-trip/one-way/multi-city) only makes sense once a
  // flight-inclusive trip type has actually been chosen — hotel-only search
  // has no "route", and showing it against an unmade choice was confusing.
  const budgetLabel =
    tripType === "flight"
      ? dict.form.budgetFlight
      : tripType === "hotel"
        ? dict.form.budgetHotel
        : dict.form.budgetBoth;

  // If the party grows past what a room holds after "room" was chosen, the
  // answer changes with it rather than silently staying impossible. Derived
  // instead of corrected in an effect, so there is never a render in which the
  // form is showing a choice that can't be booked.
  const guests = occupancy(travelers);
  const effectiveStayType: StayType | "" =
    stayType === "room" && !roomFitsParty(guests) ? "apartment" : stayType;

  const [errors, setErrors] = useState<FieldErrors>({});

  /**
   * The currency follows the departure city, until the traveller says
   * otherwise.
   *
   * Opening on SAR for someone flying out of Kuwait City makes them convert
   * their own budget before they can type it. But a form that keeps
   * re-deciding would fight anyone who deliberately budgets in dollars, so
   * this only fires while the choice is still the untouched default, and
   * stops for good the moment the select is used.
   */
  const [currencyTouched, setCurrencyTouched] = useState(Boolean(sp.get("currency")));
  const originCurrency = currencyForOrigin(origin);
  const effectiveCurrency = !currencyTouched && originCurrency ? originCurrency : currency;


  const showTripRoute = tripType === "both" || tripType === "flight";
  const showReturnDate = tripRoute === "multicity" ? false : tripType === "hotel" || tripRoute === "roundtrip";
  const showHotelFields = tripRoute === "multicity" || tripType === "both" || tripType === "hotel";
  const showFlightFields = tripRoute === "multicity" || tripType === "both" || tripType === "flight";

  function updateLeg(index: number, patch: Partial<LegDraft>) {
    setLegs((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function addLeg() {
    setLegs((prev) => [...prev, { destination: "", nights: 2 }]);
  }
  function removeLeg(index: number) {
    setLegs((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev));
  }

  /**
   * Everything the form needs before it can search.
   *
   * Returned as a map rather than thrown at the first problem, so a visitor
   * who left three boxes empty is told about all three at once instead of
   * discovering them one submit at a time.
   */
  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!tripType) next.tripType = dict.form.errorTripType;
    if (showFlightFields && !origin.trim()) next.origin = dict.form.errorOrigin;
    if (tripRoute !== "multicity" && !destination.trim()) {
      next.destination = dict.form.errorDestination;
    }
    if (!departDate) next.departDate = dict.form.errorDepartDate;
    if (showReturnDate && !returnDate) next.returnDate = dict.form.errorReturnDate;
    if (!budget.trim()) next.budget = dict.form.errorBudget;
    else if (Number(budget) <= 0) next.budget = dict.form.errorBudgetPositive;
    if (tripRoute === "multicity" && legs.filter((l) => l.destination.trim()).length < 2) {
      next.legs = dict.form.errorLegs;
    }
    return next;
  }

  const FIELD_ORDER = ["tripType", "origin", "destination", "legs", "departDate", "returnDate", "budget"];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    if (hasErrors(found)) {
      focusFirstError(found, FIELD_ORDER);
      return;
    }

    const resolvedBudget = String(Number(budget) || 6000);
    // The hotel API and the offer data speak in room types, so the two-way
    // choice is translated back here rather than leaking into the URL.
    const roomType = resolveRoomType(effectiveStayType, guests);

    if (tripRoute === "multicity") {
      const validLegs = legs.filter((l) => l.destination.trim().length > 0);
      const params = new URLSearchParams({
        origin,
        departDate,
        adults: String(travelers.adults),
        childrenAges: serializeChildrenAges(travelers.childrenAges),
        infants: String(travelers.infants),
        budget: resolvedBudget,
        currency: effectiveCurrency,
        directOnly: String(directOnly),
        minStars: String(minStars),
        roomType,
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
      budget: resolvedBudget,
      currency: effectiveCurrency,
      directOnly: String(directOnly),
      minStars: String(minStars),
      roomType,
      baggageIncluded: String(baggageIncluded),
      breakfastIncluded: String(breakfastIncluded),
    });
    router.push(`/${locale}/results?${params.toString()}`);
  }

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.75 text-sm text-gray-800 shadow-sm transition outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 hover:border-gray-300 placeholder:text-gray-400 placeholder:font-normal";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";
  const checkboxLabelClass = "flex items-center gap-2 text-sm text-gray-700";
  const checkboxClass = "h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600";
  const segmentClass = (active: boolean) =>
    `rounded-xl px-4 py-3 text-sm font-bold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
      active
        ? "bg-gradient-to-br from-brand-700 to-brand-900 text-white border-brand-800 shadow-md shadow-brand-900/25"
        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-white hover:border-brand-200 hover:text-brand-800"
    }`;
  const tripTypeIcon: Record<TripType, string> = { both: "✈️🏨", flight: "✈️", hotel: "🏨" };
  const tripRouteIcon: Record<FlightRoute, string> = { roundtrip: "🔁", oneway: "➜", multicity: "🧭" };

  return (
    <form
      // Our own validation, not the browser's. A native `required`
      // blocks submit before onSubmit ever fires, so the handler below
      // never ran and no message was ever shown — the button simply did
      // nothing. Chrome's own bubble is no substitute: it shows one
      // field at a time, is not translated to match the page, and is
      // positioned for an LTR layout.
      noValidate
      onSubmit={handleSubmit}
      className="relative z-10 w-full max-w-4xl mx-auto overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-950/10 ring-1 ring-black/5"
    >
      <div className="h-1.5 bg-gradient-to-r from-brand-700 via-accent-500 to-brand-700" />
      <div className="p-5 sm:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["both", "flight", "hotel"] as TripType[]).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => {
              setTripType(t);
              if (t === "hotel" && tripRoute === "multicity") setTripRoute("roundtrip");
            }}
            className={segmentClass(tripType === t) + " flex items-center justify-center gap-2"}
          >
            <span aria-hidden="true">{tripTypeIcon[t]}</span>
            {t === "both" ? dict.form.tripTypeBoth : t === "flight" ? dict.form.tripTypeFlight : dict.form.tripTypeHotel}
          </button>
        ))}
      </div>

      {!tripType && <p className="mt-3 text-sm text-gray-400">{dict.form.chooseTripTypeFirst}</p>}

      {showTripRoute && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 mb-4">
          {(["roundtrip", "oneway", "multicity"] as FlightRoute[]).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setTripRoute(r)}
              className={segmentClass(tripRoute === r) + " flex items-center justify-center gap-1.5"}
            >
              <span aria-hidden="true">{tripRouteIcon[r]}</span>
              {r === "roundtrip"
                ? dict.form.tripRouteRoundtrip
                : r === "oneway"
                ? dict.form.tripRouteOneway
                : dict.form.tripRouteMulticity}
            </button>
          ))}
        </div>
      )}

      {tripType && (
        <div className={showTripRoute ? "" : "mt-4"}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showFlightFields && (
              <div data-field="origin">
                <label className={labelClass}>{dict.form.origin}</label>
                <AirportInput
                  locale={locale}
                  value={origin}
                  onChange={(v) => {
                    setOrigin(v);
                    setErrors((prev) => ({ ...prev, origin: "" }));
                  }}
                  placeholder={dict.form.originPlaceholder}
                  ariaLabel={dict.form.origin}
                  required
                />
                {errors.origin && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                    {errors.origin}
                  </p>
                )}
              </div>
            )}

            {tripRoute !== "multicity" && (
              <div data-field="destination">
                <label className={labelClass}>{dict.form.destination}</label>
                <AirportInput
                  locale={locale}
                  value={destination}
                  onChange={(v) => {
                    setDestination(v);
                    setErrors((prev) => ({ ...prev, destination: "" }));
                  }}
                  placeholder={dict.form.destinationPlaceholder}
                  ariaLabel={dict.form.destination}
                  required
                />
                {errors.destination && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                    {errors.destination}
                  </p>
                )}
              </div>
            )}

            <div data-field="departDate" className={showReturnDate ? "sm:col-span-2" : undefined}>
              <label className={labelClass}>
                {tripRoute === "multicity"
                  ? dict.multicity.departDate
                  : showReturnDate
                    ? dict.form.dates
                    : dict.form.departDate}
              </label>
              {/* One control for both ends of the trip — see DateRangeInput
                  for why the native date input had to go. */}
              <DateRangeInput
                locale={locale}
                departDate={departDate}
                returnDate={returnDate}
                withReturn={showReturnDate}
                required
                error={errors.departDate || errors.returnDate}
                onChange={({ departDate: d, returnDate: r }) => {
                  setDepartDate(d);
                  setReturnDate(r);
                  setErrors((prev) => ({ ...prev, departDate: "", returnDate: "" }));
                }}
              />
            </div>

            <div>
              <label className={labelClass}>{dict.travelers.label}</label>
              <TravelersPicker locale={locale} value={travelers} onChange={setTravelers} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div data-field="budget">
                {/* The label names exactly what the number has to cover, so
                    nobody enters a flight-only figure against a trip that
                    also has to pay for the hotel. */}
                <label className={labelClass}>{budgetLabel}</label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  className={inputClass}
                  value={budget}
                  placeholder={dict.form.budgetPlaceholder}
                  onChange={(e) => {
                    setBudget(e.target.value);
                    setErrors((prev) => ({ ...prev, budget: "" }));
                  }}
                  required
                />
                {errors.budget && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                    {errors.budget}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>{dict.form.currency}</label>
                <CurrencySelect
                  className={inputClass}
                  value={effectiveCurrency}
                  onChange={(c) => {
                    setCurrency(c);
                    setCurrencyTouched(true);
                  }}
                  label={dict.form.currency}
                />
              </div>
            </div>

            {(showFlightFields || showHotelFields) && (
              <div className="sm:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">{dict.form.additionalOptions}</p>

                {/* Star rating and stay type are preferences, not questions
                    the trip depends on, so they sit here with the rest of the
                    optional detail rather than beside the dates. */}
                {showHotelFields && (
                  <div className="mb-4 border-b border-gray-200 pb-4">
                    <HotelPreferences
                      locale={locale}
                      travelers={travelers}
                      minStars={minStars}
                      onMinStarsChange={setMinStars}
                      stayType={effectiveStayType}
                      onStayTypeChange={setStayType}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    <div className="flex-1">
                      <AirportInput
                        locale={locale}
                        value={leg.destination}
                        onChange={(v) => updateLeg(i, { destination: v })}
                        placeholder={dict.multicity.legDestination}
                        required
                      />
                    </div>
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
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 px-6 py-4 text-base font-bold text-white shadow-lg shadow-accent-600/25 transition hover:brightness-105 hover:shadow-xl hover:shadow-accent-600/30 hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
          >
            {tripRoute === "multicity" ? dict.multicity.submit : dict.form.submit} 🔍
          </button>
        </div>
      )}
      </div>
    </form>
  );
}
