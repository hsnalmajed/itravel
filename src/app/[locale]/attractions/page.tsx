import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry } from "@/lib/countries";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchWikiSummaries } from "@/lib/wikipedia";
import AttractionsExplorer, { type FeaturedDestination } from "@/components/AttractionsExplorer";

// Live Wikipedia lookups below (same honest, no-fabricated-photos source
// used on every country's own attractions page) — fetched fresh per
// request rather than frozen into the build, so a renamed article or a
// newly-added country guide shows up without a redeploy.
export const dynamic = "force-dynamic";

export default async function AttractionsPage({ params }: PageProps<"/[locale]/attractions">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const guidedCodes = Object.keys(COUNTRY_GUIDES);

  // One representative photo per featured destination: the country's own
  // best-known landmark (matches the hero photo shown on that country's own
  // attractions page), falling back to the country's general Wikipedia
  // photo if that specific landmark lookup comes back empty.
  const primaryTitles = guidedCodes.map((code) => COUNTRY_GUIDES[code].attractions[0].wikiTitle);
  const primarySummaries = await fetchWikiSummaries(primaryTitles);

  const missingCodes = guidedCodes.filter((code) => {
    const title = COUNTRY_GUIDES[code].attractions[0].wikiTitle;
    return !primarySummaries.get(title)?.thumbnail;
  });
  const fallbackNames = missingCodes
    .map((code) => findCountry(code)?.nameEn)
    .filter((n): n is string => Boolean(n));
  const fallbackSummaries = fallbackNames.length ? await fetchWikiSummaries(fallbackNames) : new Map();

  const featured: FeaturedDestination[] = guidedCodes
    .map((code): FeaturedDestination | null => {
      const country = findCountry(code);
      if (!country) return null;
      const title = COUNTRY_GUIDES[code].attractions[0].wikiTitle;
      const photo =
        primarySummaries.get(title)?.thumbnail || fallbackSummaries.get(country.nameEn)?.thumbnail;
      return {
        code,
        nameAr: country.nameAr,
        nameEn: country.nameEn,
        photo,
        cityCount: COUNTRY_CITIES[code]?.length ?? 0,
      };
    })
    .filter((c): c is FeaturedDestination => c !== null);

  return <AttractionsExplorer locale={loc} dict={dict.attractions} featured={featured} />;
}
