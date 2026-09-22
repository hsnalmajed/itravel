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
import Icon, { type IconName } from "@/components/ui/Icon";
import {
  MAX_GUESTS_PER_ROOM,
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
 * One planner, laid out the way a traveller thinks.
 *
 * The order on screen is the order of the questions in someone's head:
 *
 *   1. Do I know where I'm going?          the two tabs on the panel's edge
 *   2. What do I need?                     flights and hotel, or one of them
 *   3. From where, to where, when, who,    one row, read in one glance
 *      and for how much?
 *   4. Anything particular?                optional, and labelled as optional
 *   5. Go.
 *
 * Both tabs drive one form with one set of state, so switching from "I know
 * where" to "suggest somewhere" keeps everything already typed — checking
 * whether the same money buys a better trip elsewhere costs one click.
 *
 * The three destinations this can submit to:
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

/**
 * Digits as a Saudi keyboard types them.
 *
 * An Arabic keyboard layout types ٥٠٠٠, not 5000, and a number field that
 * silently rejects those digits looks broken to exactly the audience this
 * site is for. Arabic-Indic and Persian digits are folded to Western ones,
 * and anything that isn't a digit is dropped.
 */
function toDigits(raw: string): string {
  return raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 9);
}

/** A field's caption, with the icon that says what the field is. */
function FieldLabel({
  icon,
  children,
  htmlFor,
  dark,
}: {
  icon: IconName;
  children: React.ReactNode;
  htmlFor?: string;
  dark: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-1.5 flex items-center gap-1.5 text-xs font-bold ${dark ? "text-white/70" : "text-navy-700"}`}
    >
      <Icon name={icon} className={`h-3.5 w-3.5 ${dark ? "text-sun-400" : "text-sun-600"}`} />
      {children}
    </label>
  );
}

/**
 * An on/off preference, drawn as a switch.
 *
 * A switch says "this changes a setting" where a checkbox says "tick the
 * ones that apply", and these are settings. Underneath it is still a real
 * checkbox, so keyboards and screen readers get the native behaviour.
 */
function Toggle({
  id,
  checked,
  onChange,
  icon,
  children,
  dark,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: IconName;
  children: React.ReactNode;
  dark: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-2.5 text-sm ${dark ? "text-white/85" : "text-navy-800"}`}
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative h-5 w-9 shrink-0 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-sun-400 peer-focus-visible:ring-offset-2 ${
          dark ? "peer-focus-visible:ring-offset-navy-990" : ""
        } ${checked ? "bg-sun-400" : dark ? "bg-white/20" : "bg-mist-300"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked ? "start-[1.125rem]" : "start-0.5"
          }`}
        />
      </span>
      <Icon name={icon} className={`h-4 w-4 ${dark ? "text-white/60" : "text-navy-500"}`} />
      <span className="leading-snug">{children}</span>
    </label>
  );
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
  const dark = tone === "dark";

  // Arriving from a results page's "edit search" carries every answer back,
  // including which tab it came from.
  const [mode, setMode] = useState<Mode>(sp.get("mode") === "discover" ? "discover" : "known");

  /**
   * Flights and hotel, selected from the start.
   *
   * The form used to open with nothing chosen and every field hidden until a
   * trip type was picked — one more click before anyone could see what the
   * site asks for. Flights-and-hotel is what most people come for; starting
   * there shows the whole form at once, and changing it is one tap.
   */
  const [tripType, setTripType] = useState<TripType>(
    (sp.get("tripType") as TripType) || "both"
  );
  const [tripRoute, setTripRoute] = useState<FlightRoute>(
    (sp.get("tripRoute") as FlightRoute) || "roundtrip"
  );
  const [origin, setOrigin] = useState(sp.get("origin") || "");
  const [destination, setDestination] = useState(sp.get("destination") || "");
  const [preferenceCategory, setPreferenceCategory] = useState<DestinationCategory | "">(
    (sp.get("preferenceCategory") as DestinationCategory) || ""
  );
  const [departDate, setDepartDate] = useState(sp.get("departDate") || "");
  const [returnDate, setReturnDate] = useState(sp.get("returnDate") || "");
  // A one-way trip has no return date to measure the hotel stay against, so
  // the traveller says how long they are staying.
  const [nights, setNights] = useState(Number(sp.get("nights")) || 5);
  const [travelers, setTravelers] = useState<TravelerCounts>({
    adults: Number(sp.get("adults")) || 2,
    childrenAges: parseChildrenAges(sp.get("childrenAges")),
    infants: Number(sp.get("infants")) || 0,
  });
  const [budget, setBudget] = useState(toDigits(sp.get("budget") || ""));
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
  // The optional row is always open on a wide screen, where it costs one
  // line; on a phone it folds away behind its heading.
  const [extrasOpen, setExtrasOpen] = useState(false);

  /**
   * The currency follows the departure city until the traveller says
   * otherwise — someone flying out of Kuwait City shouldn't have to convert
   * their own budget before they can type it.
   */
  const [currencyTouched, setCurrencyTouched] = useState(Boolean(sp.get("currency")));
  const originCurrency = currencyForOrigin(origin);
  const effectiveCurrency = !currencyTouched && originCurrency ? originCurrency : currency;

  const guests = occupancy(travelers);
  const roomPossible = roomFitsParty(guests);
  const effectiveStayType: StayType | "" =
    stayType === "room" && !roomPossible ? "apartment" : stayType;

  const showTripRoute = tripType === "both" || tripType === "flight";
  const showFlightFields = tripType === "both" || tripType === "flight";
  const showHotelFields = tripType === "both" || tripType === "hotel";

  // "Multi-city" reads two honest ways on the two tabs: a list of cities the
  // traveller names, or a pair of destinations for us to suggest.
  const listsLegs = mode === "known" && tripRoute === "multicity";
  const isOneWay = tripRoute === "oneway";
  const showReturnDate = tripType === "hotel" ? true : !isOneWay && !listsLegs;
  const showNights = isOneWay && showHotelFields;
  const showDestination = mode === "known" && !listsLegs;

  // The label names exactly what the money has to cover, so nobody enters a
  // flight-only figure against a trip that also has to pay for the hotel.
  const budgetLabel =
    tripType === "flight"
      ? dict.form.budgetFlightShort
      : tripType === "hotel"
        ? dict.form.budgetHotelShort
        : dict.form.budgetBothShort;

  function updateLeg(index: number, patch: Partial<LegDraft>) {
    setLegs((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function addLeg() {
    setLegs((prev) => [...prev, { destination: "", nights: 2 }]);
  }
  function removeLeg(index: number) {
    setLegs((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev));
  }
  function swapPlaces() {
    setOrigin(destination);
    setDestination(origin);
    setErrors((prev) => ({ ...prev, origin: "", destination: "" }));
  }

  /** Every gap at once, rather than one per submit. */
  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (showFlightFields && !origin.trim()) next.origin = dict.form.errorOrigin;
    if (showDestination && !destination.trim()) next.destination = dict.form.errorDestination;
    if (listsLegs && legs.filter((l) => l.destination.trim()).length < 2) {
      next.legs = dict.form.errorLegs;
    }
    if (!departDate) next.departDate = dict.form.errorDepartDate;
    if (showReturnDate && !returnDate) next.returnDate = dict.form.errorReturnDate;
    if (!budget) next.budget = dict.form.errorBudget;
    else if (Number(budget) <= 0) next.budget = dict.form.errorBudgetPositive;
    return next;
  }

  const FIELD_ORDER = ["origin", "destination", "legs", "departDate", "returnDate", "budget"];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    if (hasErrors(found)) {
      focusFirstError(found, FIELD_ORDER);
      return;
    }

    const roomType = resolveRoomType(effectiveStayType, guests);
    const stayNights = showReturnDate ? nightsBetween(departDate, returnDate) : Math.max(1, nights);

    // Every answer that is the same on both tabs, in one place — so the
    // three destinations below cannot drift apart.
    const shared: Record<string, string> = {
      tripType,
      tripRoute,
      origin,
      departDate,
      adults: String(travelers.adults),
      childrenAges: serializeChildrenAges(travelers.childrenAges),
      infants: String(travelers.infants),
      budget: String(Number(budget)),
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

  // ── Styles ──────────────────────────────────────────────────────────
  // Fields come from formTone.ts so the planner and every other form on the
  // site share one definition of what an input looks like. The pieces below
  // are the planner's own furniture.
  const st = formStyles(tone);
  const inputClass = st.input;
  const errorClass = `mt-1.5 text-xs font-semibold ${dark ? "text-rose-300" : "text-red-600"}`;
  const labelRow = `mb-1.5 flex items-center gap-1.5 text-xs font-bold ${
    dark ? "text-white/70" : "text-navy-700"
  }`;
  const labelIcon = `h-3.5 w-3.5 ${dark ? "text-sun-400" : "text-sun-600"}`;
  const sectionTitle = `text-sm font-bold ${dark ? "text-white/90" : "text-navy-900"}`;
  const muted = `text-xs ${dark ? "text-white/55" : "text-navy-500"}`;
  const divider = dark ? "border-white/10" : "border-mist-200";

  const tripTypes: { value: TripType; label: string; icons: IconName[] }[] = [
    { value: "both", label: dict.form.tripTypeBoth, icons: ["plane", "hotel"] },
    { value: "flight", label: dict.form.tripTypeFlight, icons: ["plane"] },
    { value: "hotel", label: dict.form.tripTypeHotel, icons: ["hotel"] },
  ];

  const routes: { value: FlightRoute; label: string; icon: IconName }[] = [
    { value: "roundtrip", label: dict.form.tripRouteRoundtrip, icon: "roundtrip" },
    { value: "oneway", label: dict.form.tripRouteOneway, icon: "oneway" },
    { value: "multicity", label: dict.form.tripRouteMulticity, icon: "route" },
  ];

  return (
    <form
      // Our own validation: a native `required` blocks submit before
      // onSubmit fires, so no message was ever shown.
      noValidate
      onSubmit={handleSubmit}
      className={st.surface}
    >
      {/* ── 1. The first question, on the panel's edge ──────────────────
          Lifted half out of the panel so it reads as the thing everything
          below depends on. Solid, not translucent: it overlaps the
          photograph and has to stay legible over any of them. */}
      <div
        role="tablist"
        aria-label={dict.form.whereToLabel}
        className={`relative z-10 mx-auto -mt-9 mb-6 grid w-full max-w-xl grid-cols-2 gap-1.5 rounded-2xl p-1.5 shadow-[0_12px_32px_-12px_rgba(4,24,47,0.6)] ring-1 ${
          dark ? "bg-navy-990 ring-white/15" : "bg-white ring-mist-200"
        }`}
      >
        {(
          [
            { value: "known", icon: "plane", title: dict.modeSelect.knownTitle, hint: dict.modeSelect.knownHint },
            { value: "discover", icon: "globe", title: dict.modeSelect.discoverTitle, hint: dict.modeSelect.discoverHint },
          ] as { value: Mode; icon: IconName; title: string; hint: string }[]
        ).map((t) => {
          const active = mode === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(t.value)}
              className={`flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 sm:px-4 ${
                active
                  ? "bg-sun-400 text-navy-950 shadow-[var(--shadow-sun)]"
                  : dark
                    ? "text-white/80 hover:bg-white/10 hover:text-white"
                    : "text-navy-700 hover:bg-mist-50"
              }`}
            >
              <span
                className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-full sm:flex ${
                  active ? "bg-navy-950/10" : dark ? "bg-white/10" : "bg-mist-100"
                }`}
              >
                <Icon name={t.icon} className="h-[1.125rem] w-[1.125rem]" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-extrabold sm:text-base">
                  <Icon name={t.icon} className="h-4 w-4 sm:hidden" />
                  {t.title}
                </span>
                <span className={`block text-2xs leading-snug sm:truncate sm:text-xs ${active ? "text-navy-950/70" : "opacity-60"}`}>
                  {t.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 2. What the trip is made of ─────────────────────────────── */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className={sectionTitle}>{dict.form.whatNeeded}</p>

        {/* Round trip, one way, several cities. A secondary choice, so a
            compact switch beside the question rather than a second row of
            big buttons competing with the first. */}
        {showTripRoute && (
          <div
            role="radiogroup"
            aria-label={dict.form.tripRouteRoundtrip}
            className={`inline-flex rounded-full p-0.5 ring-1 ${dark ? "bg-white/[0.06] ring-white/15" : "bg-mist-50 ring-mist-200"}`}
          >
            {routes.map((r) => {
              const active = tripRoute === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTripRoute(r.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 ${
                    active
                      ? dark
                        ? "bg-white text-navy-950"
                        : "bg-navy-900 text-white"
                      : dark
                        ? "text-white/70 hover:text-white"
                        : "text-navy-600 hover:text-navy-900"
                  }`}
                >
                  <Icon name={r.icon} className="h-3.5 w-3.5" />
                  {r.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {tripTypes.map((t) => {
          const active = tripType === t.value;
          return (
            <button
              type="button"
              key={t.value}
              aria-pressed={active}
              onClick={() => {
                setTripType(t.value);
                if (t.value === "hotel" && tripRoute === "multicity") setTripRoute("roundtrip");
              }}
              // Outlined in sun rather than filled: the tab above is the
              // primary choice and carries the solid fill; two solid blocks
              // stacked would compete for the same glance.
              className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 sm:flex-row sm:gap-2 sm:py-3 sm:text-sm ${
                active
                  ? dark
                    ? "bg-white/[0.14] text-white ring-2 ring-sun-400"
                    : "bg-sun-50 text-navy-900 ring-2 ring-sun-400"
                  : dark
                    ? "bg-white/[0.05] text-white/75 ring-1 ring-white/15 hover:bg-white/10 hover:text-white"
                    : "bg-white text-navy-600 ring-1 ring-mist-200 hover:ring-navy-200"
              }`}
            >
              {active && <Icon name="check" className="hidden h-4 w-4 text-sun-400 sm:block" />}
              <span className="flex items-center gap-0.5">
                {t.icons.map((ic) => (
                  <Icon key={ic} name={ic} className="h-4 w-4" />
                ))}
              </span>
              <span className="max-w-full truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {mode === "discover" && tripRoute === "multicity" && (
        <p className={`mt-2 ${muted}`}>{dict.discoverForm.multiDestinationHint}</p>
      )}
      {isOneWay && showTripRoute && <p className={`mt-2 ${muted}`}>{dict.discoverForm.oneWayHint}</p>}

      {/* ── 3. The row that is the search ─────────────────────────────
          Auto-fit, so the known tab's five fields and the suggest tab's
          four both fill the width with no empty column — and a one-way
          stay's nights field slots in without a layout of its own. */}
      <div className="mt-5 grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]">
        {showFlightFields && (
          <div data-field="origin" className="relative">
            <FieldLabel dark={dark} icon="pin">{dict.form.origin}</FieldLabel>
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

            {/* Swap: the most common edit on a return search is the
                direction. Sits on the seam between the two fields. */}
            {showDestination && (
              <button
                type="button"
                onClick={swapPlaces}
                aria-label={dict.form.swapPlaces}
                title={dict.form.swapPlaces}
                className={`absolute -end-[1.15rem] top-[2.15rem] z-10 hidden h-8 w-8 items-center justify-center rounded-full ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 lg:flex ${
                  dark
                    ? "bg-navy-990 text-white/85 ring-white/25 hover:text-sun-400 hover:ring-sun-400"
                    : "bg-white text-navy-700 ring-mist-300 hover:ring-navy-400"
                }`}
              >
                <Icon name="swap" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {showDestination && (
          <div data-field="destination">
            <FieldLabel dark={dark} icon="pin">{dict.form.destination}</FieldLabel>
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

        <div data-field="departDate">
          <FieldLabel dark={dark} icon="calendar">
            {showReturnDate ? dict.form.dates : dict.form.departDate}
          </FieldLabel>
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
            <FieldLabel dark={dark} icon="bed" htmlFor="plan-nights">
              {dict.discoverForm.nights}
            </FieldLabel>
            <input
              id="plan-nights"
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
          <FieldLabel dark={dark} icon="users">{dict.travelers.label}</FieldLabel>
          <TravelersPicker locale={locale} value={travelers} onChange={setTravelers} tone={tone} />
        </div>

        {/* Amount and currency are one answer, so they are one box. The
            amount is grouped as it is typed (5,000 rather than 5000) and
            accepts the digits an Arabic keyboard produces. */}
        <div data-field="budget">
          <FieldLabel dark={dark} icon="wallet" htmlFor="plan-budget">
            {budgetLabel}
          </FieldLabel>
          <div
            className={`flex items-stretch overflow-hidden rounded-xl border transition focus-within:ring-2 ${
              dark
                ? "border-white/20 bg-white/10 backdrop-blur-md focus-within:border-sun-400 focus-within:ring-sun-400/30 hover:border-white/30"
                : "border-gray-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-brand-100"
            } ${errors.budget ? (dark ? "border-rose-300" : "border-red-400") : ""}`}
          >
            <input
              id="plan-budget"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              dir="ltr"
              className={`min-w-0 flex-1 bg-transparent px-4 py-2.75 text-sm font-semibold tabular-nums outline-none ${
                dark ? "text-white placeholder:font-normal placeholder:text-white/45" : "text-gray-800 placeholder:font-normal placeholder:text-gray-400"
              } ${locale === "ar" ? "text-right" : "text-left"}`}
              value={budget ? Number(budget).toLocaleString("en-US") : ""}
              placeholder={dict.form.budgetForAll}
              aria-invalid={Boolean(errors.budget)}
              onChange={(e) => {
                setBudget(toDigits(e.target.value));
                setErrors((prev) => ({ ...prev, budget: "" }));
              }}
            />
            <CurrencySelect
              className={`cursor-pointer border-s bg-transparent px-2.5 text-sm font-bold outline-none ${
                dark ? "border-white/15 text-white" : "border-gray-200 text-navy-800"
              }`}
              value={effectiveCurrency}
              onChange={(c) => {
                setCurrency(c);
                setCurrencyTouched(true);
              }}
              label={dict.form.currency}
            />
          </div>
          {errors.budget && (
            <p role="alert" className={errorClass}>
              {errors.budget}
            </p>
          )}
        </div>
      </div>

      {/* ── The cities, when the traveller is listing them ───────────── */}
      {listsLegs && (
        <div className={`mt-5 border-t pt-5 ${divider}`} data-field="legs">
          <div className="mb-3 flex items-center justify-between">
            <p className={sectionTitle}>{dict.multicity.title}</p>
            <button type="button" onClick={addLeg} className={st.ghostButton}>
              + {dict.multicity.addLeg}
            </button>
          </div>

          <div className="space-y-3">
            {legs.map((leg, i) => (
              <div key={i} className={`flex items-center gap-2 rounded-xl border p-3 ${divider}`}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sun-400 text-xs font-bold text-navy-950">
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
                  aria-label={dict.multicity.legNights}
                />
                <button
                  type="button"
                  onClick={() => removeLeg(i)}
                  disabled={legs.length <= 2}
                  className={`shrink-0 rounded-lg px-2 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
                    dark ? "text-rose-300 hover:bg-white/10" : "text-red-500 hover:bg-red-50"
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

      {/* ── 4. Optional, and saying so ─────────────────────────────────
          On a wide screen this is one line and always open. On a phone it
          folds behind its heading so the button stays near the thumb. */}
      <div className={`mt-5 border-t pt-4 ${divider}`}>
        <button
          type="button"
          onClick={() => setExtrasOpen((v) => !v)}
          aria-expanded={extrasOpen}
          className="flex w-full items-center justify-between gap-3 text-start lg:pointer-events-none"
        >
          <span className={sectionTitle}>
            {dict.form.extrasTitle}{" "}
            <span className={`font-normal ${dark ? "text-white/50" : "text-navy-500"}`}>
              {dict.form.extrasOptional}
            </span>
          </span>
          <Icon
            name="chevron"
            className={`h-4 w-4 transition lg:hidden ${extrasOpen ? "rotate-180" : ""} ${dark ? "text-white/60" : "text-navy-500"}`}
          />
        </button>

        <div className={`${extrasOpen ? "flex" : "hidden"} mt-3 flex-col gap-4 lg:flex`}>
          {/* The one question only the suggest tab asks. */}
          {mode === "discover" && (
            <div>
              <p className={labelRow}>
                <Icon name="compass" className={labelIcon} />
                {dict.categories.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {(["", ...CATEGORY_OPTIONS] as (DestinationCategory | "")[]).map((c) => {
                  const active = preferenceCategory === c;
                  return (
                    <button
                      key={c || "any"}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPreferenceCategory(c)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 ${
                        active
                          ? "bg-sun-400 text-navy-950 ring-sun-400"
                          : dark
                            ? "bg-white/[0.05] text-white/80 ring-white/15 hover:bg-white/10"
                            : "bg-white text-navy-700 ring-mist-200 hover:ring-navy-200"
                      }`}
                    >
                      {c ? dict.categories[c] : dict.categories.any}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 items-end gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,11rem)_minmax(0,11rem)_1fr]">
            {showHotelFields && (
              <div>
                <FieldLabel dark={dark} icon="star" htmlFor="plan-stars">
                  {dict.form.minStars}
                </FieldLabel>
                <select
                  id="plan-stars"
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

            {showHotelFields && (
              <div>
                <FieldLabel dark={dark} icon="bed" htmlFor="plan-stay">
                  {dict.stayType.label}
                </FieldLabel>
                <select
                  id="plan-stay"
                  className={inputClass}
                  value={effectiveStayType}
                  onChange={(e) => setStayType(e.target.value as StayType | "")}
                >
                  <option value="">{dict.stayType.any}</option>
                  {/* A party a room can't hold is offered apartments only —
                      and told why, below, rather than left guessing. */}
                  <option value="room" disabled={!roomPossible}>
                    {dict.stayType.room}
                  </option>
                  <option value="apartment">{dict.stayType.apartment}</option>
                </select>
              </div>
            )}

            <div
              className={`flex flex-wrap items-center gap-x-6 gap-y-3 lg:justify-end lg:pb-2.5 ${
                showHotelFields ? "sm:col-span-2 lg:col-span-1" : "sm:col-span-2 lg:col-span-3"
              }`}
            >
              {showFlightFields && (
                <Toggle dark={dark} id="plan-direct" checked={directOnly} onChange={setDirectOnly} icon="takeoff">
                  {dict.form.directShort}
                </Toggle>
              )}
              {showFlightFields && (
                <Toggle dark={dark} id="plan-bags" checked={baggageIncluded} onChange={setBaggageIncluded} icon="luggage">
                  {dict.form.baggageShort}
                </Toggle>
              )}
              {showHotelFields && (
                <Toggle dark={dark} id="plan-breakfast" checked={breakfastIncluded} onChange={setBreakfastIncluded} icon="coffee">
                  {dict.form.breakfastShort}
                </Toggle>
              )}
            </div>
          </div>

          {showHotelFields && !roomPossible && (
            <p className={muted}>
              {dict.stayType.apartmentOnlyHint.replace("{count}", String(guests))}{" "}
              <span className="opacity-70">
                ({dict.stayType.roomFitsHint.replace("{max}", String(MAX_GUESTS_PER_ROOM))})
              </span>
            </p>
          )}
        </div>
      </div>

      {/* ── 5. Go ────────────────────────────────────────────────────── */}
      <button
        type="submit"
        className={`mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-base font-extrabold transition hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          dark
            ? "bg-sun-400 text-navy-950 shadow-[var(--shadow-sun)] hover:bg-sun-300 focus-visible:ring-sun-400 focus-visible:ring-offset-navy-990"
            : "bg-navy-900 text-white shadow-lg hover:bg-navy-800 focus-visible:ring-navy-400"
        }`}
      >
        <Icon name="search" className="h-5 w-5" strokeWidth={2.4} />
        {mode === "discover"
          ? dict.form.submitDiscover
          : listsLegs
            ? dict.multicity.submit
            : dict.form.submitKnown}
      </button>

      {/* What the traveller is and isn't agreeing to, said where they
          decide. The one worry a comparison site has to answer before the
          first click is "will this take my card" — it won't. */}
      <p className={`mt-3 text-balance text-center ${muted}`}>
        <Icon
          name="shield"
          className={`me-1.5 inline-block h-3.5 w-3.5 -translate-y-px align-middle ${dark ? "text-sun-400" : "text-sun-600"}`}
        />
        {dict.form.trustLine}
      </p>
    </form>
  );
}
