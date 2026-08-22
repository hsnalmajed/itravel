import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { fetchDestinationList } from "@/lib/destinationList";
import SeasonsExplorer from "@/components/SeasonsExplorer";

// Photos come live from Wikipedia, same as the rest of the site.
export const dynamic = "force-dynamic";

export default async function SeasonsPage({ params }: PageProps<"/[locale]/seasons">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const { countries, cities } = await fetchDestinationList(loc);

  return (
    <div>
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-6xl text-center text-white">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">🗓️ {dict.seasons.title}</h1>
          <p className="mt-2 text-white/70">{dict.seasons.subtitle}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <SeasonsExplorer
          locale={loc}
          countries={countries}
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
            intro: dict.seasons.intro,
            monthHeading: dict.seasons.monthHeading,
            countriesInMonth: dict.seasons.countriesInMonth,
            emptyMonth: dict.seasons.emptyMonth,
            seasonWinter: dict.seasons.seasonWinter,
            seasonSpring: dict.seasons.seasonSpring,
            seasonSummer: dict.seasons.seasonSummer,
            seasonAutumn: dict.seasons.seasonAutumn,
            sourceNote: dict.seasons.sourceNote,
            noResults: dict.filters.noResults,
          }}
        />
      </div>
    </div>
  );
}
