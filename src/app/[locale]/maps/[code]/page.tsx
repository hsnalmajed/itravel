import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry, flagEmoji } from "@/lib/countries";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchWikiSummaries } from "@/lib/wikipedia";
import { cityCountLabel } from "@/lib/format";
import CityGallery, { type CityCard } from "@/components/CityGallery";

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

  // One real photo per city, from that city's own Wikipedia article.
  const summaries = await fetchWikiSummaries(cities.map((c) => c.wikiTitle));

  const cards: CityCard[] = cities.map((c) => ({
    slug: c.slug,
    name: loc === "ar" ? c.nameAr : c.nameEn,
    photo: summaries.get(c.wikiTitle)?.thumbnail,
  }));

  const countryName = loc === "ar" ? country.nameAr : country.nameEn;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <Link
        href={`/${loc}/maps`}
        className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <span aria-hidden="true">{loc === "ar" ? "→" : "←"}</span>
        {dict.maps.backToMaps}
      </Link>

      <h1 className="mb-1 flex items-center gap-2.5 text-xl sm:text-2xl font-extrabold text-gray-900">
        <span className="text-2xl leading-none">{flagEmoji(country.code)}</span>
        {dict.maps.countryMapTitle.replace("{country}", countryName)}
      </h1>
      <p className="mb-1 text-sm font-semibold text-brand-700">
        🏙️ {cityCountLabel(cities.length, dict.maps)}
      </p>
      <p className="mb-6 text-sm text-gray-500">{dict.maps.citiesSubtitle}</p>

      <CityGallery cities={cards} hrefBase={`/${loc}/maps/${country.code}`} />
    </div>
  );
}
