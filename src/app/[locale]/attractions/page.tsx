import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchDestinationList } from "@/lib/destinationList";
import { cityCountLabel } from "@/lib/format";
import AttractionsExplorer from "@/components/AttractionsExplorer";

// Live Wikipedia lookups — fetched fresh per request rather than frozen into
// the build, so a renamed article or a newly-added country guide shows up
// without a redeploy.
export const dynamic = "force-dynamic";

export default async function AttractionsPage({ params }: PageProps<"/[locale]/attractions">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const { countries, cities } = await fetchDestinationList(loc);

  const featured = countries.map((c) => {
    const cityCount = COUNTRY_CITIES[c.code]?.length ?? 0;
    return {
      ...c,
      subtitle: cityCount > 0 ? `🏙️ ${cityCountLabel(cityCount, dict.attractions)}` : undefined,
    };
  });

  // A real photograph for the hero, taken from the first destination that
  // has one — so the attractions page opens on an attraction.
  const heroPhoto = countries.map((c) => c.photo).find(Boolean);

  return (
    <AttractionsExplorer
      locale={loc}
      heroPhoto={heroPhoto}
      featured={featured}
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
        title: dict.attractions.title,
        subtitle: dict.attractions.subtitle,
        featuredTitle: dict.attractions.featuredTitle,
        featuredSubtitle: dict.attractions.featuredSubtitle,
        moreDestinations: dict.attractions.moreDestinations,
        noResults: dict.filters.noResults,
        statCountries: dict.home.statCountries,
        statCities: dict.home.statCities,
        continents: dict.attractions.continents,
      }}
    />
  );
}
