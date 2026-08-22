"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { Continent } from "@/lib/countries";
import { flagEmoji } from "@/lib/countries";
import { MONTHS } from "@/lib/seasons";
import Photo from "@/components/Photo";
import DestinationFilters, {
  type CityOption,
  type FilterState,
  type FiltersDict,
} from "@/components/DestinationFilters";
import { matchesFilters, type DestinationCountry } from "@/components/CountryCardGrid";

interface SeasonsDict {
  intro: string;
  monthHeading: string;
  countriesInMonth: string;
  emptyMonth: string;
  seasonWinter: string;
  seasonSpring: string;
  seasonSummer: string;
  seasonAutumn: string;
  sourceNote: string;
  noResults: string;
}

const SEASON_STYLES: Record<string, { chip: string; ring: string }> = {
  winter: { chip: "bg-sky-100 text-sky-800", ring: "ring-sky-200" },
  spring: { chip: "bg-emerald-100 text-emerald-800", ring: "ring-emerald-200" },
  summer: { chip: "bg-amber-100 text-amber-800", ring: "ring-amber-200" },
  autumn: { chip: "bg-orange-100 text-orange-800", ring: "ring-orange-200" },
};

/**
 * The year, month by month, with the destinations that are at their best in
 * each one.
 *
 * Countries repeat across months on purpose. Somebody asking "where do I go
 * in March" wants every option March offers, not the subset whose season
 * happens to start there.
 */
export default function SeasonsExplorer({
  locale,
  countries,
  cities,
  filtersDict,
  dict,
}: {
  locale: Locale;
  countries: DestinationCountry[];
  cities: CityOption[];
  filtersDict: FiltersDict;
  dict: SeasonsDict;
}) {
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    continent: "all",
    month: "all",
  });

  const matching = useMemo(
    () => countries.filter((c) => matchesFilters(c, filters)),
    [countries, filters]
  );

  // A chosen month collapses the page to that one section; otherwise the
  // whole year is shown.
  const visibleMonths = useMemo(
    () => (filters.month === "all" ? MONTHS : MONTHS.filter((m) => m.number === filters.month)),
    [filters.month]
  );

  const seasonLabel = (season: string) =>
    season === "winter"
      ? dict.seasonWinter
      : season === "spring"
        ? dict.seasonSpring
        : season === "summer"
          ? dict.seasonSummer
          : dict.seasonAutumn;

  return (
    <div>
      <p className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-900 ring-1 ring-brand-100">
        {dict.intro}
      </p>

      <DestinationFilters
        locale={locale}
        state={filters}
        onChange={setFilters}
        cities={cities}
        cityHrefBase={`/${locale}/attractions`}
        dict={filtersDict}
        resultCount={matching.length}
        resultLabel={filtersDict.countriesCount}
      />

      {matching.length === 0 ? (
        <p className="mt-8 rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          {dict.noResults}
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {visibleMonths.map((month) => {
            const inMonth = matching.filter((c) => c.months.includes(month.number));
            const style = SEASON_STYLES[month.season];

            return (
              <section key={month.number} className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ${style.ring}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-gray-900">
                    {dict.monthHeading.replace("{month}", locale === "ar" ? month.nameAr : month.nameEn)}
                  </h2>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${style.chip}`}>
                    {seasonLabel(month.season)}
                  </span>
                  <span className="text-xs font-semibold text-gray-400">
                    {dict.countriesInMonth.replace("{count}", String(inMonth.length))}
                  </span>
                </div>

                {inMonth.length === 0 ? (
                  <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-xs text-gray-400">
                    {dict.emptyMonth}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                    {inMonth.map((c) => (
                      <Link
                        key={c.code}
                        href={`/${locale}/attractions/${c.code}`}
                        className="group relative block aspect-[4/3] overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <Photo
                          src={c.photo}
                          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          fallback={
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-800 to-brand-950 text-3xl">
                              {flagEmoji(c.code)}
                            </div>
                          }
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                        <p className="absolute bottom-2 start-2.5 end-2.5 truncate text-xs font-bold text-white drop-shadow-sm sm:text-sm">
                          {locale === "ar" ? c.nameAr : c.nameEn}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-6 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
        {dict.sourceNote}
      </p>
    </div>
  );
}

export type { Continent };
