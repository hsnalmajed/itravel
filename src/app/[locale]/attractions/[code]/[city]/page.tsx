import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import {findCountry} from "@/lib/countries";
import { findCity } from "@/lib/cities";
import { fetchPlacesAroundCities } from "@/lib/mapPins";
import { fetchWikiSummary } from "@/lib/wikipedia";
import { fetchCitiesForCountry, fetchToursForCity } from "@/lib/viator";
import CityPlacesExplorer, { type PlaceListItem } from "@/components/CityPlacesExplorer";
import TourCard from "@/components/TourCard";
import PageHero from "@/components/ui/PageHero";
import SectionHeading from "@/components/ui/SectionHeading";

// Live Wikipedia lookups per request, so a newly-documented place shows up
// without a redeploy.
export const dynamic = "force-dynamic";

// The same places the city's map shows, as a list you can read.
//
// The map answers "where is it"; this page answers "what is it and is it
// worth my afternoon" — a photo, a name, and what Wikipedia says it is, in
// the reader's own language, split into the three sections the site has
// always used.
export default async function CityPlacesPage({
  params,
}: PageProps<"/[locale]/attractions/[code]/[city]">) {
  const { locale, code, city } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const country = findCountry(code);
  if (!country) notFound();

  const cityEntry = findCity(country.code, city);
  if (!cityEntry) notFound();

  const [places, citySummary, viatorCities] = await Promise.all([
    fetchPlacesAroundCities([cityEntry], { locale: loc, withPhotos: true }),
    fetchWikiSummary(cityEntry.wikiTitle),
    // Empty (and instant) with no Viator key configured, so the guide below
    // stands on its own until one is added.
    fetchCitiesForCountry(country.code),
  ]);

  // Viator names its destinations in English, same as our `nameEn`, so an
  // exact case-insensitive match is a safe join. Anything short of an exact
  // match is left unmatched rather than guessed — showing Ankara's tours on
  // Istanbul's page would be worse than showing none.
  const viatorCity = viatorCities.find(
    (c) => c.name.trim().toLowerCase() === cityEntry.nameEn.trim().toLowerCase()
  );
  const tours = viatorCity
    ? (await fetchToursForCity(viatorCity.id, { count: 12, currency: "USD" })).tours
    : [];

  const items: PlaceListItem[] = places.map((p) => {
    // Link to the article the name and description actually came from, so
    // "read more" never lands the reader on a different language than the
    // card they tapped.
    const lang = p.englishOnly || loc === "en" ? "en" : "ar";
    const title = lang === "ar" ? (p.arTitle as string) : p.enTitle;
    return {
      key: String(p.pageId),
      name: p.name,
      description: p.description,
      photo: p.photo,
      category: p.category,
      wikiUrl: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      englishOnly: p.englishOnly,
    };
  });

  const cityName = loc === "ar" ? cityEntry.nameAr : cityEntry.nameEn;

  return (
    <div>
      <PageHero
        photo={citySummary?.image}
        size="sm"
        eyebrow={loc === "ar" ? country.nameAr : country.nameEn}
        title={dict.attractions.cityPlacesTitle.replace("{city}", cityName)}
      >
        <Link href={`/${loc}/attractions/${country.code}`} className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20">
          {loc === "ar" ? "→" : "←"} {dict.attractions.backToCities}
        </Link>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        {tours.length > 0 && (
          <section className="mb-10">
            <SectionHeading title={dict.attractions.toursHeading} />
            <div className="flex flex-col gap-4">
              {tours.map((tour) => (
                <TourCard key={tour.code} tour={tour} locale={loc} dict={dict.attractions} />
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
              {dict.attractions.contentSourceNote}
            </p>
          </section>
        )}

        {items.length === 0 ? (
          <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-5 text-sm text-amber-800 leading-relaxed">
            {dict.attractions.noPlacesInCity}
          </p>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                📍 {dict.attractions.placesCount.replace("{count}", String(items.length))}
              </p>
              <Link
                href={`/${loc}/maps/${country.code}/${cityEntry.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                🗺️ {dict.attractions.viewOnMap}
              </Link>
            </div>

            <CityPlacesExplorer
              places={items}
              dict={{
                attractionsHeading: dict.attractions.attractionsHeading,
                activitiesHeading: dict.attractions.activitiesHeading,
                cuisineHeading: dict.attractions.cuisineHeading,
                otherHeading: dict.attractions.otherHeading,
                placesCount: dict.attractions.placesCount,
                emptyCategory: dict.attractions.emptyCategory,
                englishOnly: dict.attractions.englishOnly,
                readMoreWiki: dict.attractions.readMoreWiki,
                loadMore: dict.attractions.loadMore,
                searchPlaceholder: dict.attractions.placeSearchPlaceholder,
              }}
            />

            <p className="mt-6 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
              {dict.attractions.source}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
