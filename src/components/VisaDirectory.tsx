"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { Continent } from "@/lib/countries";
import type { VisaCategory } from "@/lib/visa";
import { flagImageUrl } from "@/lib/visaProviders";
import { CONTINENT_ORDER } from "@/components/DestinationFilters";
import { VISA_ORDER, VISA_STYLES } from "@/components/VisaBadge";
import { searchMatches, searchEquals } from "@/lib/search";

export interface VisaCountry {
  code: string;
  nameAr: string;
  nameEn: string;
  continent: Continent;
  category: VisaCategory;
  /** The source's own wording, shown as-is. */
  status: string;
  stay: string;
  /** There is somewhere to actually start an application. */
  canApply: boolean;
}

interface DirectoryDict {
  searchPlaceholder: string;
  allStatuses: string;
  filterByType: string;
  countriesCount: string;
  noResults: string;
  allowedStay: string;
  canApply: string;
  summaryFree: string;
  summaryEasy: string;
  labels: Record<VisaCategory, string>;
  hints: Record<VisaCategory, string>;
  continents: Record<Continent, string>;
}

/**
 * Every country, once.
 *
 * This page used to answer the same question twice. Near the top, a grid of
 * the forty-nine countries we can hand someone an application link for; far
 * below, a separate list of all hundred and ninety-three with their entry
 * status. Two counts for one subject, in two different layouts, and a reader
 * who saw "49 countries" at the top had no way to know the real answer was
 * further down.
 *
 * So there is one directory. It covers every country the source publishes, it
 * is laid out like the grid people liked — a card each, searchable, filtered
 * by what it costs you to get in — and it is grouped by continent, because a
 * hundred and ninety-three cards in a single run is a wall rather than an
 * answer.
 *
 * Where an application can actually be started, the card says so. That was the
 * only thing the old top section knew that the bottom one didn't, and it is
 * now a line on the card instead of a section of its own.
 *
 * The cards carry flags rather than photographs, for two reasons. A grid where
 * a quarter of the cards have a picture and the rest don't looks broken, and
 * the page could only ever afford photographs for a quarter: fetching one per
 * country meant a hundred and ninety-three lookups competing with the one
 * request this page cannot do without — the visa table itself, which was
 * losing that race and leaving the page saying it could not check. On a page
 * about who may enter where, the flag is the right picture anyway.
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
  const [category, setCategory] = useState<VisaCategory | "all">("all");

  const counts = useMemo(() => {
    const c = {} as Record<VisaCategory, number>;
    for (const cat of VISA_ORDER) c[cat] = 0;
    for (const country of countries) c[country.category]++;
    return c;
  }, [countries]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return countries.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (!q) return true;
      return searchMatches([c.nameAr, c.nameEn], q) || searchEquals(c.code, q);
    });
  }, [countries, query, category]);

  const grouped = useMemo(() => {
    const map = new Map<Continent, VisaCountry[]>();
    for (const continent of CONTINENT_ORDER) map.set(continent, []);
    for (const country of filtered) map.get(country.continent)?.push(country);
    return map;
  }, [filtered]);

  const chipClass = (active: boolean) =>
    `rounded-full px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
      active
        ? "bg-brand-800 text-white shadow-sm"
        : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-brand-300"
    }`;

  return (
    <div>
      {/* The two numbers worth knowing before reading anything else. */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <p className="text-2xl font-extrabold text-emerald-900">{counts.free}</p>
          <p className="text-sm font-semibold text-emerald-800">
            {dict.summaryFree.replace("{count}", String(counts.free))}
          </p>
        </div>
        <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
          <p className="text-2xl font-extrabold text-sky-900">{counts.arrival + counts.eta}</p>
          <p className="text-sm font-semibold text-sky-800">
            {dict.summaryEasy.replace("{count}", String(counts.arrival + counts.eta))}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-black/5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-gray-400"
        />

        <p className="mt-3 mb-2 text-sm font-bold text-gray-700">{dict.filterByType}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setCategory("all")} className={chipClass(category === "all")}>
            {dict.allStatuses}
          </button>
          {VISA_ORDER.filter((c) => counts[c] > 0).map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={chipClass(category === c)}>
              <span className="inline-flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${VISA_STYLES[c].dot}`} aria-hidden="true" />
                {dict.labels[c]}
                <span className={category === c ? "text-white/70" : "text-gray-400"}>({counts[c]})</span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs font-semibold text-gray-500">
          {dict.countriesCount.replace("{count}", String(filtered.length))}
        </p>
      </div>

      {category !== "all" && (
        <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-900 ring-1 ring-brand-100">
          {dict.hints[category]}
        </p>
      )}

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
                        {/* The status colour as a band across the top, so a
                            grid of a hundred and ninety-three is readable at a
                            glance before a single word is read. */}
                        <div
                          className={`relative flex h-20 items-center justify-center ${
                            VISA_STYLES[c.category].chip
                          }`}
                        >
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

                          <span
                            className={`mx-auto mt-1.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              VISA_STYLES[c.category].chip
                            }`}
                          >
                            <span aria-hidden="true">{VISA_STYLES[c.category].icon}</span>
                            {dict.labels[c.category]}
                          </span>

                          {c.stay && (
                            <p className="mt-1.5 text-[10px] font-semibold text-gray-500">
                              {dict.allowedStay}: <span dir="ltr">{c.stay}</span>
                            </p>
                          )}

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
