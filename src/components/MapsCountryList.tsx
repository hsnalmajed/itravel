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

interface MapsDict {
  title: string;
  subtitle: string;
  noResults: string;
}

export default function MapsCountryList({
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
  dict: MapsDict;
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
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-6xl text-center text-white">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">🗺️ {dict.title}</h1>
          <p className="mt-2 text-white/70">{dict.subtitle}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
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
            <p className="rounded-xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
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
