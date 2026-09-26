import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/types";
import CitySeasons, { type SeasonCity } from "@/components/CitySeasons";
import PageHero from "@/components/ui/PageHero";
import { sectionHero } from "@/lib/sectionHero";
import { monthName } from "@/lib/seasons";
import { COUNTRY_CITIES } from "@/lib/cities";
import { findCountry } from "@/lib/countries";
import { CITY_CLIMATE } from "@/data/cityClimate";
import { hasReliableClimate, isInSeason, seasonKindFor } from "@/lib/citySeasons";
import { fetchCityPhotos } from "@/lib/countryPhotos";

// Photos come from Pexels, same as the rest of the site.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/seasons">): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);
  return pageMetadata({
    locale: loc,
    path: "/seasons",
    title: dict.seasons.title,
    description: dict.seasons.subtitle,
  });
}

/**
 * The seasons page, city by city, from measured weather.
 *
 * It used to lay out countries by the hand-typed "best months" line in each
 * country guide — one line for a whole country, no source. Now every city
 * carries its own 12 months of 20-year averages (src/data/cityClimate.ts),
 * its season by hemisphere or, in the tropics, by rain (citySeasons.ts), and
 * "in season" is one stated rule shared with the homepage.
 */
export default async function SeasonsPage({ params }: PageProps<"/[locale]/seasons">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);
  const d = dict.citySeasons;
  const isAr = loc === "ar";

  const list = Object.entries(COUNTRY_CITIES).flatMap(([code, cs]) =>
    cs.filter((c) => CITY_CLIMATE[c.slug]).map((c) => ({ code, ...c }))
  );

  const [hero, photos] = await Promise.all([
    sectionHero("seasons", loc),
    fetchCityPhotos(list.map((c) => ({ code: c.code, slug: c.slug, nameEn: c.nameEn }))),
  ]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const cities: SeasonCity[] = list.flatMap((c) => {
    const country = findCountry(c.code);
    const climate = CITY_CLIMATE[c.slug];
    if (!country || !climate) return [];
    const reliable = hasReliableClimate(c.slug);
    return [
      {
        code: c.code,
        slug: c.slug,
        name: isAr ? c.nameAr : c.nameEn,
        countryName: isAr ? country.nameAr : country.nameEn,
        continent: country.continent,
        photo: photos.get(`${c.code}/${c.slug}`),
        high: climate.high,
        rainyDays: climate.rainyDays,
        kind: months.map((m) => seasonKindFor(c.slug, m) ?? "spring"),
        inSeason: months.map((m) => reliable && isInSeason(climate, m)),
        reliable,
      },
    ];
  });

  const month = new Date().getMonth() + 1;

  return (
    <div>
      <PageHero {...hero} eyebrow={monthName(month, loc)} title={dict.seasons.title} subtitle={dict.seasons.subtitle} />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <CitySeasons
          locale={loc}
          cities={cities}
          currentMonth={month}
          dict={{
            ...d,
            monthNames: [...d.monthNames],
            kinds: { ...d.kinds },
            allContinents: dict.filters.allContinents,
            continents: dict.attractions.continents,
          }}
        />
      </div>
    </div>
  );
}
