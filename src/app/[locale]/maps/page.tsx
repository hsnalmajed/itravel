import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry } from "@/lib/countries";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchCountryPhotos } from "@/lib/countryPhotos";
import MapsCountryList, { type MapCountry } from "@/components/MapsCountryList";

// Photos are fetched live from Wikipedia, same as the rest of the site.
export const dynamic = "force-dynamic";

export default async function MapsPage({ params }: PageProps<"/[locale]/maps">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  // A country belongs here only if it has cities to open — the country page
  // is now a list of city maps, so a country with none would lead to an
  // empty page.
  const codes = Object.keys(COUNTRY_GUIDES).filter((c) => (COUNTRY_CITIES[c]?.length ?? 0) > 0);
  const photos = await fetchCountryPhotos(codes);

  const countries: MapCountry[] = codes
    .map((code): MapCountry | null => {
      const country = findCountry(code);
      if (!country) return null;
      return {
        code,
        nameAr: country.nameAr,
        nameEn: country.nameEn,
        photo: photos.get(code),
        cityCount: COUNTRY_CITIES[code].length,
      };
    })
    .filter((c): c is MapCountry => c !== null);

  return <MapsCountryList locale={loc} dict={dict.maps} countries={countries} />;
}
