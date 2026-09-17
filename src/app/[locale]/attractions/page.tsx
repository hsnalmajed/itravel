import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/types";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchDestinationList } from "@/lib/destinationList";
import { cityCountLabel } from "@/lib/format";
import AttractionsExplorer from "@/components/AttractionsExplorer";
import { sectionHero } from "@/lib/sectionHero";

// Live Wikipedia lookups — fetched fresh per request rather than frozen into
// the build, so a renamed article or a newly-added country guide shows up
// without a redeploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/attractions">): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);
  return pageMetadata({
    locale: loc,
    path: "/attractions",
    title: dict.attractions.title,
    description: dict.attractions.subtitle,
  });
}

export default async function AttractionsPage({ params }: PageProps<"/[locale]/attractions">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  // The destination list and the hero are independent lookups, so they run
  // together rather than one after the other.
  // Only countries with cities. A country page is now a list of its cities,
  // so one with none leads to an empty page — and a directory entry that
  // opens onto nothing is worse than no entry at all.
  const [{ countries, cities }, hero] = await Promise.all([
    fetchDestinationList(loc, { onlyWithCities: true }),
    sectionHero("attractions", loc),
  ]);

  const featured = countries.map((c) => ({
    ...c,
    subtitle: `🏙️ ${cityCountLabel(COUNTRY_CITIES[c.code]?.length ?? 0, dict.attractions)}`,
  }));

  return (
    <AttractionsExplorer
      locale={loc}
      hero={hero}
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
        noResults: dict.filters.noResults,
        statCountries: dict.home.statCountries,
        statCities: dict.home.statCities,
        continents: dict.attractions.continents,
      }}
    />
  );
}
