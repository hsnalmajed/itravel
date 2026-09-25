"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { Continent } from "@/lib/countries";
import { flagImageUrl } from "@/lib/visaProviders";
import { CONTINENT_ORDER } from "@/components/DestinationFilters";
import { searchMatches, searchEquals } from "@/lib/search";

export interface VisaCountry {
  code: string;
  nameAr: string;
  nameEn: string;
  continent: Continent;
  /** There is somewhere to actually start an application. */
  canApply: boolean;
}

interface DirectoryDict {
  searchPlaceholder: string;
  countriesCount: string;
  noResults: string;
  canApply: string;
  continents: Record<Continent, string>;
}

/**
 * Every country, once, as a way into its page.
 *
 * The directory makes no claim about entry status — the site states none (see
 * visaProviders.ts). It is a searchable list grouped by continent, each card
 * leading to that country's official links. The one fact a card carries is
 * our own: whether we hold a verified application link for it.
 *
 * The cards carry flags rather than photographs: fetching a photo per country
 * meant a couple of hundred lookups for a page that is really an index, and
 * on a page about crossing borders the flag is the right picture anyway.
 */
export default function VisaDirectory({
  locale,
  countries,
  dict,
}: {
  locale: Locale;
  countries: VisaCountry[];
  dict: DirectoryDict;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return countries;
    return countries.filter((c) => searchMatches([c.nameAr, c.nameEn], q) || searchEquals(c.code, q));
  }, [countries, query]);

  const grouped = useMemo(() => {
    const map = new Map<Continent, VisaCountry[]>();
    for (const continent of CONTINENT_ORDER) map.set(continent, []);
    for (const country of filtered) map.get(country.continent)?.push(country);
    return map;
  }, [filtered]);

  return (
    <div>
      <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-black/5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-gray-400"
        />
        <p className="mt-3 text-xs font-semibold text-gray-500">
          {dict.countriesCount.replace("{count}", String(filtered.length))}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
          {dict.noResults}
        </p>
      ) : (
        <div className="mt-6 space-y-10">
          {CONTINENT_ORDER.map((continent) => {
            const inContinent = grouped.get(continent) ?? [];
            if (inContinent.length === 0) return null;

            return (
              <section key={continent}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-900">
                  <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
                  {dict.continents[continent]}
                  <span className="text-sm font-normal text-gray-400">({inContinent.length})</span>
                </h2>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                  {inContinent.map((c) => {
                    const name = locale === "ar" ? c.nameAr : c.nameEn;
                    return (
                      <Link
                        key={c.code}
                        href={`/${locale}/visa/${c.code}`}
                        className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-200"
                      >
                        <div className="relative flex h-20 items-center justify-center bg-brand-50">
                          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white">
                            {/* eslint-disable-next-line @next/next/no-img-element -- flag
                                CDN, and the app runs with the Next image optimizer
                                disabled on Workers. */}
                            <img
                              src={flagImageUrl(c.code)}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col px-2 pb-3 pt-3 text-center">
                          <p className="truncate text-sm font-bold text-gray-900">{name}</p>
                          {c.canApply && (
                            <p className="mt-auto pt-1.5 text-[10px] font-bold text-brand-700">
                              {dict.canApply}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
