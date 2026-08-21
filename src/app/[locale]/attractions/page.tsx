import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry } from "@/lib/countries";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchCountryPhotos } from "@/lib/countryPhotos";
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
  // best-known landmark, walking down a short list of real candidates so a
  // single article with no lead image doesn't leave a country blank.
  const photos = await fetchCountryPhotos(guidedCodes);

  const featured: FeaturedDestination[] = guidedCodes
    .map((code): FeaturedDestination | null => {
      const country = findCountry(code);
      if (!country) return null;
      return {
        code,
        nameAr: country.nameAr,
        nameEn: country.nameEn,
        photo: photos.get(code),
        cityCount: COUNTRY_CITIES[code]?.length ?? 0,
      };
    })
    .filter((c): c is FeaturedDestination => c !== null);

  return <AttractionsExplorer locale={loc} dict={dict.attractions} featured={featured} />;
}
