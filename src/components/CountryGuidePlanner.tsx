"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import CountryGuideExplorer, { type GuideItem } from "@/components/CountryGuideExplorer";
import PlanActions from "@/components/PlanActions";

type CategoryKey = "attractions" | "activities" | "cuisine";

interface Picked {
  key: string;
  name: string;
  category: CategoryKey;
}

/**
 * Pick what you want to see, and have it laid out over the days you booked.
 *
 * The guide already ranks a country's landmarks, activities and dishes. What
 * it couldn't do was let someone act on them: a traveller would read the
 * list, like six things, and then have to write them down somewhere else.
 * This keeps the list exactly as it was and adds a basket to it.
 *
 * The number of days is not asked for twice. Someone arriving from a search
 * already told us their dates, so that count comes along in the link and the
 * field is pre-filled — editable, because plans change, but never a question
 * they have already answered.
 *
 * The spread is round-robin in the order things were picked, which keeps each
 * day mixed rather than stacking all the museums on Tuesday. It is offered as
 * a starting point and says so: we have no opening hours and no travel times
 * between these places, so the honest claim is "a sensible first draft", not
 * "an optimised route". When a day ends up carrying more than a person can
 * comfortably do, the plan says that too.
 */
const COMFORTABLE_ITEMS_PER_DAY = 4;

export default function CountryGuidePlanner({
  locale,
  countryCode,
  countryName,
  dict,
  attractions,
  activities,
  cuisine,
}: {
  locale: Locale;
  countryCode: string;
  countryName: string;
  dict: React.ComponentProps<typeof CountryGuideExplorer>["dict"];
  attractions: GuideItem[];
  activities: GuideItem[];
  cuisine: GuideItem[];
}) {
  const d = getDictionary(locale);
  const sp = useSearchParams();

  const [picked, setPicked] = useState<Picked[]>([]);
  // Their own trip length when they came from a search; a sane default when
  // they arrived here cold.
  const [days, setDays] = useState(() => {
    const fromSearch = Number(sp.get("nights") || 0);
    return fromSearch >= 1 && fromSearch <= 21 ? fromSearch : 3;
  });
  const [showPlan, setShowPlan] = useState(false);

  const selectedKeys = useMemo(() => new Set(picked.map((p) => p.key)), [picked]);

  function toggle(item: GuideItem, category: CategoryKey) {
    const name = locale === "ar" ? item.nameAr : item.nameEn;
    setPicked((current) =>
      current.some((p) => p.key === item.key)
        ? current.filter((p) => p.key !== item.key)
        : [...current, { key: item.key, name, category }]
    );
  }

  // Round-robin: the first pick to day 1, the second to day 2, and so on.
  const schedule = useMemo(() => {
    const buckets: Picked[][] = Array.from({ length: days }, () => []);
    picked.forEach((item, i) => buckets[i % days].push(item));
    return buckets;
  }, [picked, days]);

  const busiestDay = schedule.reduce((max, day) => Math.max(max, day.length), 0);
  const overloaded = busiestDay > COMFORTABLE_ITEMS_PER_DAY;

  const categoryLabel: Record<CategoryKey, string> = {
    attractions: dict.tagAttraction,
    activities: dict.tagActivity,
    cuisine: dict.tagCuisine,
  };

  const planLines = picked.map((p) => p.name);

  return (
    <div>
      <CountryGuideExplorer
        locale={locale}
        dict={dict}
        attractions={attractions}
        activities={activities}
        cuisine={cuisine}
        selectedKeys={selectedKeys}
        onToggleSelect={toggle}
        addLabel={d.picker.add}
        addedLabel={d.picker.added}
      />

      {/* ---- The plan itself ---- */}
      {showPlan && picked.length > 0 && (
        <div className="mt-8 space-y-4">
          <PlanActions
            locale={locale}
            countryCode={countryCode}
            countryName={countryName}
            planLines={planLines}
            fileBase={`sfratna-picks-${countryCode}`}
            title={d.picker.planTitle.replace("{country}", countryName)}
          />

          {overloaded && (
            <p className="print:hidden rounded-xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-100">
              {d.picker.overloadNotice
                .replace("{count}", String(busiestDay))
                .replace("{comfortable}", String(COMFORTABLE_ITEMS_PER_DAY))}
            </p>
          )}

          <div className="print-block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-extrabold text-gray-900">
              {d.picker.planTitle.replace("{country}", countryName)}
            </h2>
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
                      <span className="mt-0 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" aria-hidden="true" />
                      <span className="font-semibold">{item.name}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                        {categoryLabel[item.category]}
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

      {/* ---- The basket: fixed, so it follows a long list of attractions ---- */}
      {picked.length > 0 && (
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
                {d.picker.build}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room for the fixed bar so it never covers the last card. */}
      {picked.length > 0 && <div className="h-24" aria-hidden="true" />}
    </div>
  );
}
