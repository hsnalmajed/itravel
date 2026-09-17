"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  DestinationCategory,
  FlightRoute,
  Locale,
  TravelerCounts,
  TripType,
} from "@/lib/types";
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
import { formStyles, type FormTone } from "@/lib/formTone";

/**
 * One planner, asked once.
 *
 * There used to be two forms behind two tabs: "I have a destination" and
 * "suggest me one". They asked almost entirely the same questions — where
 * you leave from, how much you have, flights or hotels or both, round trip
 * or one way, when, how many of you — and differed in exactly one answer:
 * whether you name the place or we do. Anyone who filled one in and then
 * wondered whether their money went further somewhere else had to type the
 * whole thing again in the other, which is a strange thing to charge someone
 * for asking the site's central question.
 *
 * So the tabs are gone and the fork moved to where it actually belongs: the
 * destination field. Everything else is asked once, and switching between
 * "I know where I'm going" and "suggest somewhere" keeps every answer,
 * because there is only one form and one set of state. Checking whether the
 * same budget and the same dates would buy a better trip elsewhere is now
 * one click, which is the whole promise of a budget-first travel site.
 *
 * The three destinations this can submit to are unchanged:
 *   known + multi-city  → /multicity-results  (the legs the traveller listed)
 *   known               → /results
 *   suggest             → /discover-results
 */

type Mode = "known" | "discover";

interface LegDraft {
  destination: string;
  nights: number;
}

const CATEGORY_OPTIONS: DestinationCategory[] = [
  "beach",
  "nature",
  "adventure",
  "city",
  "culture",
  "family",
];

function nightsBetween(a: string, b: string) {
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  return Math.max(1, Math.round((t2 - t1) / (1000 * 60 * 60 * 24)));
}

