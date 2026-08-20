import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry } from "@/lib/countries";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { fetchWikiSummaries } from "@/lib/wikipedia";
import MapsCountryList, { type MapCountry } from "@/components/MapsCountryList";

// Photos and coordinates are fetched live from Wikipedia, same as the rest
// of the attractions section.
export const dynamic = "force-dynamic";

export default async function MapsPage({ params }: PageProps<"/[locale]/maps">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  // Only countries we have a curated guide for can produce a meaningful map,
  // since those are the ones with landmarks to place on it.
  const codes = Object.keys(COUNTRY_GUIDES);
  const titles = codes.map((c) => COUNTRY_GUIDES[c].attractions[0].wikiTitle);
  const summaries = await fetchWikiSummaries(titles);

  const countries: MapCountry[] = codes
    .map((code): MapCountry | null => {
      const country = findCountry(code);
      if (!country) return null;
      const summary = summaries.get(COUNTRY_GUIDES[code].attractions[0].wikiTitle);
      return {
        code,
        nameAr: country.nameAr,
        nameEn: country.nameEn,
        photo: summary?.thumbnail,
        placeCount: COUNTRY_GUIDES[code].attractions.length + COUNTRY_GUIDES[code].activities.length,
      };
    })
    .filter((c): c is MapCountry => c !== null);

  return <MapsCountryList locale={loc} dict={dict.maps} countries={countries} />;
}
