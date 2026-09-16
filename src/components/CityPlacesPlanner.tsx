"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import CityPlacesExplorer, { type PlaceListItem } from "@/components/CityPlacesExplorer";
import PlanActions from "@/components/PlanActions";

/**
 * More than this in one day and the day is travelling, not visiting.
 *
 * The same figure the country guide uses, for the same reason: four stops is
 * already a full day once you add lunch and getting between them.
 */
const COMFORTABLE_ITEMS_PER_DAY = 4;

/**
 * Turning a city's list of places into that traveller's own days.
 *
 * The list on this page is the answer to "what is there"; it was never the
 * answer to "what should I do on Tuesday". This adds the second half without
 * touching the first: the picking controls stay switched off until someone
 * asks for them, so a visitor who only wants to read about Istanbul reads
 * about Istanbul, and 280 cards don't each grow a button they'll never press.
 *
 * The number of days is not asked for. They already said how long they are
 * staying when they searched, so it arrives in the link and is filled in —
 * editable, because plans change, but never a question answered twice.
 *
 * The spread is round-robin in the order things were picked, which keeps each
 * day mixed instead of stacking every museum on one afternoon. It is offered
 * as a first draft and says so: we have no opening hours and no travel times
 * between these places, so "a sensible starting point" is the honest claim and
 * "an optimised route" would not be.
 */
export default function CityPlacesPlanner({
  locale,
  places,
  cityName,
  countryCode,
  countryName,
  dict,
}: {
  locale: Locale;
  places: PlaceListItem[];
  cityName: string;
  countryCode: string;
  countryName: string;
  dict: React.ComponentProps<typeof CityPlacesExplorer>["dict"];
}) {
  const d = getDictionary(locale);
  const sp = useSearchParams();

  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<PlaceListItem[]>([]);
  const [showPlan, setShowPlan] = useState(false);

  // Their own stay when they came from a search; a sane default when they
  // arrived here cold.
  const [days, setDays] = useState(() => {
    const fromSearch = Number(sp.get("nights") || 0);
    return fromSearch >= 1 && fromSearch <= 21 ? fromSearch : 3;
  });

  const selectedKeys = useMemo(() => new Set(picked.map((p) => p.key)), [picked]);

  function toggle(place: PlaceListItem) {
    setPicked((current) =>
      current.some((p) => p.key === place.key)
        ? current.filter((p) => p.key !== place.key)
        : [...current, place]
    );
  }

  const schedule = useMemo(() => {
    const buckets: PlaceListItem[][] = Array.from({ length: days }, () => []);
    picked.forEach((item, i) => buckets[i % days].push(item));
    return buckets;
  }, [picked, days]);

  const busiestDay = schedule.reduce((max, day) => Math.max(max, day.length), 0);
  const overloaded = busiestDay > COMFORTABLE_ITEMS_PER_DAY;

  const planTitle = d.picker.cityPlanTitle.replace("{city}", cityName);
  const planLines = picked.map((p) => p.name);

  return (
    <div>
      {/* ---- The invitation, above the lists ---- */}
      <div className="print:hidden mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold">{d.picker.cityStartTitle}</p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/70">
              {picking ? d.picker.cityPickingBody : d.picker.cityStartBody}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPicking((on) => !on);
              // Leaving selection mode puts the page back as it was rather
              // than leaving a basket hanging over a list with no buttons.
              if (picking) {
                setPicked([]);
                setShowPlan(false);
              }
            }}
            aria-pressed={picking}
            className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition ${
              picking
                ? "bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25"
                : "bg-sun-400 text-navy-950 hover:bg-sun-300"
            }`}
          >
            {picking ? d.picker.cityStop : d.picker.cityStart}
          </button>
        </div>
      </div>

      <CityPlacesExplorer
        places={places}
        dict={dict}
        selectedKeys={picking ? selectedKeys : undefined}
        onToggleSelect={picking ? toggle : undefined}
        addLabel={d.picker.addInterest}
        addedLabel={d.picker.addedInterest}
      />

      {/* ---- The plan ---- */}
      {showPlan && picked.length > 0 && (
        <div className="mt-8 space-y-4">
          <PlanActions
            locale={locale}
            countryCode={countryCode}
            countryName={countryName}
            planLines={planLines}
            fileBase={`sfratna-${countryCode}-${cityName}`}
            title={planTitle}
          />

          {overloaded && (
            <p className="print:hidden rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-100">
              {d.picker.overloadNotice
                .replace("{count}", String(busiestDay))
                .replace("{comfortable}", String(COMFORTABLE_ITEMS_PER_DAY))}
            </p>
          )}

          <div className="print-block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-extrabold text-gray-900">{planTitle}</h2>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              {d.itinerary.daysCount.replace("{count}", String(days))} ·{" "}
              {d.picker.itemsCount.replace("{count}", String(picked.length))}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">{d.picker.planNote}</p>
          </div>

          {schedule.map((items, index) => (
            <div
              key={index}
              className="print-block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
            >
              <h3 className="mb-2.5 flex items-center gap-2 font-bold text-gray-900">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
                {d.itinerary.day} {index + 1}
                {items.length > COMFORTABLE_ITEMS_PER_DAY && (
                  <span className="print:hidden rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                    {d.picker.busyDay}
                  </span>
                )}
              </h3>

              {items.length === 0 ? (
                <p className="text-sm text-gray-400">{d.picker.freeDay}</p>
              ) : (
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {items.map((item) => (
                    <li key={item.key} className="flex flex-wrap items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400"
                        aria-hidden="true"
                      />
                      {/* An English name inside an Arabic line needs its own
                          direction or its punctuation jumps to the wrong end. */}
                      <span className="font-semibold" dir={item.englishOnly ? "ltr" : undefined}>
                        {item.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <p className="hidden text-xs text-gray-400 print:block">{d.plan.printedFrom}</p>
        </div>
      )}

      {/* ---- The basket, fixed so it follows a long list ---- */}
      {picking && picked.length > 0 && (
        <div className="print:hidden pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy-990/95 px-4 py-3 text-white shadow-2xl backdrop-blur-xl sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-extrabold">
                {d.picker.itemsCount.replace("{count}", String(picked.length))}
              </p>
              <button
                type="button"
                onClick={() => {
                  setPicked([]);
                  setShowPlan(false);
                }}
                className="text-[11px] font-semibold text-white/50 underline underline-offset-2 transition hover:text-white/80"
              >
                {d.picker.clear}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
                {d.picker.daysLabel}
                <input
                  type="number"
                  min={1}
                  max={21}
                  value={days}
                  onChange={(e) => setDays(Math.min(21, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-16 rounded-lg border border-white/20 bg-white/10 px-2 py-1.5 text-center text-sm font-bold text-white outline-none focus:border-sun-400"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowPlan(true)}
                className="rounded-xl bg-sun-400 px-4 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-sun-300"
              >
                {d.picker.cityBuild}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room for the fixed bar so it never covers the last card. */}
      {picking && picked.length > 0 && <div className="h-24" aria-hidden="true" />}
    </div>
  );
}
