"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/types";
import type { Continent } from "@/lib/countries";
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
import type { SectionHero } from "@/lib/heroPhotos";

interface ExplorerDict {
  title: string;
  subtitle: string;
  noResults: string;
  statCountries: string;
  statCities: string;
  continents: Record<Continent, string>;
}

/**
 * One list, by continent.
 *
 * This page used to be two: a row of "featured destinations" with photographs,
 * and a long directory of every other country underneath as bare name chips.
 * That split promised something it couldn't keep — the chips led to pages with
 * nothing on them, because a country is only worth opening here if we have
 * cities and documented places for it. So there is now one list, every entry
 * in it goes somewhere real, and the continent is a heading rather than a
 * second tier.
 *
 * The countries arrive already filtered to the ones that have cities; this
 * component's job is only to group and narrow them.
 */
export default function AttractionsExplorer({
  locale,
  featured,
  cities,
  filtersDict,
  dict,
  hero,
}: {
  locale: Locale;
  /** Countries with at least one city to open. */
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

  const filtered = useMemo(
    () => featured.filter((c) => matchesFilters(c, filters)),
    [featured, filters]
  );

  const byContinent = useMemo(() => {
    const map = new Map<Continent, DestinationCountry[]>();
    for (const continent of CONTINENT_ORDER) map.set(continent, []);
    for (const country of filtered) map.get(country.continent)?.push(country);
    return map;
  }, [filtered]);

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
          resultCount={filtered.length}
          resultLabel={filtersDict.countriesCount}
        />

        {filtered.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-mist-100 px-4 py-12 text-center text-sm text-navy-500 ring-1 ring-mist-200">
            {dict.noResults}
          </p>
        ) : (
          <div className="mt-10 space-y-12">
            {CONTINENT_ORDER.map((continent) => {
              const countries = byContinent.get(continent) ?? [];
              if (countries.length === 0) return null;
              return (
                <section key={continent}>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand-900">
                    <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
                    {dict.continents[continent]}
                    <span className="text-sm font-semibold text-navy-400">
                      ({countries.length})
                    </span>
                  </h2>
                  <CountryCardGrid
                    locale={locale}
                    countries={countries}
                    hrefBase={`/${locale}/attractions`}
                    continentLabels={dict.continents}
                  />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export type { DestinationCountry as FeaturedDestination };
