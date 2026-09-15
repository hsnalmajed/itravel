"use client";

import { useMemo, useState } from "react";
import { getDictionary } from "@/lib/dictionaries";
import { countLabel, formatDuration } from "@/lib/format";
import type { FlightOffer, HotelOffer, Locale, TripType } from "@/lib/types";

/**
 * One trip, priced — not a wall of near-identical packages.
 *
 * A flight list crossed with a hotel list produces twenty-five cards that
 * differ by a few riyals, and a visitor has to hold all of them in their head
 * to work out what any one choice costs. So we make the decision for them
 * first: the cheapest flight with the cheapest hotel, shown as a single trip
 * with a single total.
 *
 * Everything else is reachable, but as an *answer to a question*: "what else
 * is there, and what would it cost me?" Each alternative is labelled with its
 * difference from the option currently selected — +٤٥٠ ر.س for the earlier
 * flight, ٠ for a hotel at the same rate — because that difference is the
 * number someone is actually deciding on. An absolute price makes them do the
 * subtraction themselves, every time.
 *
 * The deltas are recomputed against whatever is selected now, not against the
 * original cheapest option, so after swapping the flight the hotel list still
 * reads as "compared with what I have".
 */

type Picker = "flight" | "hotel" | null;
type FlightSort = "cheapest" | "fastest";
type HotelSort = "cheapest" | "topRated";

