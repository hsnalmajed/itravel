import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry } from "@/lib/countries";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchCityOverviews } from "@/lib/mapPins";
import { fetchCountryPhotos } from "@/lib/countryPhotos";
import { cityCountLabel, countLabel, placeCountLabel } from "@/lib/format";
import CityGallery, { type CityCard } from "@/components/CityGallery";
import VisaWarning from "@/components/VisaWarning";
import VisaOfficialLinks from "@/components/VisaOfficialLinks";
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
  const cities = COUNTRY_CITIES[country.code] ?? [];

  const [photos, cityOverviews] = await Promise.all([
    // Full resolution: this one photo is the full-width hero, not a card.
    fetchCountryPhotos([country.code], { full: true }),
    // A photo and a real place count for every city, so the visitor can see
    // what's behind a card before opening it.
    fetchCityOverviews(cities),
  ]);

  const cityCards: CityCard[] = cities.map((c) => {
    const overview = cityOverviews.get(c.slug);
    return {
      slug: c.slug,
      name: loc === "ar" ? c.nameAr : c.nameEn,
      photo: overview?.photo,
      subtitle: overview?.count
        ? placeCountLabel(overview.count, dict.attractions)
        : undefined,
    };
  });

  // The country's photo as the hero, or the hero's own gradient if none
  // resolved.
  const heroPhoto = photos.get(country.code);

  /**
   * The quick-facts row.
   *
   * Assembled only from data this page already has or the site already
   * holds. Anything we cannot answer is omitted — a country page with three
   * facts on it is more useful than one with five where two are guesses.
   */
  const currency = currencyForCountry(country.code);
  const quickFacts: QuickFact[] = [];

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

        {/* Entry requirements belong on the page where someone is deciding
            whether this country is even possible for them. We state no
            status of our own — only where to check and where to apply. */}
        <section className="mb-8">
          <SectionHeading
            title={dict.visa.headingForCountry.replace(
              "{country}",
              loc === "ar" ? country.nameAr : country.nameEn
            )}
          />

          <VisaWarning
            dict={{
              warningTitle: dict.visa.warningTitle,
              warningBody: dict.visa.warningBody,
              checkIata: dict.visa.checkIata,
              checkMofa: dict.visa.checkMofa,
            }}
            showLinks={false}
          />

          <div className="mt-4">
            <VisaOfficialLinks countryCode={country.code} locale={loc} showChecklist={false} />
          </div>

          <Link
            href={`/${loc}/visa/${country.code}`}
            className="mt-3 inline-block text-xs font-bold text-brand-700 hover:underline"
          >
            {dict.visa.openDetails} {loc === "ar" ? "←" : "→"}
          </Link>
        </section>
      </div>
    </div>
  );
}
