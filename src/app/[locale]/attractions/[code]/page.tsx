import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry, flagEmoji } from "@/lib/countries";
import { COUNTRY_GUIDES, viatorSearchUrl } from "@/lib/countryGuides";
import { fetchWikiSummaries, fetchWikiSummary } from "@/lib/wikipedia";
import { fetchCitiesForCountry, viatorConfigured } from "@/lib/viator";
import CountryGuideExplorer, { type GuideItem } from "@/components/CountryGuideExplorer";
import CityPicker from "@/components/CityPicker";

export default async function CountryAttractionsPage({
  params,
}: PageProps<"/[locale]/attractions/[code]">) {
  const { locale, code } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const country = findCountry(code);
  if (!country) notFound();

  const guide = COUNTRY_GUIDES[country.code];

  // Collect every wikiTitle this page needs (country + all three
  // categories) and resolve them together, so we make one batch of live
  // Wikipedia calls instead of fetching serially per section.
  const activityTitles = (guide?.activities ?? []).map((a) => a.wikiTitle).filter((t): t is string => Boolean(t));
  const cuisineTitles = (guide?.cuisine ?? []).map((c) => c.wikiTitle).filter((t): t is string => Boolean(t));
  const landmarkTitles = (guide?.attractions ?? []).map((a) => a.wikiTitle);

  const [countrySummary, summaries, cities] = await Promise.all([
    fetchWikiSummary(country.nameEn),
    fetchWikiSummaries([...landmarkTitles, ...activityTitles, ...cuisineTitles]),
    // Empty (and instant) when no Viator key is configured — the curated
    // guide below then stands on its own exactly as before.
    fetchCitiesForCountry(country.code),
  ]);

  // Real bookable items (official tickets / guided tours) get a genuine
  // outbound link to search results on an actual global tour marketplace —
  // the visitor books directly there, iTravel is never in that flow. Items
  // that are free or arranged by phone/on arrival have nothing to "book"
  // through a third party, so they get no link.
  const bookableViator = (nameEn: string, booking: string) =>
    booking === "official" || booking === "guide" ? viatorSearchUrl(`${nameEn} ${country.nameEn}`) : undefined;

  const attractionItems: GuideItem[] = (guide?.attractions ?? []).map((landmark) => {
    const summary = summaries.get(landmark.wikiTitle);
    return {
      key: landmark.wikiTitle,
      nameAr: landmark.nameAr,
      nameEn: landmark.nameEn,
      photo: summary?.thumbnail,
      extract: summary?.extract,
      booking: landmark.booking,
      bookingUrl: bookableViator(landmark.nameEn, landmark.booking),
    };
  });

  const activityItems: GuideItem[] = (guide?.activities ?? []).map((activity, i) => {
    const summary = activity.wikiTitle ? summaries.get(activity.wikiTitle) : undefined;
    return {
      key: activity.wikiTitle || `${activity.nameEn}-${i}`,
      nameAr: activity.nameAr,
      nameEn: activity.nameEn,
      emoji: activity.emoji,
      photo: summary?.thumbnail,
      extract: summary?.extract,
      booking: activity.booking,
      costTier: activity.costTier,
      bookingUrl: bookableViator(activity.nameEn, activity.booking),
    };
  });

  const cuisineItems: GuideItem[] = (guide?.cuisine ?? []).map((dish, i) => {
    const summary = dish.wikiTitle ? summaries.get(dish.wikiTitle) : undefined;
    return {
      key: dish.wikiTitle || `${dish.nameEn}-${i}`,
      nameAr: dish.nameAr,
      nameEn: dish.nameEn,
      emoji: dish.emoji,
      photo: summary?.thumbnail,
      extract: summary?.extract,
    };
  });

  // TripAdvisor-style destination header: a real photo of the country's
  // best-known attraction as the hero, falling back to the general country
  // photo, and finally to a plain gradient if neither resolved.
  const heroPhoto = attractionItems.find((a) => a.photo)?.photo || countrySummary?.thumbnail;

  return (
    <div>
      <div className="relative h-56 sm:h-72 overflow-hidden">
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900 to-brand-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        <div className="relative mx-auto max-w-5xl h-full px-4 sm:px-6 flex flex-col justify-end pb-6">
          <Link
            href={`/${loc}/attractions`}
            className="mb-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white transition"
          >
            {loc === "ar" ? "→" : "←"} {dict.attractions.backToCountries}
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-4xl leading-none">{flagEmoji(country.code)}</span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-sm">
              {loc === "ar" ? country.nameAr : country.nameEn}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {countrySummary?.extract && (
          <p className="text-gray-600 leading-relaxed text-sm mb-1">{countrySummary.extract}</p>
        )}
        {countrySummary?.extract && <p className="text-xs text-gray-400 mb-6">{dict.attractions.source}</p>}

        {cities.length > 0 && (
          <CityPicker locale={loc} countryCode={country.code} cities={cities} dict={dict.attractions} />
        )}

        {!viatorConfigured() && (
          <div className="mb-8 rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <h2 className="font-bold text-amber-900">{dict.attractions.viatorDisabledTitle}</h2>
            <p className="mt-1.5 text-sm text-amber-800 leading-relaxed">{dict.attractions.viatorDisabledBody}</p>
          </div>
        )}

        {guide ? (
          <div className={countrySummary?.extract ? "" : "mt-2"}>
            <div className="rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100 flex items-center gap-2 text-brand-900 text-sm font-semibold mb-6">
              🗓️ {dict.attractions.bestMonths}: {loc === "ar" ? guide.bestMonthsAr : guide.bestMonthsEn}
            </div>

            <CountryGuideExplorer
              locale={loc}
              dict={dict.attractions}
              attractions={attractionItems}
              activities={activityItems}
              cuisine={cuisineItems}
            />
          </div>
        ) : (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <h2 className="font-bold text-amber-900">{dict.attractions.comingSoonTitle}</h2>
            <p className="mt-1.5 text-sm text-amber-800 leading-relaxed">{dict.attractions.comingSoonBody}</p>
          </div>
        )}
      </div>
    </div>
  );
}