function formatTime(iso: string, locale: Locale) {
  try {
    return new Date(iso).toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * The price difference, as a signed amount.
 *
 * Forced to LTR: the sign has to stay glued to the front of the number, and
 * an Arabic paragraph would otherwise push a leading "+" to the wrong end of
 * "+450 SAR".
 */
function DeltaChip({ diff, currency, sameLabel }: { diff: number; currency: string; sameLabel: string }) {
  const tone =
    diff > 0
      ? "bg-rose-50 text-rose-700 ring-rose-100"
      : diff < 0
        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
        : "bg-gray-100 text-gray-500 ring-gray-200";

  return (
    <span
      dir="ltr"
      title={diff === 0 ? sameLabel : undefined}
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ${tone}`}
    >
      {diff > 0 ? "+" : diff < 0 ? "−" : ""}
      {Math.abs(diff).toLocaleString()} {currency}
    </span>
  );
}

export default function TripBuilder({
  flights,
  hotels,
  tripType,
  budgetTotal,
  currency,
  locale,
}: {
  flights: FlightOffer[];
  hotels: HotelOffer[];
  tripType: TripType;
  budgetTotal: number;
  currency: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);

  const needsFlight = tripType !== "hotel";
  const needsHotel = tripType !== "flight";

  // The opening position: cheapest of each. Sorting a copy — the arrays come
  // from state upstream and must not be reordered under it.
  const cheapestFlights = useMemo(() => [...flights].sort((a, b) => a.price - b.price), [flights]);
  const cheapestHotels = useMemo(() => [...hotels].sort((a, b) => a.totalPrice - b.totalPrice), [hotels]);

  const [flightId, setFlightId] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [picker, setPicker] = useState<Picker>(null);
  const [flightSort, setFlightSort] = useState<FlightSort>("cheapest");
  const [hotelSort, setHotelSort] = useState<HotelSort>("cheapest");

  // Derived rather than stored, so the first render after the offers arrive
  // already shows the cheapest trip without an effect writing state.
  const flight = needsFlight
    ? (cheapestFlights.find((f) => f.id === flightId) ?? cheapestFlights[0])
    : undefined;
  const hotel = needsHotel ? (cheapestHotels.find((h) => h.id === hotelId) ?? cheapestHotels[0]) : undefined;

  const total = (flight?.price ?? 0) + (hotel?.totalPrice ?? 0);
  const withinBudget = budgetTotal <= 0 || total <= budgetTotal;
  const remaining = budgetTotal - total;

  const flightOptions = useMemo(() => {
    const arr = [...cheapestFlights];
    if (flightSort === "fastest") arr.sort((a, b) => a.durationMinutes - b.durationMinutes);
    return arr;
  }, [cheapestFlights, flightSort]);

  const hotelOptions = useMemo(() => {
    const arr = [...cheapestHotels];
    if (hotelSort === "topRated") {
      arr.sort((a, b) => (b.rating ?? b.stars) - (a.rating ?? a.stars));
    }
    return arr;
  }, [cheapestHotels, hotelSort]);

  const otherFlights = Math.max(0, flights.length - 1);
  const otherHotels = Math.max(0, hotels.length - 1);

  const isCheapestTrip =
    (!flight || flight.id === cheapestFlights[0]?.id) && (!hotel || hotel.id === cheapestHotels[0]?.id);

  if (!flight && !hotel) return null;

  return (
    <div className="space-y-4">
      {/* ---- The trip as it currently stands ---- */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-brand-800 to-brand-950 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
              {isCheapestTrip ? dict.results.cheapestTrip : dict.results.yourTrip}
            </p>
            <p dir="ltr" className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
              {total.toLocaleString()} {currency}
            </p>
          </div>
          <div className="text-end">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                withinBudget ? "bg-emerald-400/20 text-emerald-200" : "bg-rose-400/20 text-rose-200"
              }`}
            >
              {withinBudget ? dict.results.withinBudget : dict.results.overBudget}
            </span>
            {budgetTotal > 0 && (
              <p className="mt-1.5 text-xs text-white/60">
                {dict.results.remainingBudget}:{" "}
                <span dir="ltr" className="font-bold text-white/90">
                  {remaining.toLocaleString()} {currency}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {flight && (
            <TripRow
              eyebrow={dict.results.flightOption}
              title={flight.airline}
              subtitle={`${flight.origin} → ${flight.destination}`}
              meta={[
                `${formatTime(flight.departTime, locale)} – ${formatTime(flight.arriveTime, locale)}`,
                flight.stops === 0 ? dict.results.stopsNone : `${flight.stops} ${dict.results.stops}`,
                formatDuration(flight.durationMinutes, locale),
              ]}
              chips={[
                {
                  label: `🧳 ${flight.baggageIncluded ? dict.results.baggageYes : dict.results.baggageNo}`,
                  good: flight.baggageIncluded,
                },
              ]}
              price={`${flight.price.toLocaleString()} ${flight.currency}`}
              changeLabel={dict.results.changeFlight}
              changeCount={
                otherFlights > 0
                  ? countLabel(otherFlights, {
                      one: dict.results.otherOptionsOne,
                      two: dict.results.otherOptionsTwo,
                      few: dict.results.otherOptionsFew,
                      many: dict.results.otherOptionsMany,
                    })
                  : null
              }
              open={picker === "flight"}
              onToggle={() => setPicker(picker === "flight" ? null : "flight")}
            />
          )}

          {hotel && (
            <TripRow
              eyebrow={dict.results.hotelOption}
              title={hotel.name}
              subtitle={"★".repeat(Math.max(1, hotel.stars))}
              subtitleClass="text-amber-500"
              meta={[
                `${hotel.pricePerNight.toLocaleString()} ${hotel.currency} / ${dict.results.perNight}`,
                `${hotel.nights} ${dict.results.nights}`,
                dict.results.distanceFromCenter.replace("{km}", String(hotel.distanceFromCenterKm)),
              ]}
              chips={[
                {
                  label: `🍳 ${hotel.breakfastIncluded ? dict.results.breakfastYes : dict.results.breakfastNo}`,
                  good: hotel.breakfastIncluded,
                },
                { label: `🛏️ ${dict.roomType[hotel.roomType]}`, good: false },
              ]}
              price={`${hotel.totalPrice.toLocaleString()} ${hotel.currency}`}
              changeLabel={dict.results.changeHotel}
              changeCount={
                otherHotels > 0
                  ? countLabel(otherHotels, {
                      one: dict.results.otherHotelsOne,
                      two: dict.results.otherHotelsTwo,
                      few: dict.results.otherHotelsFew,
                      many: dict.results.otherHotelsMany,
                    })
                  : null
              }
              open={picker === "hotel"}
              onToggle={() => setPicker(picker === "hotel" ? null : "hotel")}
            />
          )}
        </div>

        {(flight?.isMock || hotel?.isMock) && (
          <p className="border-t border-gray-100 px-5 py-2 text-[11px] text-amber-600 sm:px-6">Demo</p>
        )}
      </div>

      {/* ---- The alternatives, priced against what is selected ---- */}
      {picker === "flight" && flight && (
        <OptionList
          title={dict.results.pickFlightTitle}
          note={dict.results.deltaNote}
          onClose={() => setPicker(null)}
          closeLabel={dict.results.closeOptions}
          sortOptions={[
            { key: "cheapest", label: dict.results.sortCheapest },
            { key: "fastest", label: dict.results.sortFastest },
          ]}
          sort={flightSort}
          onSort={(k) => setFlightSort(k as FlightSort)}
        >
          {flightOptions.map((option) => (
            <OptionRow
              key={option.id}
              selected={option.id === flight.id}
              cheapest={option.id === cheapestFlights[0]?.id}
              onSelect={() => {
                setFlightId(option.id);
                setPicker(null);
              }}
              title={option.airline}
              lines={[
                `${formatTime(option.departTime, locale)} – ${formatTime(option.arriveTime, locale)} · ${formatDuration(option.durationMinutes, locale)}`,
                option.stops === 0
                  ? dict.results.stopsNone
                  : option.layoverCity
                    ? dict.results.layoverIn
                        .replace("{city}", option.layoverCity)
                        .replace(
                          "{duration}",
                          option.layoverDurationMinutes
                            ? formatDuration(option.layoverDurationMinutes, locale)
                            : ""
                        )
                    : `${option.stops} ${dict.results.stops}`,
                option.baggageIncluded ? `🧳 ${dict.results.baggageYes}` : `🧳 ${dict.results.baggageNo}`,
              ]}
              price={`${option.price.toLocaleString()} ${option.currency}`}
              diff={option.price - flight.price}
              currency={option.currency}
              dict={dict}
            />
          ))}
        </OptionList>
      )}

      {picker === "hotel" && hotel && (
        <OptionList
          title={dict.results.pickHotelTitle}
          note={dict.results.deltaNote}
          onClose={() => setPicker(null)}
          closeLabel={dict.results.closeOptions}
          sortOptions={[
            { key: "cheapest", label: dict.results.sortCheapest },
            { key: "topRated", label: dict.results.sortTopRatedHotels },
          ]}
          sort={hotelSort}
          onSort={(k) => setHotelSort(k as HotelSort)}
        >
          {hotelOptions.map((option) => (
            <OptionRow
              key={option.id}
              selected={option.id === hotel.id}
              cheapest={option.id === cheapestHotels[0]?.id}
              onSelect={() => {
                setHotelId(option.id);
                setPicker(null);
              }}
              title={option.name}
              lines={[
                `${"★".repeat(Math.max(1, option.stars))} · ${option.pricePerNight.toLocaleString()} ${option.currency} / ${dict.results.perNight}`,
                dict.results.distanceFromCenter.replace("{km}", String(option.distanceFromCenterKm)),
                option.breakfastIncluded
                  ? `🍳 ${dict.results.breakfastYes}`
                  : `🍳 ${dict.results.breakfastNo}`,
              ]}
              price={`${option.totalPrice.toLocaleString()} ${option.currency}`}
              diff={option.totalPrice - hotel.totalPrice}
              currency={option.currency}
              dict={dict}
            />
          ))}
        </OptionList>
      )}
    </div>
  );
}

/** One leg of the current trip, with the button that opens its alternatives. */
function TripRow({
  eyebrow,
  title,
  subtitle,
  subtitleClass = "text-gray-500",
  meta,
  chips,
  price,
  changeLabel,
  changeCount,
  open,
  onToggle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  subtitleClass?: string;
  meta: string[];
  chips: { label: string; good: boolean }[];
  price: string;
  changeLabel: string;
  changeCount: string | null;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{eyebrow}</p>
          <p className="mt-1 text-base font-bold text-gray-900">{title}</p>
          <p className={`text-sm ${subtitleClass}`}>{subtitle}</p>
          <p className="mt-1 text-sm text-gray-500">{meta.filter(Boolean).join(" · ")}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.label}
                className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  chip.good ? "bg-accent-50 text-accent-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {chip.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span dir="ltr" className="text-base font-extrabold text-gray-900">
            {price}
          </span>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
              open
                ? "bg-brand-900 text-white"
                : "border border-brand-200 text-brand-800 hover:bg-brand-50"
            }`}
          >
            {changeLabel}
          </button>
          {changeCount && <span className="text-[11px] text-gray-400">{changeCount}</span>}
        </div>
      </div>
    </div>
  );
}

/** The expanded list of alternatives, with its own sort control. */
function OptionList({
  title,
  note,
  onClose,
  closeLabel,
  sortOptions,
  sort,
  onSort,
  children,
}: {
  title: string;
  note: string;
  onClose: () => void;
  closeLabel: string;
  sortOptions: { key: string; label: string }[];
  sort: string;
  onSort: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100 sm:p-6">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
        >
          ✕ {closeLabel}
        </button>
      </div>
      <p className="text-sm text-gray-500">{note}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSort(opt.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              sort === opt.key
                ? "bg-brand-900 text-white"
                : "border border-gray-200 text-gray-600 hover:border-brand-200 hover:text-brand-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2.5">{children}</ul>
    </section>
  );
}

function OptionRow({
  selected,
  cheapest,
  onSelect,
  title,
  lines,
  price,
  diff,
  currency,
  dict,
}: {
  selected: boolean;
  cheapest: boolean;
  onSelect: () => void;
  title: string;
  lines: string[];
  price: string;
  diff: number;
  currency: string;
  dict: ReturnType<typeof getDictionary>;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        disabled={selected}
        className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
          selected
            ? "cursor-default border-brand-300 bg-brand-50/70"
            : "border-gray-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
        }`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-900">{title}</span>
            {selected && (
              <span className="rounded-full bg-brand-900 px-2 py-0.5 text-[11px] font-bold text-white">
                {dict.results.currentChoice}
              </span>
            )}
            {cheapest && !selected && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {dict.results.cheapestOption}
              </span>
            )}
          </div>
          {lines.filter(Boolean).map((line) => (
            <p key={line} className="mt-0.5 text-xs text-gray-500">
              {line}
            </p>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <span dir="ltr" className="text-sm font-bold text-gray-700">
            {price}
          </span>
          <DeltaChip diff={diff} currency={currency} sameLabel={dict.results.samePrice} />
        </div>
      </button>
    </li>
  );
}
