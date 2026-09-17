"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DestinationCategory, FlightRoute, Locale, TravelerCounts, TripType } from "@/lib/types";
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

function nightsBetween(a: string, b: string) {
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  return Math.max(1, Math.round((t2 - t1) / (1000 * 60 * 60 * 24)));
}

const CATEGORY_OPTIONS: DestinationCategory[] = ["beach", "nature", "adventure", "city", "culture", "family"];

export default function DiscoverForm({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const sp = useSearchParams();

  // Pre-fill from the query string when arriving via "Edit search" so the
  // user edits their previous search instead of starting from scratch.
  // Trip type otherwise starts unselected — the rest of the form only
  // appears once it's actually chosen.
  const [tripType, setTripType] = useState<TripType | "">((sp.get("tripType") as TripType) || "");
  // Mirrors SearchForm's round-trip / one-way / multi-city selector so both
  // pages present the same trip-route concept in the same spot, right under
  // the trip-type buttons. "multicity" here keeps its previous meaning —
  // suggest a pair of destinations instead of one.
  const [tripRoute, setTripRoute] = useState<FlightRoute>(
    (sp.get("tripRoute") as FlightRoute) || "roundtrip"
  );
  const [preferenceCategory, setPreferenceCategory] = useState<DestinationCategory | "">(
    (sp.get("preferenceCategory") as DestinationCategory) || ""
  );
  const [origin, setOrigin] = useState(sp.get("origin") || "");
  const [budget, setBudget] = useState(sp.get("budget") || "");
  const [currency, setCurrency] = useState(sp.get("currency") || "SAR");
  // Empty by default (never a date pre-filled in as if the visitor had
  // typed it themselves) — the field shows a plain DD/MM/YYYY placeholder
  // until they actually pick one.
  const [departDate, setDepartDate] = useState(sp.get("departDate") || "");
  const [returnDate, setReturnDate] = useState(sp.get("returnDate") || "");
  // Only used in one-way mode, where there's no return date to derive a
  // hotel stay length from — the user sets it directly instead.
  const [oneWayNights, setOneWayNights] = useState(Number(sp.get("nights")) || 5);
  const [travelers, setTravelers] = useState<TravelerCounts>({
    adults: Number(sp.get("adults")) || 2,
    childrenAges: parseChildrenAges(sp.get("childrenAges")),
    infants: Number(sp.get("infants")) || 0,
  });
  const [directOnly, setDirectOnly] = useState(sp.get("directOnly") === "true");
  const [minStars, setMinStars] = useState(Number(sp.get("minStars")) || 0);
  // Room or apartment, with the concrete room type derived from the party
  // size at submit — same as the "I know where I'm going" form.
  const [stayType, setStayType] = useState<StayType | "">(() =>
    stayTypeFromRoomType(sp.get("roomType"))
  );
  const [baggageIncluded, setBaggageIncluded] = useState(sp.get("baggageIncluded") === "true");
  const [breakfastIncluded, setBreakfastIncluded] = useState(sp.get("breakfastIncluded") === "true");

  // Flight-only fields (direct-flights toggle, baggage) only matter when a
  // flight is actually part of the trip; hotel fields (star rating, room
  // type, breakfast, nights derived from the dates) only matter when a
  // hotel is part of the trip.
  const showFlightFields = tripType === "both" || tripType === "flight";
  const showHotelFields = tripType === "both" || tripType === "hotel";

  // A party that outgrows a room moves to an apartment on its own, derived
  // rather than patched in an effect.
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


  const guests = occupancy(travelers);
  const effectiveStayType: StayType | "" =
    stayType === "room" && !roomFitsParty(guests) ? "apartment" : stayType;

  // The budget field names what the money actually has to cover, exactly as
  // it does in the "I know where I'm going" form. Asking for a "total
  // budget" when the traveller only asked for hotels invites them to include
  // a flight we are not pricing.
  const budgetLabel =
    tripType === "flight"
      ? dict.form.budgetFlight
      : tripType === "hotel"
        ? dict.form.budgetHotel
        : dict.form.budgetBoth;

  /** See the note in formErrors.ts — every gap gets its own message. */
  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!tripType) next.tripType = dict.form.errorTripType;
    if (!origin.trim()) next.origin = dict.form.errorOrigin;
    if (!departDate) next.departDate = dict.form.errorDepartDate;
    if (tripRoute !== "oneway" && !returnDate) next.returnDate = dict.form.errorReturnDate;
    if (!budget.trim()) next.budget = dict.form.errorBudget;
    else if (Number(budget) <= 0) next.budget = dict.form.errorBudgetPositive;
    return next;
  }

  const FIELD_ORDER = ["tripType", "origin", "budget", "departDate", "returnDate"];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    if (hasErrors(found)) {
      focusFirstError(found, FIELD_ORDER);
      return;
    }

    const isOneWay = tripRoute === "oneway";
    const nights = isOneWay ? Math.max(1, oneWayNights) : nightsBetween(departDate, returnDate);
    const roomType = resolveRoomType(effectiveStayType, guests);
    const params = new URLSearchParams({
      mode: "discover",
      tripType,
      origin,
      budget: String(Number(budget) || 6000),
      currency: effectiveCurrency,
      departDate,
      returnDate: isOneWay ? "" : returnDate,
      nights: String(nights),
      adults: String(travelers.adults),
      childrenAges: serializeChildrenAges(travelers.childrenAges),
      infants: String(travelers.infants),
      directOnly: String(directOnly),
      minStars: String(minStars),
      roomType,
      tripRoute,
      multiDestination: String(tripRoute === "multicity"),
      oneWayOnly: String(isOneWay),
      baggageIncluded: String(baggageIncluded),
      breakfastIncluded: String(breakfastIncluded),
      preferenceCategory,
    });
    router.push(`/${locale}/discover-results?${params.toString()}`);
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
            onClick={() => setTripType(t)}
            className={segmentClass(tripType === t) + " flex items-center justify-center gap-2"}
          >
            <span aria-hidden="true">{tripTypeIcon[t]}</span>
            {t === "both" ? dict.form.tripTypeBoth : t === "flight" ? dict.form.tripTypeFlight : dict.form.tripTypeHotel}
          </button>
        ))}
      </div>

      {!tripType && <p className="mt-3 text-sm text-gray-400">{dict.form.chooseTripTypeFirst}</p>}

      {/* Same round-trip / one-way / multi-city control as the main search
          form, in the same spot right under the trip-type buttons. */}
      {tripType && (
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
        <div>
          {tripRoute === "multicity" && (
            <p className="text-xs text-gray-500 -mt-2 mb-4">{dict.discoverForm.multiDestinationHint}</p>
          )}
          {tripRoute === "oneway" && (
            <p className="text-xs text-gray-500 -mt-2 mb-4">{dict.discoverForm.oneWayHint}</p>
          )}

          <div>
            <label className={labelClass}>{dict.categories.label}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPreferenceCategory("")}
                className={segmentClass(preferenceCategory === "")}
              >
                {dict.categories.any}
              </button>
              {CATEGORY_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setPreferenceCategory(c)}
                  className={segmentClass(preferenceCategory === c)}
                >
                  {dict.categories[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div data-field="origin">
              <label className={labelClass}>{dict.discoverForm.origin}</label>
              <AirportInput
                locale={locale}
                value={origin}
                onChange={(v) => {
                  setOrigin(v);
                  setErrors((prev) => ({ ...prev, origin: "" }));
                }}
                placeholder={dict.form.originPlaceholder}
                  ariaLabel={dict.discoverForm.origin}
                required
              />
              {errors.origin && (
                <p role="alert" className="mt-1.5 text-xs font-semibold text-red-600">
                  {errors.origin}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div data-field="budget">
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
                <label className={labelClass}>{dict.discoverForm.currency}</label>
                <CurrencySelect
                  className={inputClass}
                  value={effectiveCurrency}
                  onChange={(c) => {
                    setCurrency(c);
                    setCurrencyTouched(true);
                  }}
                  label={dict.discoverForm.currency}
                />
              </div>
            </div>

            <div data-field="departDate" className={tripRoute === "oneway" ? undefined : "sm:col-span-2"}>
              <label className={labelClass}>
                {tripRoute === "oneway" ? dict.discoverForm.departDate : dict.form.dates}
              </label>
              <DateRangeInput
                locale={locale}
                departDate={departDate}
                returnDate={returnDate}
                withReturn={tripRoute !== "oneway"}
                required
                error={errors.departDate || errors.returnDate}
                onChange={({ departDate: d, returnDate: r }) => {
                  setDepartDate(d);
                  setReturnDate(r);
                  setErrors((prev) => ({ ...prev, departDate: "", returnDate: "" }));
                }}
              />
            </div>

            {tripRoute === "oneway" && (
              <div>
                <label className={labelClass}>{dict.discoverForm.nights}</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  className={inputClass}
                  value={oneWayNights}
                  onChange={(e) => setOneWayNights(Number(e.target.value))}
                  required
                />
              </div>
            )}

            <div>
              <label className={labelClass}>{dict.travelers.label}</label>
              <TravelersPicker locale={locale} value={travelers} onChange={setTravelers} />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">{dict.form.additionalOptions}</p>

              {/* Star rating and stay type live with the other preferences,
                  not beside the questions the search can't run without. */}
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
                    {dict.discoverForm.directOnly}
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
                    {dict.discoverForm.baggageIncluded}
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
                    {dict.discoverForm.breakfastIncluded}
                  </label>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 px-6 py-4 text-base font-bold text-white shadow-lg shadow-accent-600/25 transition hover:brightness-105 hover:shadow-xl hover:shadow-accent-600/30 hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
          >
            {dict.discoverForm.submit} 🔍
          </button>
        </div>
      )}
      </div>
    </form>
  );
}
