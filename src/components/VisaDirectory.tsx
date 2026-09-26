"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { Continent } from "@/lib/countries";
import { flagImageUrl } from "@/lib/visaProviders";
import { CONTINENT_ORDER } from "@/components/DestinationFilters";
import { searchMatches, searchEquals } from "@/lib/search";
import Photo from "@/components/Photo";

export interface VisaCountry {
  code: string;
  nameAr: string;
  nameEn: string;
  continent: Continent;
  /** A photograph of the place, when Pexels has a fitting one. */
  photo?: string;
  /** We hold a verified link to the country's own government visa portal. */
  official: boolean;
  /** Direct (visa.directksa.com) has a page for this country. */
  direct: boolean;
}

interface DirectoryDict {
  searchPlaceholder: string;
  countriesCount: string;
  noResults: string;
  continents: Record<Continent, string>;
  badgeOfficial: string;
  badgeDirect: string;
  routeFilterLabel: string;
  routeAll: string;
  routeOfficial: string;
  routeDirect: string;
  routeBoth: string;
}

type Route = "all" | "official" | "direct" | "both";

/**
 * The countries we can actually send a traveller somewhere for.
 *
 * Only countries with a verified place to apply are listed — the country's
 * own government visa portal, or its page on Direct. A country we hold
 * neither for is left out rather than shown as a card that leads nowhere.
 *
 * The directory still states no entry status (see visaProviders.ts): Direct's
 * catalogue is the visas it sells to applicants in Saudi Arabia, and some of
 * its pages are for residents, so "on Direct" does not mean "a Saudi citizen
 * needs a visa". The filter is therefore by where you apply, which is a fact
 * we hold, not by what the rule is, which we don't.
 *
 * The two routes look different on purpose. The official portal is the
 * government itself and the cheapest route — solid navy with a columned
 * building. Direct is an agency that charges a fee for handling the paperwork
 * — sunset orange with a document. Seen side by side on a grid, the
 * difference reads before the words do.
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
  const [route, setRoute] = useState<Route>("all");

  const matchesRoute = (c: VisaCountry, r: Route) =>
    r === "all" ||
    (r === "official" && c.official) ||
    (r === "direct" && c.direct) ||
    (r === "both" && c.official && c.direct);

  const counts = useMemo(
    () => ({
      all: countries.length,
      official: countries.filter((c) => c.official).length,
      direct: countries.filter((c) => c.direct).length,
      both: countries.filter((c) => c.official && c.direct).length,
    }),
    [countries]
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    return countries.filter(
      (c) =>
        matchesRoute(c, route) &&
        (!q || searchMatches([c.nameAr, c.nameEn], q) || searchEquals(c.code, q))
    );
  }, [countries, query, route]);

  const grouped = useMemo(() => {
    const map = new Map<Continent, VisaCountry[]>();
    for (const continent of CONTINENT_ORDER) map.set(continent, []);
    for (const country of filtered) map.get(country.continent)?.push(country);
    return map;
  }, [filtered]);

  const routes: { value: Route; label: string }[] = [
    { value: "all", label: dict.routeAll },
    { value: "official", label: dict.routeOfficial },
    { value: "direct", label: dict.routeDirect },
    { value: "both", label: dict.routeBoth },
  ];

  return (
    <div>
      <div className="rounded-2xl bg-mist-50 p-4 ring-1 ring-mist-200">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full rounded-xl border border-mist-200 bg-white px-4 py-3 text-sm text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-sea-400 focus:ring-4 focus:ring-sea-100"
        />

        <p className="mb-2 mt-4 text-xs font-bold text-navy-700">{dict.routeFilterLabel}</p>
        <div className="flex flex-wrap gap-2">
          {routes.map((r) => {
            const active = route === r.value;
            return (
              <button
                key={r.value}
                type="button"
                aria-pressed={active}
                onClick={() => setRoute(r.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition sm:text-sm ${
                  active ? "bg-navy-900 text-white shadow-sm" : "bg-white text-navy-700 ring-1 ring-mist-200 hover:ring-navy-200"
                }`}
              >
                {r.value === "official" && <span aria-hidden="true">🏛</span>}
                {r.value === "direct" && <span aria-hidden="true">📄</span>}
                {r.label}
                <span className={active ? "text-white/60" : "text-navy-400"}>({counts[r.value]})</span>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs font-semibold text-navy-500">
          {dict.countriesCount.replace("{count}", String(filtered.length))}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-xl bg-mist-50 px-4 py-10 text-center text-sm text-navy-500">{dict.noResults}</p>
      ) : (
        <div className="mt-6 space-y-10">
          {CONTINENT_ORDER.map((continent) => {
            const inContinent = grouped.get(continent) ?? [];
            if (inContinent.length === 0) return null;

            return (
              <section key={continent}>
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-extrabold text-navy-900">
                  <span className="h-4 w-1 rounded-full bg-sun-400" aria-hidden="true" />
                  {dict.continents[continent]}
                  <span className="text-sm font-normal text-navy-400">({inContinent.length})</span>
                </h2>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                  {inContinent.map((c) => {
                    const name = locale === "ar" ? c.nameAr : c.nameEn;
                    return (
                      <Link
                        key={c.code}
                        href={`/${locale}/visa/${c.code}`}
                        className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-navy-950/5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] hover:ring-sea-400/40"
                      >
                        {/* The place, with its flag on the seam — where the eye
                            lands when scanning a grid of destinations. */}
                        <div className="relative h-24 sm:h-28">
                          <Photo
                            src={c.photo}
                            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            fallback={<div className="absolute inset-0 bg-gradient-to-br from-navy-700 to-navy-990" />}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-navy-990/40 to-transparent" />
                          <span className="absolute -bottom-6 start-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white rtl:translate-x-1/2">
                            {/* eslint-disable-next-line @next/next/no-img-element -- flag
                                CDN, and the app runs with the Next image optimizer
                                disabled on Workers. */}
                            <img src={flagImageUrl(c.code)} alt="" loading="lazy" className="h-full w-full object-cover" />
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col items-center px-2 pb-3 pt-8 text-center">
                          <p className="w-full truncate text-sm font-bold text-navy-900">{name}</p>
                          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                            {c.official && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-2.5 py-1 text-xs font-extrabold text-white">
                                <span aria-hidden="true">🏛</span>
                                {dict.badgeOfficial}
                              </span>
                            )}
                            {c.direct && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sun-400 px-2.5 py-1 text-xs font-extrabold text-navy-950">
                                <span aria-hidden="true">📄</span>
                                {dict.badgeDirect}
                              </span>
                            )}
                          </div>
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
