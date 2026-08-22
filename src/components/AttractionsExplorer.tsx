"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import { COUNTRIES, flagEmoji, type Continent, type Country } from "@/lib/countries";
import DestinationFilters, {
  CONTINENT_ORDER,
  type CityOption,
  type FilterState,
  type FiltersDict,
} from "@/components/DestinationFilters";
import CountryCardGrid, {
  matchesFilters,
  type DestinationCountry,
} from "@/components/CountryCardGrid";

interface ExplorerDict {
  title: string;
  subtitle: string;
  featuredTitle: string;
  featuredSubtitle: string;
  moreDestinations: string;
  noResults: string;
  continents: Record<Continent, string>;
}

// Two tiers, both grouped by continent: the countries with a full guide get
// photo cards, and every other country stays reachable as a plain entry in
// the directory below. The filters above narrow both at once, so a search for
// "Peru" finds it whether or not it has a guide yet.
export default function AttractionsExplorer({
  locale,
  featured,
  cities,
  filtersDict,
  dict,
}: {
  locale: Locale;
  featured: DestinationCountry[];
  cities: CityOption[];
  filtersDict: FiltersDict;
  dict: ExplorerDict;
}) {
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    continent: "all",
    month: "all",
  });

  const featuredCodes = useMemo(() => new Set(featured.map((f) => f.code)), [featured]);
  const restCountries = useMemo(
    () => COUNTRIES.filter((c) => !featuredCodes.has(c.code)),
    [featuredCodes]
  );

  const filteredFeatured = useMemo(
    () => featured.filter((c) => matchesFilters(c, filters)),
    [featured, filters]
  );

  const filteredRest = useMemo(() => {
    // A month filter can only speak for countries that have a guide, and the
    // directory below is precisely the countries that don't. Rather than show
    // them all as though they were recommended for the chosen month, the
    // directory steps aside while a month is selected.
    if (filters.month !== "all") return [];
    const q = filters.query.trim();
    return restCountries.filter((c) => {
      if (filters.continent !== "all" && c.continent !== filters.continent) return false;
      if (!q) return true;
      return (
        c.nameAr.includes(q) ||
        c.nameEn.toLowerCase().includes(q.toLowerCase()) ||
        c.code.toLowerCase() === q.toLowerCase()
      );
    });
  }, [restCountries, filters]);

  const groupedRest = useMemo(() => {
    const map = new Map<Continent, Country[]>();
    for (const continent of CONTINENT_ORDER) map.set(continent, []);
    for (const country of filteredRest) map.get(country.continent)?.push(country);
    return map;
  }, [filteredRest]);

  const nothingFound = filteredFeatured.length === 0 && filteredRest.length === 0;

  return (
    <div>
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-6xl text-center text-white">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{dict.title}</h1>
          <p className="mt-2 text-white/70">{dict.subtitle}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <DestinationFilters
          locale={locale}
          state={filters}
          onChange={setFilters}
          cities={cities}
          cityHrefBase={`/${locale}/attractions`}
          dict={filtersDict}
          resultCount={filteredFeatured.length + filteredRest.length}
          resultLabel={filtersDict.countriesCount}
        />

        {filteredFeatured.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-brand-900">{dict.featuredTitle}</h2>
            <p className="mb-4 text-sm text-gray-500">{dict.featuredSubtitle}</p>
            <CountryCardGrid
              locale={locale}
              countries={filteredFeatured}
              hrefBase={`/${locale}/attractions`}
              continentLabels={dict.continents}
            />
          </section>
        )}

        {filteredRest.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
              <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
              {dict.moreDestinations}
            </h2>
            <div className="space-y-8">
              {CONTINENT_ORDER.map((continent) => {
                const countries = groupedRest.get(continent) ?? [];
                if (countries.length === 0) return null;
                return (
                  <div key={continent}>
                    <h3 className="mb-3 text-sm font-bold text-gray-500">
                      {dict.continents[continent]}{" "}
                      <span className="font-normal text-gray-400">({countries.length})</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {countries.map((country) => (
                        <Link
                          key={country.code}
                          href={`/${locale}/attractions/${country.code}`}
                          className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-brand-200 hover:shadow-md"
                        >
                          <span className="text-xl leading-none">{flagEmoji(country.code)}</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {locale === "ar" ? country.nameAr : country.nameEn}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {nothingFound && (
          <p className="mt-8 rounded-xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
            {dict.noResults}
          </p>
        )}
      </div>
    </div>
  );
}

export type { DestinationCountry as FeaturedDestination };