export default function TripPlanner({
  locale,
  tone = "light",
}: {
  locale: Locale;
  /** "dark" when the form sits on the hero photograph — see formTone.ts. */
  tone?: FormTone;
}) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const sp = useSearchParams();

  // Arriving from a results page's "edit search" carries every answer back,
  // including which side of the destination question it came from.
  const [mode, setMode] = useState<Mode>(sp.get("mode") === "discover" ? "discover" : "known");

  const [tripType, setTripType] = useState<TripType | "">((sp.get("tripType") as TripType) || "");
  const [tripRoute, setTripRoute] = useState<FlightRoute>(
    (sp.get("tripRoute") as FlightRoute) || "roundtrip"
  );
  const [origin, setOrigin] = useState(sp.get("origin") || "");
  const [destination, setDestination] = useState(sp.get("destination") || "");
  const [preferenceCategory, setPreferenceCategory] = useState<DestinationCategory | "">(
    (sp.get("preferenceCategory") as DestinationCategory) || ""
  );
  // Empty by default — never a date pre-filled as if the visitor had typed
  // it themselves.
  const [departDate, setDepartDate] = useState(sp.get("departDate") || "");
  const [returnDate, setReturnDate] = useState(sp.get("returnDate") || "");
  // A one-way trip has no return date to measure the hotel stay against, so
  // the traveller says how long they are staying. Previously only the
  // "suggest me" form asked; a one-way search with a hotel in it was being
  // priced for a single night.
  const [nights, setNights] = useState(Number(sp.get("nights")) || 5);
  const [travelers, setTravelers] = useState<TravelerCounts>({
    adults: Number(sp.get("adults")) || 2,
    childrenAges: parseChildrenAges(sp.get("childrenAges")),
    infants: Number(sp.get("infants")) || 0,
  });
  const [budget, setBudget] = useState(sp.get("budget") || "");
  const [currency, setCurrency] = useState(sp.get("currency") || "SAR");
  const [directOnly, setDirectOnly] = useState(sp.get("directOnly") === "true");
  const [minStars, setMinStars] = useState(Number(sp.get("minStars")) || 0);
  const [stayType, setStayType] = useState<StayType | "">(() =>
    stayTypeFromRoomType(sp.get("roomType"))
  );
  const [baggageIncluded, setBaggageIncluded] = useState(sp.get("baggageIncluded") === "true");
  const [breakfastIncluded, setBreakfastIncluded] = useState(
    sp.get("breakfastIncluded") === "true"
  );
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
  const [errors, setErrors] = useState<FieldErrors>({});

  /**
   * The currency follows the departure city, until the traveller says
   * otherwise. Opening on SAR for someone flying out of Kuwait City makes
   * them convert their own budget before they can type it; a form that kept
   * re-deciding would fight anyone who deliberately budgets in dollars.
   */
  const [currencyTouched, setCurrencyTouched] = useState(Boolean(sp.get("currency")));
  const originCurrency = currencyForOrigin(origin);
  const effectiveCurrency = !currencyTouched && originCurrency ? originCurrency : currency;

  const guests = occupancy(travelers);
  const effectiveStayType: StayType | "" =
    stayType === "room" && !roomFitsParty(guests) ? "apartment" : stayType;

  const showTripRoute = tripType === "both" || tripType === "flight";
  const showFlightFields = tripType === "both" || tripType === "flight";
  const showHotelFields = tripType === "both" || tripType === "hotel";

  // "Multi-city" means two different things on the two sides of the
  // destination question, and both are honest readings of it: a list of
  // cities the traveller names, or a pair of destinations for us to suggest.
  const listsLegs = mode === "known" && tripRoute === "multicity";
  const isOneWay = tripRoute === "oneway";

  const showReturnDate = tripType === "hotel" ? true : !isOneWay && !listsLegs;
  // Only worth asking when a hotel is actually being priced.
  const showNights = isOneWay && showHotelFields;

  const budgetLabel =
    tripType === "flight"
      ? dict.form.budgetFlight
      : tripType === "hotel"
        ? dict.form.budgetHotel
        : dict.form.budgetBoth;

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
   * Everything the planner needs before it can search — returned as a map
   * rather than thrown at the first problem, so a visitor who left three
   * boxes empty is told about all three at once.
   */
  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!tripType) next.tripType = dict.form.errorTripType;
    if (showFlightFields && !origin.trim()) next.origin = dict.form.errorOrigin;
    if (mode === "known" && !listsLegs && !destination.trim()) {
      next.destination = dict.form.errorDestination;
    }
    if (listsLegs && legs.filter((l) => l.destination.trim()).length < 2) {
      next.legs = dict.form.errorLegs;
    }
    if (!departDate) next.departDate = dict.form.errorDepartDate;
    if (showReturnDate && !returnDate) next.returnDate = dict.form.errorReturnDate;
    if (!budget.trim()) next.budget = dict.form.errorBudget;
    else if (Number(budget) <= 0) next.budget = dict.form.errorBudgetPositive;
    return next;
  }

  const FIELD_ORDER = [
    "tripType",
    "origin",
    "destination",
    "legs",
    "departDate",
    "returnDate",
    "budget",
  ];

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
    // room/apartment choice is translated back here rather than leaking out.
    const roomType = resolveRoomType(effectiveStayType, guests);
    const stayNights = showReturnDate ? nightsBetween(departDate, returnDate) : Math.max(1, nights);

    // Every answer that is the same on both sides of the question, in one
    // place — so the three destinations below cannot drift apart.
    const shared: Record<string, string> = {
      tripType,
      tripRoute,
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
      nights: String(stayNights),
    };

    if (listsLegs) {
      const validLegs = legs.filter((l) => l.destination.trim().length > 0);
      const params = new URLSearchParams({ ...shared, legs: JSON.stringify(validLegs) });
      router.push(`/${locale}/multicity-results?${params.toString()}`);
      return;
    }

    if (mode === "discover") {
      const params = new URLSearchParams({
        ...shared,
        mode: "discover",
        returnDate: showReturnDate ? returnDate : "",
        multiDestination: String(tripRoute === "multicity"),
        oneWayOnly: String(isOneWay),
        preferenceCategory,
      });
      router.push(`/${locale}/discover-results?${params.toString()}`);
      return;
    }

    const params = new URLSearchParams({
      ...shared,
      mode: "known",
      destination,
      returnDate: showReturnDate ? returnDate : "",
    });
    router.push(`/${locale}/results?${params.toString()}`);
  }

  const st = formStyles(tone);
  const inputClass = st.input;
  const labelClass = st.label;
  const checkboxLabelClass = st.checkboxRow;
  const checkboxClass = st.checkbox;
  const segmentClass = st.segment;
  const errorClass = `mt-1.5 text-xs font-semibold ${
    tone === "dark" ? "text-rose-300" : "text-red-600"
  }`;
  const hintClass = `-mt-1 mb-3 text-xs ${tone === "dark" ? "text-white/55" : "text-gray-500"}`;
  const tripTypeIcon: Record<TripType, string> = { both: "✈️🏨", flight: "✈️", hotel: "🏨" };
  const tripRouteIcon: Record<FlightRoute, string> = {
    roundtrip: "🔁",
    oneway: "➜",
    multicity: "🧭",
  };

  return (
    <form
      // Our own validation, not the browser's: a native `required` blocks
      // submit before onSubmit ever fires, so the handler never ran and no
      // message was ever shown — the button simply did nothing.
      noValidate
      onSubmit={handleSubmit}
      className={st.surface}
    >
      {tone === "light" && (
        <div className="h-1.5 bg-gradient-to-r from-brand-700 via-accent-500 to-brand-700" />
      )}
      <div className={tone === "light" ? "p-5 sm:p-8" : ""}>
        {/* ── What the trip is made of ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
              {t === "both"
                ? dict.form.tripTypeBoth
                : t === "flight"
                  ? dict.form.tripTypeFlight
                  : dict.form.tripTypeHotel}
            </button>
          ))}
        </div>

        {!tripType && <p className={`mt-3 ${st.muted}`}>{dict.form.chooseTripTypeFirst}</p>}

        {showTripRoute && (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:mt-3 sm:gap-3">
            {(["roundtrip", "oneway", "multicity"] as FlightRoute[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setTripRoute(r)}
                className={
                  segmentClass(tripRoute === r) + " flex items-center justify-center gap-1.5"
                }
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
          <div className="mt-4">
            {/* ── The one question that used to be two forms ───────────
                Not a tab bar at the top of the panel any more. It is the
                destination question itself, sitting where the destination
                is asked, so answering it the other way costs nothing that
                was already typed. */}
            <div className="mb-4">
              <label className={labelClass}>{dict.form.whereToLabel}</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setMode("known")}
                  aria-pressed={mode === "known"}
                  className={
                    segmentClass(mode === "known") + " flex items-center justify-center gap-1.5"
                  }
                >
                  <span aria-hidden="true">🎯</span>
                  {dict.modeSelect.knownTitle}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("discover")}
                  aria-pressed={mode === "discover"}
                  className={
                    segmentClass(mode === "discover") + " flex items-center justify-center gap-1.5"
                  }
                >
                  <span aria-hidden="true">🧭</span>
                  {dict.modeSelect.discoverTitle}
                </button>
              </div>
            </div>

            {mode === "discover" && tripRoute === "multicity" && (
              <p className={hintClass}>{dict.discoverForm.multiDestinationHint}</p>
            )}
            {isOneWay && <p className={hintClass}>{dict.discoverForm.oneWayHint}</p>}

            {/* The only field that belongs to one side of the question
                alone. It sits above the shared fields because it is what
                the traveller just answered. */}
            {mode === "discover" && (
              <div className="mb-4">
                <label className={labelClass}>{dict.categories.label}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
            )}

            {/* ── Everything both sides need, asked once ─────────────── */}
            <div
              className={`grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 ${
                tone === "dark" ? "lg:grid-cols-4" : ""
              }`}
            >
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
                    className={inputClass}
                    ariaLabel={dict.form.origin}
                    required
                  />
                  {errors.origin && (
                    <p role="alert" className={errorClass}>
                      {errors.origin}
                    </p>
                  )}
                </div>
              )}

              {mode === "known" && !listsLegs && (
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
                    className={inputClass}
                    ariaLabel={dict.form.destination}
                    required
                  />
                  {errors.destination && (
                    <p role="alert" className={errorClass}>
                      {errors.destination}
                    </p>
                  )}
                </div>
              )}

              <div
                data-field="departDate"
                className={showReturnDate && tone !== "dark" ? "sm:col-span-2" : undefined}
              >
                <label className={labelClass}>
                  {showReturnDate ? dict.form.dates : dict.form.departDate}
                </label>
                <DateRangeInput
                  locale={locale}
                  departDate={departDate}
                  returnDate={returnDate}
                  withReturn={showReturnDate}
                  required
                  tone={tone}
                  error={errors.departDate || errors.returnDate}
                  onChange={({ departDate: d, returnDate: r }) => {
                    setDepartDate(d);
                    setReturnDate(r);
                    setErrors((prev) => ({ ...prev, departDate: "", returnDate: "" }));
                  }}
                />
              </div>

              {showNights && (
                <div data-field="nights">
                  <label className={labelClass}>{dict.discoverForm.nights}</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    className={inputClass}
                    value={nights}
                    onChange={(e) => setNights(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>{dict.travelers.label}</label>
                <TravelersPicker
                  locale={locale}
                  value={travelers}
                  onChange={setTravelers}
                  tone={tone}
                />
              </div>

              {/* Budget and currency are one answer in two boxes, so they
                  get a sub-grid of their own rather than being poured into
                  the parent's columns: with the number of fields above them
                  changing from three to four, letting them flow meant the
                  currency regularly ended up orphaned on the next row,
                  underneath something else entirely. */}
              <div className={`grid grid-cols-2 gap-3 ${tone === "dark" ? "sm:col-span-2" : ""}`}>
                <div data-field="budget">
                  {/* The label names exactly what the number has to cover, so
                      nobody enters a flight-only figure against a trip that
                      also has to pay for the hotel. */}
                  <label className={labelClass}>
                    {tone === "dark" ? dict.form.budgetShort : budgetLabel}
                  </label>
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
                    <p role="alert" className={errorClass}>
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

              <details className={`sm:col-span-2 lg:col-span-4 ${st.panel}`}>
                <summary
                  className={`cursor-pointer list-none ${labelClass} mb-0 flex items-center justify-between`}
                >
                  {dict.form.additionalOptions}
                  <span aria-hidden="true" className="text-[0.7em] opacity-60">
                    ▼
                  </span>
                </summary>
                <div className="mt-3">
                  {showHotelFields && (
                    <div className={`mb-4 border-b pb-4 ${st.divider}`}>
                      <HotelPreferences
                        locale={locale}
                        travelers={travelers}
                        minStars={minStars}
                        onMinStarsChange={setMinStars}
                        stayType={effectiveStayType}
                        onStayTypeChange={setStayType}
                        tone={tone}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
              </details>
            </div>

            {/* ── The cities, when the traveller is listing them ─────── */}
            {listsLegs && (
              <div className={`mt-5 border-t pt-5 ${st.divider}`} data-field="legs">
                <div className="mb-3 flex items-center justify-between">
                  <p className={labelClass + " mb-0"}>{dict.multicity.title}</p>
                  <button type="button" onClick={addLeg} className={st.ghostButton}>
                    + {dict.multicity.addLeg}
                  </button>
                </div>

                <div className="space-y-3">
                  {legs.map((leg, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-xl border p-3 ${st.divider}`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <AirportInput
                          locale={locale}
                          value={leg.destination}
                          onChange={(v) => updateLeg(i, { destination: v })}
                          placeholder={dict.multicity.legDestination}
                          className={inputClass}
                          ariaLabel={dict.multicity.legDestination}
                          required
                        />
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        className={inputClass + " w-24 shrink-0"}
                        value={leg.nights}
                        onChange={(e) => updateLeg(i, { nights: Number(e.target.value) })}
                        title={dict.multicity.legNights}
                      />
                      <button
                        type="button"
                        onClick={() => removeLeg(i)}
                        disabled={legs.length <= 2}
                        className={`shrink-0 rounded-lg px-2 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
                          tone === "dark"
                            ? "text-rose-300 hover:bg-white/10"
                            : "text-red-500 hover:bg-red-50"
                        }`}
                      >
                        {dict.multicity.removeLeg}
                      </button>
                    </div>
                  ))}
                </div>
                {errors.legs && (
                  <p role="alert" className={errorClass}>
                    {errors.legs}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className={
                tone === "dark"
                  ? "mt-5 w-full rounded-xl bg-sun-400 px-6 py-3.5 text-base font-bold text-navy-950 shadow-[var(--shadow-sun)] transition hover:-translate-y-0.5 hover:bg-sun-300 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-990"
                  : "mt-6 w-full rounded-xl bg-gradient-to-r from-accent-600 to-accent-700 px-6 py-4 text-base font-bold text-white shadow-lg shadow-accent-600/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent-600/30 hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
              }
            >
              {mode === "discover"
                ? dict.discoverForm.submit
                : listsLegs
                  ? dict.multicity.submit
                  : dict.form.submit}{" "}
              🔍
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
