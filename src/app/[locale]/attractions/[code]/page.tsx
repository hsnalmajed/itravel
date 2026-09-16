import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import {findCountry} from "@/lib/countries";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { fetchArabicTitlesByTitle, fetchWikiSummaries, fetchWikiSummary } from "@/lib/wikipedia";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchCityOverviews } from "@/lib/mapPins";
import { cityCountLabel, placeCountLabel } from "@/lib/format";
import CityGallery, { type CityCard } from "@/components/CityGallery";
import VisaBadge from "@/components/VisaBadge";
import VisaWarning from "@/components/VisaWarning";
import { fetchVisaRequirements, VISA_SOURCE_URL, type VisaCategory } from "@/lib/visa";
import { directVisaUrl, officialVisaUrl } from "@/lib/visaProviders";
import PageHero from "@/components/ui/PageHero";
import SectionHeading from "@/components/ui/SectionHeading";

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

  const cities = COUNTRY_CITIES[country.code] ?? [];
  const guideTitles = [...landmarkTitles, ...activityTitles, ...cuisineTitles];

  // For an Arabic reader, everything on this page that has an Arabic article
  // should come from that article. Wikipedia's own interlanguage links tell
  // us which English article maps to which Arabic one — we never translate a
  // name or a description ourselves.
  const arTitles =
    loc === "ar"
      ? await fetchArabicTitlesByTitle([country.nameEn, ...guideTitles])
      : new Map<string, string>();

  const countryArTitle = arTitles.get(country.nameEn);

  const [countrySummary, enSummaries, arSummaries, cityOverviews, visaData] = await Promise.all([
    countryArTitle
      ? fetchWikiSummary(countryArTitle, "ar")
      : fetchWikiSummary(country.nameEn),
    fetchWikiSummaries(guideTitles),
    fetchWikiSummaries([...arTitles.values()].filter((t) => t !== countryArTitle), "ar"),
    // A photo and a real place count for every city, so the visitor can see
    // what's behind a card before opening it.
    fetchCityOverviews(cities),
    fetchVisaRequirements(),
  ]);

  // Entry requirements belong here, at the top of the page where someone is
  // deciding whether this country is even possible for them — not on a
  // separate page they'd have to know to visit.
  const visaEntry = visaData?.byCountry.get(country.code);
  const visaLabels: Record<VisaCategory, string> = {
    free: dict.visa.free,
    arrival: dict.visa.arrival,
    eta: dict.visa.eta,
    required: dict.visa.required,
    unknown: dict.visa.unknown,
  };
  const visaOfficialUrl = officialVisaUrl(country.code);
  const visaDirectUrl = directVisaUrl(country.code, loc);
  const visaHints: Record<VisaCategory, string> = {
    free: dict.visa.freeHint,
    arrival: dict.visa.arrivalHint,
    eta: dict.visa.etaHint,
    required: dict.visa.requiredHint,
    unknown: dict.visa.unknownHint,
  };

  // Arabic text where Wikipedia has an Arabic article; the English article
  // otherwise. The photo always comes from the English article, which is the
  // better-illustrated one and is language-neutral anyway.
  function summaryFor(title: string) {
    const en = enSummaries.get(title);
    const arTitle = arTitles.get(title);
    const ar = arTitle ? arSummaries.get(arTitle) : undefined;
    return {
      extract: ar?.extract || en?.extract,
      thumbnail: en?.thumbnail || ar?.thumbnail,
      image: en?.image || ar?.image,
    };
  }

  const cityCards: CityCard[] = cities.map((c) => {
    const overview = cityOverviews.get(c.wikiTitle);
    return {
      slug: c.slug,
      name: loc === "ar" ? c.nameAr : c.nameEn,
      photo: overview?.photo,
      subtitle: overview?.count
        ? placeCountLabel(overview.count, dict.attractions)
        : undefined,
    };
  });

  // TripAdvisor-style destination header: a real photo of the country's
  // best-known attraction as the hero, falling back to the general country
  // photo, and finally to a plain gradient if neither resolved.
  const heroLandmark = landmarkTitles.map((t) => summaryFor(t)).find((s) => s.image);
  const heroPhoto = heroLandmark?.image || countrySummary?.image;

  return (
    <div>
      <PageHero
        photo={heroPhoto}
        eyebrow={dict.attractions.title}
        title={loc === "ar" ? country.nameAr : country.nameEn}
      >
        <Link href={`/${loc}/attractions`} className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20">
          {loc === "ar" ? "→" : "←"} {dict.attractions.backToCountries}
        </Link>
      </PageHero>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {countrySummary?.extract && (
          <p className="mb-1 text-sm leading-relaxed text-navy-600">{countrySummary.extract}</p>
        )}
        {countrySummary?.extract && <p className="mb-6 text-xs text-navy-300">{dict.attractions.source}</p>}

        {guide && (
          <div className="mb-6 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100 flex items-center gap-2 text-brand-900 text-sm font-semibold">
            🗓️ {dict.attractions.bestMonths}: {loc === "ar" ? guide.bestMonthsAr : guide.bestMonthsEn}
          </div>
        )}

        {/* The one thing this page is for. A country has no attractions of its
            own — its cities do — so choosing one is the whole job, and it
            comes before anything else on the page. */}
        {cityCards.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-brand-900 mb-1 flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
              {dict.attractions.chooseCityTitle.replace(
                "{country}",
                loc === "ar" ? country.nameAr : country.nameEn
              )}
            </h2>
            <p className="text-sm font-semibold text-brand-700 ms-3">
              🏙️ {cityCountLabel(cities.length, dict.attractions)}
            </p>
            <p className="text-sm text-gray-500 mb-4 ms-3">{dict.attractions.chooseCitySubtitle}</p>
            <CityGallery cities={cityCards} hrefBase={`/${loc}/attractions/${country.code}`} />
          </section>
        )}

        {(visaEntry || visaOfficialUrl || visaDirectUrl) && (
          <section className="mb-8">
            <SectionHeading
              title={dict.visa.headingForCountry.replace(
                "{country}",
                loc === "ar" ? country.nameAr : country.nameEn
              )}
            />

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              {visaEntry ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <VisaBadge category={visaEntry.category} label={visaLabels[visaEntry.category]} />
                    {visaEntry.stay && (
                      <span className="text-sm font-semibold text-gray-600">
                        {dict.visa.allowedStay}: <span dir="ltr">{visaEntry.stay}</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {visaHints[visaEntry.category]}
                  </p>
                  {/* Verbatim from the source, so a two-route status is never
                      reduced to the badge alone. */}
                  <p className="mt-1 text-xs text-gray-400" dir="ltr">
                    {visaEntry.status}
                  </p>
                </>
              ) : (
                // The status source is unreachable, but where to apply is our
                // own verified data — so the buttons below still stand.
                <p className="text-sm leading-relaxed text-amber-800">{dict.visa.unavailable}</p>
              )}

              {(visaOfficialUrl || visaDirectUrl) && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  {visaOfficialUrl && (
                    <a
                      href={visaOfficialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
                    >
                      🏛 {dict.visa.applyOfficial} ↗
                    </a>
                  )}
                  {visaDirectUrl && (
                    <a
                      href={visaDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-xl bg-brand-800 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
                    >
                      📄 {dict.visa.applyDirect} ↗
                    </a>
                  )}
                </div>
              )}

              {visaOfficialUrl && (
                <p className="mt-2 text-xs leading-relaxed text-emerald-800">{dict.visa.officialNote}</p>
              )}

              <Link
                href={`/${loc}/visa`}
                className="mt-3 inline-block text-xs font-bold text-brand-700 hover:underline"
              >
                {dict.visa.seeAllRequirements} ←
              </Link>
            </div>

            <div className="mt-3">
              <VisaWarning
                dict={{
                  warningTitle: dict.visa.warningTitle,
                  warningBody: dict.visa.warningBody,
                  checkIata: dict.visa.checkIata,
                  checkMofa: dict.visa.checkMofa,
                  viewSource: dict.visa.viewSource,
                }}
                sourceUrl={VISA_SOURCE_URL}
              />
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
