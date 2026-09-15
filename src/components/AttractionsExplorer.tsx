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
import PageHero from "@/components/ui/PageHero";
import SectionHeading from "@/components/ui/SectionHeading";
import type { SectionHero } from "@/lib/heroPhotos";
import { searchMatches, searchEquals } from "@/lib/search";

interface ExplorerDict {
  title: string;
  subtitle: string;
  featuredTitle: string;
  featuredSubtitle: string;
  moreDestinations: string;
  noResults: string;
  statCountries: string;
  statCities: string;
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
  hero,
}: {
  locale: Locale;
  featured: DestinationCountry[];
  cities: CityOption[];
  filtersDict: FiltersDict;
  dict: ExplorerDict;
  hero?: SectionHero;
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
      return searchMatches([c.nameAr, c.nameEn], q) || searchEquals(c.code, q);
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
      <PageHero
        {...hero}
        title={dict.title}
        subtitle={dict.subtitle}
        facts={[
          { value: String(featured.length), label: dict.statCountries },
          { value: String(cities.length), label: dict.statCities },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
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
          <section className="mt-10">
            <SectionHeading title={dict.featuredTitle} subtitle={dict.featuredSubtitle} />
            <CountryCardGrid
              locale={locale}
              countries={filteredFeatured}
              hrefBase={`/${locale}/attractions`}
              continentLabels={dict.continents}
            />
          </section>
        )}

        {filteredRest.length > 0 && (
          <section className="mt-12">
            <SectionHeading title={dict.moreDestinations} />
            <div className="space-y-8">
              {CONTINENT_ORDER.map((continent) => {
                const countries = groupedRest.get(continent) ?? [];
                if (countries.length === 0) return null;
                return (
                  <div key={continent}>
                    <h3 className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-navy-400">
                      {dict.continents[continent]}{" "}
                      <span className="text-navy-300">({countries.length})</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {countries.map((country) => (
                        <Link
                          key={country.code}
                          href={`/${locale}/attractions/${country.code}`}
                          className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 shadow-[var(--shadow-card)] ring-1 ring-navy-950/5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] hover:ring-sun-300"
                        >
                          <span className="text-xl leading-none">{flagEmoji(country.code)}</span>
                          <span className="text-sm font-semibold text-navy-800">
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
          <p className="mt-8 rounded-2xl bg-mist-100 px-4 py-12 text-center text-sm text-navy-500 ring-1 ring-mist-200">
            {dict.noResults}
          </p>
        )}
      </div>
    </div>
  );
}

export type { DestinationCountry as FeaturedDestination };
