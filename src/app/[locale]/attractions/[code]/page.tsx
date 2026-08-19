import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry, flagEmoji } from "@/lib/countries";
import { BOOKING_HINTS, COUNTRY_GUIDES } from "@/lib/countryGuides";
import { fetchWikiSummaries, fetchWikiSummary } from "@/lib/wikipedia";

export default async function CountryAttractionsPage({
  params,
}: PageProps<"/[locale]/attractions/[code]">) {
  const { locale, code } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const country = findCountry(code);
  if (!country) notFound();

  const guide = COUNTRY_GUIDES[country.code];
  const countrySummary = await fetchWikiSummary(country.nameEn);

  const landmarkSummaries = guide
    ? await fetchWikiSummaries(guide.attractions.map((a) => a.wikiTitle))
    : new Map();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <Link href={`/${loc}/attractions`} className="text-sm font-semibold text-brand-700 hover:text-brand-900 transition">
        {loc === "ar" ? "→" : "←"} {dict.attractions.backToCountries}
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-4xl leading-none">{flagEmoji(country.code)}</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          {loc === "ar" ? country.nameAr : country.nameEn}
        </h1>
      </div>

      {/* Country-level photo + summary, live from Wikipedia */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {countrySummary?.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={countrySummary.thumbnail} alt={country.nameEn} className="h-56 sm:h-72 w-full object-cover" />
        ) : (
          <div className="h-40 w-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
            {dict.attractions.photoUnavailable}
          </div>
        )}
        {countrySummary?.extract && (
          <div className="p-5">
            <p className="text-gray-700 leading-relaxed text-sm">{countrySummary.extract}</p>
            <p className="mt-2 text-xs text-gray-400">{dict.attractions.source}</p>
          </div>
        )}
      </div>

      {guide ? (
        <div className="mt-8 space-y-8">
          <div className="rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100 flex items-center gap-2 text-brand-900 text-sm font-semibold">
            🗓️ {dict.attractions.bestMonths}: {loc === "ar" ? guide.bestMonthsAr : guide.bestMonthsEn}
          </div>

          {/* Attractions */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{dict.attractions.attractionsHeading}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {guide.attractions.map((landmark) => {
                const summary = landmarkSummaries.get(landmark.wikiTitle);
                return (
                  <div key={landmark.wikiTitle} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                    {summary?.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={summary.thumbnail}
                        alt={loc === "ar" ? landmark.nameAr : landmark.nameEn}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="h-28 w-full flex items-center justify-center bg-gray-50 text-gray-400 text-xs">
                        {dict.attractions.photoUnavailable}
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900">{loc === "ar" ? landmark.nameAr : landmark.nameEn}</h3>
                      {summary?.extract && (
                        <p className="mt-1.5 text-sm text-gray-600 leading-relaxed line-clamp-4">{summary.extract}</p>
                      )}
                      <p className="mt-2.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-2">
                        <span className="font-semibold text-gray-700">{dict.attractions.howToBook}: </span>
                        {BOOKING_HINTS[landmark.booking][loc]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Activities */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{dict.attractions.activitiesHeading}</h2>
            <div className="flex flex-wrap gap-2.5">
              {guide.activities.map((tag) => (
                <span
                  key={tag.nameEn}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/5"
                >
                  <span>{tag.emoji}</span>
                  {loc === "ar" ? tag.nameAr : tag.nameEn}
                </span>
              ))}
            </div>
          </section>

          {/* Cuisine */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{dict.attractions.cuisineHeading}</h2>
            <div className="flex flex-wrap gap-2.5">
              {guide.cuisine.map((tag) => (
                <span
                  key={tag.nameEn}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-black/5"
                >
                  <span>{tag.emoji}</span>
                  {loc === "ar" ? tag.nameAr : tag.nameEn}
                </span>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl bg-amber-50 border border-amber-200 p-5">
          <h2 className="font-bold text-amber-900">{dict.attractions.comingSoonTitle}</h2>
          <p className="mt-1.5 text-sm text-amber-800 leading-relaxed">{dict.attractions.comingSoonBody}</p>
        </div>
      )}
    </div>
  );
}
