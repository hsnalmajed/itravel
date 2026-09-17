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
import WorldMap from "@/components/WorldMap";
import { COUNTRY_CENTROIDS } from "@/lib/countryCentroids";
import type { SectionHero } from "@/lib/heroPhotos";

interface MapsDict {
  title: string;
  subtitle: string;
  noResults: string;
  statCountries: string;
  statCities: string;
  mapAttribution: string;
  worldHint: string;
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

  /**
   * The map reflects the filters, so narrowing the list narrows the map too.
   * A country with no centroid is skipped rather than guessed at — it is
   * still in the grid below.
   */
  const worldPins = useMemo(
    () =>
      filtered
        .map((c) => {
          const at = COUNTRY_CENTROIDS[c.code];
          if (!at) return null;
          return {
            code: c.code,
            name: locale === "ar" ? c.nameAr : c.nameEn,
            lat: at.lat,
            lon: at.lon,
            cities: c.cityNames.length,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null),
    [filtered, locale]
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

        {/* The map first, because someone who clicked "maps" has already
            said what they want to look at. The grid stays underneath for
            anyone who would rather search than aim. */}
        {worldPins.length > 0 && (
          <div className="mt-8">
            <WorldMap locale={locale} pins={worldPins} attribution={dict.mapAttribution} />
            <p className="mt-2 text-center text-xs text-navy-500">{dict.worldHint}</p>
          </div>
        )}

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
