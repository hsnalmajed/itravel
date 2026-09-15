import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { fetchDestinationList } from "@/lib/destinationList";
import SeasonsExplorer from "@/components/SeasonsExplorer";
import PageHero from "@/components/ui/PageHero";
import { monthName } from "@/lib/seasons";

// Photos come live from Wikipedia, same as the rest of the site.
export const dynamic = "force-dynamic";

export default async function SeasonsPage({ params }: PageProps<"/[locale]/seasons">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const { countries, cities } = await fetchDestinationList(loc);

  // The hero picture comes from a country that is actually in season right
  // now, so the image at the top of a calendar page is never at odds with
  // the calendar underneath it.
  const month = new Date().getMonth() + 1;
  const inSeasonNow = countries.filter((c) => c.months.includes(month));
  const heroPhoto = (inSeasonNow.length > 0 ? inSeasonNow : countries)
    .map((c) => c.photo)
    .find(Boolean);

  return (
    <div>
      <PageHero
        photo={heroPhoto}
        size="sm"
        eyebrow={monthName(month, loc)}
        title={dict.seasons.title}
        subtitle={dict.seasons.subtitle}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
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

            modeQuestion: dict.seasons.modeQuestion,
            byMonth: dict.seasons.byMonth,
            byMonthHint: dict.seasons.byMonthHint,
            byCountry: dict.seasons.byCountry,
            byCountryHint: dict.seasons.byCountryHint,
            pickCountry: dict.seasons.pickCountry,
            pickCountryPlaceholder: dict.seasons.pickCountryPlaceholder,
            countrySearchPlaceholder: dict.seasons.countrySearchPlaceholder,
            countryNoMatches: dict.seasons.countryNoMatches,
            noCountryChosen: dict.seasons.noCountryChosen,
            yearFor: dict.seasons.yearFor,
            inSeason: dict.seasons.inSeason,
            outOfSeason: dict.seasons.outOfSeason,
            inSeasonCount: dict.seasons.inSeasonCount,
            inSeasonOne: dict.seasons.inSeasonOne,
            inSeasonTwo: dict.seasons.inSeasonTwo,
            inSeasonFew: dict.seasons.inSeasonFew,
            noMonthsForCountry: dict.seasons.noMonthsForCountry,
            changeMode: dict.seasons.changeMode,
            viewCountry: dict.seasons.viewCountry,
          }}
        />
      </div>
    </div>
  );
}
