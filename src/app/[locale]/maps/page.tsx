import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/types";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchDestinationList } from "@/lib/destinationList";
import { cityCountLabel } from "@/lib/format";
import MapsCountryList from "@/components/MapsCountryList";
import { sectionHero } from "@/lib/sectionHero";

// Photos are fetched live from Wikipedia, same as the rest of the site.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/maps">): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);
  return pageMetadata({
    locale: loc,
    path: "/maps",
    title: dict.maps.title,
    description: dict.maps.subtitle,
  });
}

export default async function MapsPage({ params }: PageProps<"/[locale]/maps">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  // A country belongs here only if it has cities to open — the country page
  // is a list of city maps, so a country with none would lead to an empty
  // page.
  const [{ countries, cities }, hero] = await Promise.all([
    fetchDestinationList(loc, { onlyWithCities: true }),
    sectionHero("maps", loc),
  ]);

  const withCityCounts = countries.map((c) => ({
    ...c,
    subtitle: `🏙️ ${cityCountLabel(COUNTRY_CITIES[c.code]?.length ?? 0, dict.maps)}`,
  }));

  return (
    <MapsCountryList
      locale={loc}
      hero={hero}
      countries={withCityCounts}
      cities={cities}
      filtersDict={{
        searchPlaceholder: dict.filters.searchPlaceholder,
        allContinents: dict.filters.allContinents,
        byMonth: dict.filters.byMonth,
        allMonths: dict.filters.allMonths,
        byCity: dict.filters.byCity,
        cityPlaceholder: dict.filters.cityPlaceholder,
        noMatches: dict.filters.noMatches,
        clear: dict.filters.clear,
        countriesCount: dict.filters.countriesCount,
        continents: dict.attractions.continents,
      }}
      dict={{
        title: dict.maps.title,
        subtitle: dict.maps.subtitle,
        noResults: dict.filters.noResults,
        statCountries: dict.home.statCountries,
        statCities: dict.home.statCities,
        mapAttribution: dict.maps.mapAttribution,
        worldHint: dict.maps.worldHint,
      }}
    />
  );
}
