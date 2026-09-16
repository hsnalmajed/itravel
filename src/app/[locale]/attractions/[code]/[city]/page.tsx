import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import {findCountry} from "@/lib/countries";
import { findCity } from "@/lib/cities";
import { fetchPlacesAroundCities } from "@/lib/mapPins";
import { fetchCityHighlights } from "@/lib/guideHighlights";
import { placeCountLabel } from "@/lib/format";
import { BOOKING_SHORT_LABELS } from "@/lib/countryGuides";
import { fetchWikiSummary } from "@/lib/wikipedia";
import { fetchCitiesForCountry, fetchToursForCity } from "@/lib/viator";
import { type PlaceListItem } from "@/components/CityPlacesExplorer";
import CityPlacesPlanner from "@/components/CityPlacesPlanner";
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
/**
 * Only a relative path on this site is allowed back.
 *
 * `back` arrives in the query string, which anyone can write, so it is checked
 * rather than trusted: one leading slash and no second one rules out
 * "//evil.example" and every absolute URL.
 */
function safeBackHref(raw: string | string[] | undefined): string | undefined {
  if (typeof raw !== "string") return undefined;
  if (!raw.startsWith("/") || raw.startsWith("//")) return undefined;
  return raw;
}

export default async function CityPlacesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/attractions/[code]/[city]">) {
  const { locale, code, city } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  // Someone who arrived from their own search is mid-decision, and this page
  // is about their destination — so the way back to their results comes with
  // them, and nothing about the page itself changes for anyone else.
  const backToResults = safeBackHref((await searchParams).back);

  const country = findCountry(code);
  if (!country) notFound();

  const cityEntry = findCity(country.code, city);
  if (!cityEntry) notFound();

  const [places, citySummary, viatorCities, highlights] = await Promise.all([
    fetchPlacesAroundCities([cityEntry], { locale: loc, withPhotos: true }),
    fetchWikiSummary(cityEntry.wikiTitle),
    // Empty (and instant) with no Viator key configured, so the guide below
    // stands on its own until one is added.
    fetchCitiesForCountry(country.code),
    // The country's hand-checked landmarks that actually sit in this city —
    // see guideHighlights.ts for why they now live here rather than a level up.
    fetchCityHighlights(country.code, cityEntry),
  ]);

  // Keyed by English article title, which is the one name both sides share.
  const highlightByTitle = new Map(highlights.map((h) => [h.landmark.wikiTitle, h]));
  const bookingLabelFor = (enTitle: string) => {
    const hit = highlightByTitle.get(enTitle);
    return hit ? BOOKING_SHORT_LABELS[hit.landmark.booking][loc] : undefined;
  };

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
      bookingLabel: bookingLabelFor(p.enTitle),
    };
  });

  // A curated landmark that geosearch missed still belongs on its city's
  // page — Diriyah is fifteen kilometres out of Riyadh and every traveller
  // calls it Riyadh's. Added from its own article rather than dropped.
  const covered = new Set(places.map((p) => p.enTitle));
  for (const h of highlights) {
    if (covered.has(h.landmark.wikiTitle)) continue;
    items.push({
      key: `guide-${h.landmark.wikiTitle}`,
      name: loc === "ar" ? h.landmark.nameAr : h.landmark.nameEn,
      description: h.extract,
      photo: h.photo,
      category: "historic",
      wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(
        h.landmark.wikiTitle.replace(/ /g, "_")
      )}`,
      // The names here are our own, written in both languages, so nothing is
      // being shown in a language the reader didn't ask for.
      englishOnly: false,
      bookingLabel: BOOKING_SHORT_LABELS[h.landmark.booking][loc],
    });
  }

  // The curated landmarks first, in each category. They are the ones somebody
  // checked by hand, and they are what a visitor came to this city for — they
  // should not be on page three of an alphabet of three hundred places.
  items.sort((a, b) => Number(Boolean(b.bookingLabel)) - Number(Boolean(a.bookingLabel)));

  const cityName = loc === "ar" ? cityEntry.nameAr : cityEntry.nameEn;

  return (
    <div>
      <PageHero
        photo={citySummary?.image}
        size="sm"
        eyebrow={loc === "ar" ? country.nameAr : country.nameEn}
        title={dict.attractions.cityPlacesTitle.replace("{city}", cityName)}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Their own results first, when that is where they came from. */}
          {backToResults && (
            <Link
              href={backToResults}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sun-400 px-3.5 py-2 text-sm font-bold text-navy-950 shadow-sm transition hover:bg-sun-300"
            >
              <span aria-hidden="true">{loc === "ar" ? "→" : "←"}</span>
              {dict.itinerary.backToResults}
            </Link>
          )}
          <Link
            href={`/${loc}/attractions/${country.code}`}
            className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20"
          >
            <span aria-hidden="true">{loc === "ar" ? "→" : "←"}</span>
            {dict.attractions.backToCities}
          </Link>
        </div>
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
                📍 {placeCountLabel(items.length, dict.attractions)}
              </p>
              <Link
                href={`/${loc}/maps/${country.code}/${cityEntry.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                🗺️ {dict.attractions.viewOnMap}
              </Link>
            </div>

            <CityPlacesPlanner
              locale={loc}
              places={items}
              cityName={cityName}
              countryCode={country.code}
              countryName={loc === "ar" ? country.nameAr : country.nameEn}
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
