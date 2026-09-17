import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import {findCountry} from "@/lib/countries";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { fetchArabicTitlesByTitle, fetchWikiSummaries, fetchWikiSummary } from "@/lib/wikipedia";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchCityOverviews } from "@/lib/mapPins";
import { cityCountLabel, countLabel, placeCountLabel } from "@/lib/format";
import CityGallery, { type CityCard } from "@/components/CityGallery";
import VisaBadge from "@/components/VisaBadge";
import VisaWarning from "@/components/VisaWarning";
import { fetchVisaRequirements, VISA_SOURCE_URL, type VisaCategory } from "@/lib/visa";
import { directVisaUrl, officialVisaUrl } from "@/lib/visaProviders";
import PageHero from "@/components/ui/PageHero";
import SectionHeading from "@/components/ui/SectionHeading";
import { pageMetadata, absoluteUrl, touristDestinationJsonLd } from "@/lib/seo";
import CountryQuickFacts, { type QuickFact } from "@/components/CountryQuickFacts";
import { currencyForCountry } from "@/lib/currencies";
import { COUNTRY_CENTROIDS } from "@/lib/countryCentroids";

/**
 * A title that says which country.
 *
 * Every page on the site used to share one title, so a link shared in a
 * message said nothing about what was behind it — which on a site whose
 * growth depends on someone sending a friend a destination is the whole
 * game.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/attractions/[code]">): Promise<Metadata> {
  const { locale, code } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);
  const country = findCountry(code);
  if (!country) return {};

  const name = loc === "ar" ? country.nameAr : country.nameEn;
  const cities = COUNTRY_CITIES[country.code] ?? [];
  return pageMetadata({
    locale: loc,
    path: `/attractions/${country.code}`,
    title: dict.attractions.metaCountryTitle.replace("{country}", name),
    description: dict.attractions.metaCountryDescription
      .replace("{country}", name)
      .replace("{cities}", String(cities.length)),
  });
}

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

  /**
   * The quick-facts row.
   *
   * Assembled only from data this page already has or the site already
   * holds. Anything we cannot answer is omitted — a country page with three
   * facts on it is more useful than one with five where two are guesses.
   */
  const currency = currencyForCountry(country.code);
  const quickFacts: QuickFact[] = [];

  if (visaEntry) {
    quickFacts.push({
      icon: "🛂",
      label: dict.attractions.factVisa,
      value: visaLabels[visaEntry.category],
      href: `/${loc}/visa/${country.code}`,
      visa: visaEntry.category,
    });
  }
  if (guide) {
    quickFacts.push({
      icon: "🗓️",
      label: dict.attractions.factBestMonths,
      value: loc === "ar" ? guide.bestMonthsAr : guide.bestMonthsEn,
    });
  }
  if (currency) {
    quickFacts.push({
      icon: "💱",
      label: dict.attractions.factCurrency,
      value: `${loc === "ar" ? currency.nameAr : currency.nameEn} (${currency.code})`,
      href: `/${loc}/currency`,
    });
  }
  {
    // Roughly how long the flight is from Riyadh. A great-circle distance at
    // a typical cruise speed, rounded to the half hour and labelled
    // "about" — precise enough to tell a weekend break from a long haul,
    // which is the decision it informs, and not presented as a schedule.
    const from = { lat: 24.7136, lon: 46.6753 };
    const to = COUNTRY_CENTROIDS[country.code];
    if (to) {
      const R = 6371;
      const dLat = ((to.lat - from.lat) * Math.PI) / 180;
      const dLon = ((to.lon - from.lon) * Math.PI) / 180;
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((from.lat * Math.PI) / 180) *
          Math.cos((to.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const km = R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
      if (km > 200) {
        const hours = Math.round((km / 800 + 0.5) * 2) / 2;
        quickFacts.push({
          icon: "✈️",
          label: dict.attractions.factFlightTime,
          // Half-hours round to the nearest whole for the label, since
          // "about 3.5 hours" implies a precision a great-circle estimate
          // does not have.
          value: countLabel(Math.round(hours), {
            one: dict.attractions.factFlightOne,
            two: dict.attractions.factFlightTwo,
            few: dict.attractions.factFlightFew,
            many: dict.attractions.factFlightMany,
          }),
        });
      }
    }
  }
  if (cities.length > 0) {
    quickFacts.push({
      icon: "🏙️",
      label: dict.attractions.factCities,
      value: cityCountLabel(cities.length, dict.maps),
    });
  }

  const jsonLd = touristDestinationJsonLd({
    name: loc === "ar" ? country.nameAr : country.nameEn,
    description: countrySummary?.extract,
    url: absoluteUrl(`/${loc}/attractions/${country.code}`),
    image: heroPhoto,
    country: loc === "ar" ? country.nameAr : country.nameEn,
  });

  return (
    <div>
      {/* Structured data carries only what we actually know — Google treats
          invented markup as a reason to distrust the rest of the page. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
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
        <CountryQuickFacts
          locale={loc}
          facts={quickFacts}
          heading={dict.attractions.quickFactsHeading}
        />

        {/* Wikipedia's own opening paragraph, kept but demoted. For Türkiye
            it is about land borders and population share — true, and not
            what someone deciding on a holiday came for. Two lines and a
            "read more", below the facts that are. */}
        {countrySummary?.extract && (
          <details className="mb-8 rounded-2xl bg-white px-4 py-3.5 shadow-[var(--shadow-card)] ring-1 ring-navy-950/5">
            <summary className="cursor-pointer text-sm font-bold text-navy-800">
              {dict.attractions.aboutCountry.replace(
                "{country}",
                loc === "ar" ? country.nameAr : country.nameEn
              )}
            </summary>
            <p className="mt-2.5 text-sm leading-relaxed text-navy-600">{countrySummary.extract}</p>
            <p className="mt-2 text-xs text-navy-300">{dict.attractions.source}</p>
          </details>
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
              checkedAt: dict.visa.checkedAt,
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
