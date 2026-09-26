"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { Continent } from "@/lib/countries";
import { CONTINENT_ORDER } from "@/components/DestinationFilters";
import { searchMatches } from "@/lib/search";
import { countLabel } from "@/lib/format";
import Photo from "@/components/Photo";
import Icon from "@/components/ui/Icon";

/**
 * When each city is in season — the seasons page, city by city.
 *
 * Built on the same measured weather as the homepage's "best in <month>"
 * (src/lib/citySeasons.ts): every number shown is a 20-year average for that
 * city, and "in season" is the stated rule, not a judgement. The page used
 * to read a hand-typed "best months" line per country, one line for a whole
 * country, with no source.
 *
 * Two questions, two layouts:
 *   by month  "Where is good in March?"   → the cities in season that month
 *   by city   "When should I go to Kyoto?" → twelve months for one city
 */

export interface SeasonCity {
  code: string;
  slug: string;
  name: string;
  countryName: string;
  continent: Continent;
  photo?: string;
  /** Mean daily high, °C, Jan–Dec. */
  high: number[];
  /** Mean rainy days (≥ 1 mm), Jan–Dec. */
  rainyDays: number[];
  /** Season kind per month, Jan–Dec. */
  kind: SeasonKindName[];
  /** In season per month, Jan–Dec; empty when the data is unreliable. */
  inSeason: boolean[];
  reliable: boolean;
}

type SeasonKindName = "winter" | "spring" | "summer" | "autumn" | "wet" | "dry";

interface Dict {
  modeQuestion: string;
  byMonth: string;
  byMonthHint: string;
  byCity: string;
  byCityHint: string;
  changeMode: string;
  monthNames: string[];
  inSeasonInMonth: string;
  noneInMonth: string;
  citySearch: string;
  cityNoMatch: string;
  pickCity: string;
  cityYearTitle: string;
  bestMonths: string;
  noBestMonths: string;
  unreliable: string;
  inSeasonLabel: string;
  high: string;
  rainOne: string;
  rainTwo: string;
  rainFew: string;
  rainMany: string;
  rainNone: string;
  kinds: Record<SeasonKindName, string>;
  rule: string;
  source: string;
  allContinents: string;
  continents: Record<Continent, string>;
  viewCity: string;
}

const KIND_STYLE: Record<SeasonKindName, string> = {
  winter: "bg-sky-100 text-sky-900",
  spring: "bg-emerald-100 text-emerald-900",
  summer: "bg-amber-100 text-amber-900",
  autumn: "bg-orange-100 text-orange-900",
  wet: "bg-sea-100 text-sea-900",
  dry: "bg-sun-100 text-sun-900",
};
const KIND_ICON: Record<SeasonKindName, string> = {
  winter: "❄️",
  spring: "🌸",
  summer: "☀️",
  autumn: "🍂",
  wet: "🌧",
  dry: "🌤",
};

