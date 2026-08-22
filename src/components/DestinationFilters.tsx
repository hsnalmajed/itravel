"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";
import type { Continent } from "@/lib/countries";
import { MONTHS } from "@/lib/seasons";
import SearchableSelect, { type SearchableOption } from "@/components/SearchableSelect";

export const CONTINENT_ORDER: Continent[] = [
  "asia",
  "africa",
  "europe",
  "northAmerica",
  "southAmerica",
  "oceania",
];

export interface CityOption {
  countryCode: string;
  slug: string;
  name: string;
  countryName: string;
}

export interface FiltersDict {
  searchPlaceholder: string;
  allContinents: string;
  byMonth: string;
  allMonths: string;
  byCity: string;
  cityPlaceholder: string;
  noMatches: string;
  clear: string;
  /** e.g. "{count} countries" — shown under the controls. */
  countriesCount: string;
  continents: Record<Continent, string>;
}

export interface FilterState {
  query: string;
  continent: Continent | "all";
  month: number | "all";
}

/**
 * Search, continent, month — the three questions someone actually arrives
 * with, plus a city jump.
 *
 * The city control is deliberately not a filter: narrowing a grid of
 * countries down to the one containing Antalya is a slower way of getting to
 * Antalya than going straight there, so picking a city navigates. The other
 * three narrow what's on screen.
 */
export default function DestinationFilters({
  locale,
  state,
  onChange,
  cities,
  cityHrefBase,
  dict,
  resultCount,
  resultLabel,
}: {
  locale: Locale;
  state: FilterState;
  onChange: (next: FilterState) => void;
  cities: CityOption[];
  /** A picked city goes to `${cityHrefBase}/${countryCode}/${slug}`. */
  cityHrefBase: string;
  dict: FiltersDict;
  resultCount: number;
  /** e.g. "{count} countries" */
  resultLabel: string;
}) {
  const router = useRouter();

  const cityOptions: SearchableOption[] = useMemo(
    () =>
      cities.map((c) => ({
        value: `${c.countryCode}/${c.slug}`,
        label: c.name,
        hint: c.countryName,
        keywords: c.slug,
      })),
    [cities]
  );

  const isFiltered =
    state.query.trim() !== "" || state.continent !== "all" || state.month !== "all";

  const chipClass = (active: boolean) =>
    `rounded-full px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
      active
        ? "bg-brand-800 text-white shadow-sm"
        : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-brand-300"
    }`;

  return (
    <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-black/5">
      <input
        value={state.query}
        onChange={(e) => onChange({ ...state, query: e.target.value })}
        placeholder={dict.searchPlaceholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-gray-400"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...state, continent: "all" })}
          className={chipClass(state.continent === "all")}
        >
          {dict.allContinents}
        </button>
        {CONTINENT_ORDER.map((continent) => (
          <button
            key={continent}
            type="button"
            onClick={() => onChange({ ...state, continent })}
            className={chipClass(state.continent === continent)}
          >
            {dict.continents[continent]}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-gray-700">{dict.byMonth}</span>
          <select
            value={state.month}
            onChange={(e) =>
              onChange({ ...state, month: e.target.value === "all" ? "all" : Number(e.target.value) })
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            <option value="all">{dict.allMonths}</option>
            {MONTHS.map((m) => (
              <option key={m.number} value={m.number}>
                {locale === "ar" ? m.nameAr : m.nameEn}
              </option>
            ))}
          </select>
        </label>

        {cityOptions.length > 0 && (
          <SearchableSelect
            value=""
            options={cityOptions}
            onChange={(value) => router.push(`${cityHrefBase}/${value}`)}
            label={dict.byCity}
            searchPlaceholder={dict.cityPlaceholder}
            emptyText={dict.noMatches}
            placeholder={dict.cityPlaceholder}
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-500">
          {resultLabel.replace("{count}", String(resultCount))}
        </p>
        {isFiltered && (
          <button
            type="button"
            onClick={() => onChange({ query: "", continent: "all", month: "all" })}
            className="text-xs font-bold text-brand-700 hover:underline"
          >
            {dict.clear}
          </button>
        )}
      </div>
    </div>
  );
}
