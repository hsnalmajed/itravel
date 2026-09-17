"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale, TravelerCounts } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import AirportInput from "@/components/AirportInput";
import DateRangeInput from "@/components/DateRangeInput";
import TravelersPicker from "@/components/TravelersPicker";
import CurrencySelect, { currencyForOrigin } from "@/components/CurrencySelect";
import { serializeChildrenAges } from "@/lib/searchParamsUtil";
import { occupancy, resolveRoomType, roomFitsParty, type StayType } from "@/lib/stayType";
import { focusFirstError, hasErrors, type FieldErrors } from "@/lib/formErrors";

/**
 * The search, on the first screen.
 *
 * Reaching the first input used to take three clicks — "plan your trip",
 * then "I know where I'm going / suggest somewhere", then "flights +
 * hotels" — and every one of them asked a question the visitor could not
 * answer yet, because they had not seen what the site does. Most people do
 * not spend three clicks finding out.
 *
 * So the whole thing collapses into one row that can be typed into
 * immediately. The destination is optional and says so: **leaving it empty
 * is how you ask to be suggested somewhere**, which turns the site's two
 * modes from a question you answer first into a consequence of what you
 * typed. Everything else — trip type, one-way, stars, baggage, room type —
 * keeps its home in the full planner further down the page, because none of
 * it belongs on a first screen.
 */
export default function HeroSearch({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const router = useRouter();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [currencyTouched, setCurrencyTouched] = useState(false);
  const [travelers, setTravelers] = useState<TravelerCounts>({
    adults: 2,
    childrenAges: [],
    infants: 0,
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const originCurrency = currencyForOrigin(origin);
  const effectiveCurrency = !currencyTouched && originCurrency ? originCurrency : currency;

  const guests = occupancy(travelers);
  const stay: StayType = roomFitsParty(guests) ? "room" : "apartment";

  function submit(e: React.FormEvent) {
    e.preventDefault();

    const found: FieldErrors = {};
    if (!origin.trim()) found.origin = dict.form.errorOrigin;
    if (!departDate) found.departDate = dict.form.errorDepartDate;
    if (!budget.trim()) found.budget = dict.form.errorBudget;
    else if (Number(budget) <= 0) found.budget = dict.form.errorBudgetPositive;

    setErrors(found);
    if (hasErrors(found)) {
      focusFirstError(found, ["origin", "departDate", "budget"]);
      return;
    }

    const common = {
      tripType: "both",
      origin,
      departDate,
      returnDate,
      adults: String(travelers.adults),
      childrenAges: serializeChildrenAges(travelers.childrenAges),
      infants: String(travelers.infants),
      budget: String(Number(budget)),
      currency: effectiveCurrency,
      directOnly: "false",
      minStars: "0",
      roomType: resolveRoomType(stay, guests),
      baggageIncluded: "false",
      breakfastIncluded: "false",
    };

    // An empty destination is not a missing field — it is the question
    // "where should I go?", and it has its own results page.
    if (destination.trim()) {
      router.push(`/${locale}/results?${new URLSearchParams(common)}`);
      return;
    }
    const nights = returnDate ? Math.max(1, nightsBetween(departDate, returnDate)) : 5;
    router.push(
      `/${locale}/discover-results?${new URLSearchParams({
        ...common,
        mode: "discover",
        nights: String(nights),
        tripRoute: returnDate ? "roundtrip" : "oneway",
        multiDestination: "false",
        oneWayOnly: String(!returnDate),
      })}`
    );
  }

  const field = "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none backdrop-blur-md transition placeholder:text-white/50 focus:border-sun-400 focus:ring-2 focus:ring-sun-400/30";
  const label = "mb-1.5 block text-2xs font-bold text-white/70";
  const err = (k: string) =>
    errors[k] ? (
      <p role="alert" className="mt-1 text-2xs font-semibold text-rose-200">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form
      noValidate
      onSubmit={submit}
      className="mt-7 w-full max-w-4xl rounded-2xl bg-navy-990/45 p-4 ring-1 ring-white/15 backdrop-blur-xl sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div data-field="origin">
          <label className={label}>{dict.form.origin}</label>
          <AirportInput
            locale={locale}
            value={origin}
            onChange={(v) => {
              setOrigin(v);
              setErrors((p) => ({ ...p, origin: "" }));
            }}
            placeholder={dict.form.originPlaceholder}
                  ariaLabel={dict.form.origin}
            className={field}
          />
          {err("origin")}
        </div>

        <div>
          <label className={label}>{dict.home.heroDestinationLabel}</label>
          <AirportInput
            locale={locale}
            value={destination}
            onChange={setDestination}
            placeholder={dict.home.heroDestinationPlaceholder}
                  ariaLabel={dict.home.heroDestinationLabel}
            className={field}
          />
        </div>

        <div data-field="departDate">
          <label className={label}>{dict.form.dates}</label>
          <DateRangeInput
            locale={locale}
            departDate={departDate}
            returnDate={returnDate}
            error={errors.departDate}
            onChange={({ departDate: d, returnDate: r }) => {
              setDepartDate(d);
              setReturnDate(r);
              setErrors((p) => ({ ...p, departDate: "" }));
            }}
          />
        </div>

        <div data-field="budget">
          <label className={label}>{dict.home.heroBudgetLabel}</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step={50}
              value={budget}
              onChange={(e) => {
                setBudget(e.target.value);
                setErrors((p) => ({ ...p, budget: "" }));
              }}
              placeholder={dict.form.budgetPlaceholder}
              className={`${field} min-w-0 flex-1`}
            />
            <CurrencySelect
              className={`${field} w-24 shrink-0`}
              value={effectiveCurrency}
              onChange={(c) => {
                setCurrency(c);
                setCurrencyTouched(true);
              }}
              label={dict.form.currency}
            />
          </div>
          {err("budget")}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <label className={label}>{dict.travelers.label}</label>
          <TravelersPicker locale={locale} value={travelers} onChange={setTravelers} />
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-sun-400 px-7 py-3.5 text-sm font-bold text-navy-950 shadow-[var(--shadow-sun)] transition hover:-translate-y-0.5 hover:bg-sun-300 sm:text-base"
        >
          {destination.trim() ? dict.home.heroSearchCta : dict.home.heroSuggestCta}
          <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
        </button>
      </div>

      <p className="mt-2.5 text-2xs text-white/55">{dict.home.heroMoreOptions}</p>
    </form>
  );
}

function nightsBetween(a: string, b: string): number {
  const t1 = new Date(`${a}T00:00:00Z`).getTime();
  const t2 = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((t2 - t1) / 86_400_000);
}
