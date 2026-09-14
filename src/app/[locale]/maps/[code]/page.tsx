import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import {findCountry} from "@/lib/countries";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchCityOverviews } from "@/lib/mapPins";
import { cityCountLabel } from "@/lib/format";
import CityGallery, { type CityCard } from "@/components/CityGallery";
import PageHero from "@/components/ui/PageHero";

export const dynamic = "force-dynamic";

// Picking a city, not reading a country map.
//
// A single map of a whole country puts every place into one cluster per city
// at the zoom level where the country fits on screen — technically correct
// and useless to read. The map that's worth showing is the city one, so this
// page's only job is to help the visitor choose which city.
export default async function CountryMapPage({ params }: PageProps<"/[locale]/maps/[code]">) {
  const { locale, code } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const country = findCountry(code);
  if (!country) notFound();

  const cities = COUNTRY_CITIES[country.code] ?? [];
  if (cities.length === 0) notFound();

  // A real photo and a real place count per city — the same lookup the
  // attractions guide uses, so the two sections never disagree about how much
  // a city has.
  const overviews = await fetchCityOverviews(cities);

  const cards: CityCard[] = cities.map((c) => {
    const overview = overviews.get(c.wikiTitle);
    return {
      slug: c.slug,
      name: loc === "ar" ? c.nameAr : c.nameEn,
      photo: overview?.photo,
      subtitle: overview?.count
        ? dict.maps.pinsCount.replace("{count}", String(overview.count))
        : undefined,
    };
  });

  const countryName = loc === "ar" ? country.nameAr : country.nameEn;

  // The country's hero picture comes from its first city that has one, so
  // this page opens on somewhere inside the country rather than on a map of
  // its borders.
  const heroPhoto = cards.map((c) => c.photo).find(Boolean);

  return (
    <div>
      <PageHero
        photo={heroPhoto}
        size="sm"
        eyebrow={dict.maps.title}
        title={dict.maps.countryMapTitle.replace("{country}", countryName)}
        subtitle={dict.maps.citiesSubtitle}
        facts={[{ value: String(cities.length), label: cityCountLabel(cities.length, dict.maps) }]}
      >
        <Link href={`/${loc}/maps`} className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20">
          <span aria-hidden="true">{loc === "ar" ? "→" : "←"}</span>
          {dict.maps.backToMaps}
        </Link>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <CityGallery cities={cards} hrefBase={`/${loc}/maps/${country.code}`} />
      </div>
    </div>
  );
}