export default function CitySeasons({
  locale,
  cities,
  currentMonth,
  dict,
}: {
  locale: Locale;
  cities: SeasonCity[];
  currentMonth: number;
  dict: Dict;
}) {
  const [mode, setMode] = useState<"month" | "city" | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const [continent, setContinent] = useState<Continent | "all">("all");
  const [query, setQuery] = useState("");
  const [citySlug, setCitySlug] = useState("");

  // The year starts now: someone here in September is deciding about the
  // coming months, not January.
  const monthOrder = Array.from({ length: 12 }, (_, i) => ((currentMonth - 1 + i) % 12) + 1);

  const rain = (days: number) => {
    const n = Math.round(days);
    if (n === 0) return dict.rainNone;
    return countLabel(n, { one: dict.rainOne, two: dict.rainTwo, few: dict.rainFew, many: dict.rainMany });
  };

  const inMonth = useMemo(() => {
    const score = (c: SeasonCity) => Math.abs(c.high[month - 1] - 25) + c.rainyDays[month - 1] * 0.5;
    return cities
      .filter((c) => c.inSeason[month - 1] && (continent === "all" || c.continent === continent))
      .sort((a, b) => score(a) - score(b));
  }, [cities, month, continent]);

  const cityMatches = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return cities.filter((c) => searchMatches([c.name, c.countryName, c.slug], q)).slice(0, 8);
  }, [cities, query]);

  const city = cities.find((c) => c.slug === citySlug);

  const pill = (active: boolean) =>
    `rounded-full px-3.5 py-2 text-sm font-bold transition ${
      active ? "bg-navy-900 text-white shadow-sm" : "bg-white text-navy-700 ring-1 ring-mist-200 hover:ring-navy-200"
    }`;

  // ── The question first ────────────────────────────────────────────────
  if (mode === null) {
    return (
      <div>
        <p className="mb-4 font-display text-lg font-extrabold text-navy-900">{dict.modeQuestion}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { m: "month", icon: "🗓", title: dict.byMonth, hint: dict.byMonthHint },
              { m: "city", icon: "🏙", title: dict.byCity, hint: dict.byCityHint },
            ] as const
          ).map((o) => (
            <button
              key={o.m}
              type="button"
              onClick={() => setMode(o.m)}
              className="flex items-start gap-4 rounded-2xl bg-white p-5 text-start shadow-[var(--shadow-card)] ring-1 ring-navy-950/5 transition hover:-translate-y-0.5 hover:ring-sea-400/50"
            >
              <span className="text-3xl" aria-hidden="true">{o.icon}</span>
              <span>
                <span className="block font-display text-lg font-extrabold text-navy-900">{o.title}</span>
                <span className="mt-1 block text-sm text-navy-600">{o.hint}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-6 rounded-xl bg-mist-100 px-4 py-3 text-xs leading-relaxed text-navy-600 ring-1 ring-mist-200">
          {dict.rule} {dict.source}
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setMode(null)}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-sea-600 hover:underline"
      >
        {locale === "ar" ? "→" : "←"} {dict.changeMode}
      </button>

      {mode === "month" && (
        <>
          <div className="rail flex gap-2 overflow-x-auto pb-2">
            {monthOrder.map((m) => (
              <button key={m} type="button" aria-pressed={m === month} onClick={() => setMonth(m)} className={`shrink-0 ${pill(m === month)}`}>
                {dict.monthNames[m - 1]}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["all", ...CONTINENT_ORDER] as (Continent | "all")[]).map((c) => (
              <button key={c} type="button" aria-pressed={continent === c} onClick={() => setContinent(c)} className={`text-xs ${pill(continent === c)}`}>
                {c === "all" ? dict.allContinents : dict.continents[c]}
              </button>
            ))}
          </div>

          <h2 className="mb-4 mt-6 font-display text-xl font-extrabold text-navy-900">
            {dict.inSeasonInMonth
              .replace("{month}", dict.monthNames[month - 1])
              .replace("{count}", String(inMonth.length))}
          </h2>

          {inMonth.length === 0 ? (
            <p className="rounded-xl bg-mist-50 px-4 py-10 text-center text-sm text-navy-500">{dict.noneInMonth}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {inMonth.map((c) => {
                const kind = c.kind[month - 1];
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      setCitySlug(c.slug);
                      setMode("city");
                    }}
                    className="group relative isolate block aspect-[4/3] overflow-hidden rounded-2xl text-start ring-1 ring-navy-950/5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
                  >
                    <Photo
                      src={c.photo}
                      className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      fallback={<div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-700 to-navy-990" />}
                    />
                    <div className="scrim-soft absolute inset-0 -z-10" />
                    <span className={`absolute start-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${KIND_STYLE[kind]}`}>
                      <span aria-hidden="true">{KIND_ICON[kind]}</span>
                      {dict.kinds[kind]}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <p className="truncate font-display font-extrabold text-white">{c.name}</p>
                      <p className="truncate text-xs text-white/70">{c.countryName}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className="rounded-full bg-navy-990/65 px-2 py-0.5 text-xs font-bold text-sun-300">
                          {dict.high.replace("{high}", String(Math.round(c.high[month - 1])))}
                        </span>
                        <span className="rounded-full bg-navy-990/65 px-2 py-0.5 text-xs font-bold text-sea-200">
                          {rain(c.rainyDays[month - 1])}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {mode === "city" && (
        <>
          <div className="relative max-w-md">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.citySearch}
              className="w-full rounded-xl border border-mist-200 bg-white px-4 py-3 text-sm text-navy-900 outline-none focus:border-sea-400 focus:ring-4 focus:ring-sea-100"
            />
            {query.trim() && (
              <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl bg-white shadow-[var(--shadow-lift)] ring-1 ring-mist-200">
                {cityMatches.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-navy-500">{dict.cityNoMatch}</li>
                ) : (
                  cityMatches.map((c) => (
                    <li key={c.slug}>
                      <button
                        type="button"
                        onClick={() => {
                          setCitySlug(c.slug);
                          setQuery("");
                        }}
                        className="w-full px-4 py-2.5 text-start text-sm hover:bg-mist-50"
                      >
                        <span className="font-bold text-navy-900">{c.name}</span>
                        <span className="text-navy-500"> · {c.countryName}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {!city ? (
            <p className="mt-6 rounded-xl bg-mist-50 px-4 py-10 text-center text-sm text-navy-500">{dict.pickCity}</p>
          ) : (
            <section className="mt-6 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] ring-1 ring-navy-950/5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-display text-xl font-extrabold text-navy-900">
                  {dict.cityYearTitle.replace("{city}", city.name)}
                  <span className="ms-2 text-sm font-semibold text-navy-500">{city.countryName}</span>
                </h2>
                <Link
                  href={`/${locale}/attractions/${city.code}/${city.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-bold text-sea-600 hover:underline"
                >
                  {dict.viewCity} <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
                </Link>
              </div>

              {city.reliable ? (
                <p className="mt-2 text-sm font-semibold text-navy-700">
                  {city.inSeason.some(Boolean)
                    ? dict.bestMonths.replace(
                        "{months}",
                        monthOrder
                          .filter((m) => city.inSeason[m - 1])
                          .map((m) => dict.monthNames[m - 1])
                          .join("، ")
                      )
                    : dict.noBestMonths}
                </p>
              ) : (
                <p className="mt-2 rounded-lg bg-sun-50 px-3 py-2 text-sm text-sun-900 ring-1 ring-sun-200">{dict.unreliable}</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {monthOrder.map((m) => {
                  const kind = city.kind[m - 1];
                  const good = city.reliable && city.inSeason[m - 1];
                  return (
                    <div
                      key={m}
                      className={`rounded-xl p-3 ring-1 ${good ? "bg-emerald-50 ring-emerald-300" : "bg-mist-50 ring-mist-200"}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-extrabold text-navy-900">{dict.monthNames[m - 1]}</p>
                        {good && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-800">
                            <Icon name="check" className="h-3.5 w-3.5" />
                            {dict.inSeasonLabel}
                          </span>
                        )}
                      </div>
                      <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${KIND_STYLE[kind]}`}>
                        <span aria-hidden="true">{KIND_ICON[kind]}</span>
                        {dict.kinds[kind]}
                      </span>
                      <p className="mt-1.5 text-sm font-bold text-navy-800">
                        {dict.high.replace("{high}", String(Math.round(city.high[m - 1])))}
                      </p>
                      <p className="text-xs text-navy-600">{rain(city.rainyDays[m - 1])}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      <p className="mt-8 rounded-xl bg-mist-100 px-4 py-3 text-xs leading-relaxed text-navy-600 ring-1 ring-mist-200">
        {dict.rule} {dict.source}
      </p>
    </div>
  );
}
