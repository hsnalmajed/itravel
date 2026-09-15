"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/types";
import type { Continent } from "@/lib/countries";
import DestinationFilters, {
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

interface MapsDict {
  title: string;
  subtitle: string;
  noResults: string;
  statCountries: string;
  statCities: string;
}

export default function MapsCountryList({
  locale,
  countries,
  cities,
  filtersDict,
  dict,
  hero,
}: {
  locale: Locale;
  countries: DestinationCountry[];
  cities: CityOption[];
  filtersDict: FiltersDict;
  dict: MapsDict;
  hero?: SectionHero;
}) {
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    continent: "all",
    month: "all",
  });

  const filtered = useMemo(
    () => countries.filter((c) => matchesFilters(c, filters)),
    [countries, filters]
  );

  return (
    <div>
      <PageHero
        {...hero}
        title={dict.title}
        subtitle={dict.subtitle}
        facts={[
          { value: String(countries.length), label: dict.statCountries },
          { value: String(cities.length), label: dict.statCities },
        ]}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <DestinationFilters
          locale={locale}
          state={filters}
          onChange={setFilters}
          cities={cities}
          cityHrefBase={`/${locale}/maps`}
          dict={filtersDict}
          resultCount={filtered.length}
          resultLabel={filtersDict.countriesCount}
        />

        <div className="mt-8">
          {filtered.length === 0 ? (
            <p className="rounded-2xl bg-mist-100 px-4 py-12 text-center text-sm text-navy-500 ring-1 ring-mist-200">
              {dict.noResults}
            </p>
          ) : (
            <CountryCardGrid
              locale={locale}
              countries={filtered}
              hrefBase={`/${locale}/maps`}
              continentLabels={filtersDict.continents}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export type { DestinationCountry as MapCountry, Continent };
