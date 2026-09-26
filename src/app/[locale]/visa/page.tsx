import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";
import VisaWarning from "@/components/VisaWarning";
import VisaDirectory, { type VisaCountry } from "@/components/VisaDirectory";
import { directVisaUrl, officialVisaUrl } from "@/lib/visaProviders";
import { fetchCountryPhotos } from "@/lib/countryPhotos";
import PageHero from "@/components/ui/PageHero";
import SectionHeading from "@/components/ui/SectionHeading";
import { sectionHero } from "@/lib/sectionHero";

// Rendered per request so the hero photo lookup never runs at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/visa">): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);
  return pageMetadata({
    locale: loc,
    path: "/visa",
    title: dict.visa.title,
    description: dict.visa.subtitle,
  });
}

// The countries we hold a verified place to apply for — the country's own
// visa portal, or its page on Direct — each with a photograph behind its
// flag. The site states no visa status (see visaProviders.ts), so the filter
// is by where you apply, not by what the rule is.
export default async function VisaPage({ params }: PageProps<"/[locale]/visa">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  // Saudi Arabia itself is dropped: "can a Saudi passport enter Saudi Arabia"
  // is not a question.
  const listed = COUNTRIES.filter(
    (c) => c.code !== "SA" && (officialVisaUrl(c.code) || directVisaUrl(c.code, loc))
  );

  const [hero, photos] = await Promise.all([
    sectionHero("visa", loc),
    fetchCountryPhotos(listed.map((c) => c.code)),
  ]);

  const directory: VisaCountry[] = listed.map((country) => ({
    code: country.code,
    nameAr: country.nameAr,
    nameEn: country.nameEn,
    continent: country.continent,
    photo: photos.get(country.code),
    official: Boolean(officialVisaUrl(country.code)),
    direct: Boolean(directVisaUrl(country.code, loc)),
  }));

  return (
    <div>
      <PageHero
        {...hero}
        eyebrow={dict.visa.forSaudiPassports}
        title={dict.visa.title}
        subtitle={dict.visa.subtitle}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="mb-8">
          <VisaWarning
            dict={{
              warningTitle: dict.visa.warningTitle,
              warningBody: dict.visa.warningBody,
              checkIata: dict.visa.checkIata,
              checkMofa: dict.visa.checkMofa,
            }}
            scope={dict.visa.onlySaudi}
          />
        </div>

        <SectionHeading title={dict.visa.directoryHeading} subtitle={dict.visa.directorySubtitle} />

        <VisaDirectory
          locale={loc}
          countries={directory}
          dict={{
            searchPlaceholder: dict.visa.searchPlaceholder,
            countriesCount: dict.visa.countriesCount,
            noResults: dict.visa.noResults,
            continents: dict.attractions.continents,
            badgeOfficial: dict.visa.badgeOfficial,
            badgeDirect: dict.visa.badgeDirect,
            routeFilterLabel: dict.visa.routeFilterLabel,
            routeAll: dict.visa.routeAll,
            routeOfficial: dict.visa.routeOfficial,
            routeDirect: dict.visa.routeDirect,
            routeBoth: dict.visa.routeBoth,
          }}
        />
        <p className="mt-4 text-xs text-navy-500">{dict.visa.directoryOnlyVerified}</p>
        <p className="mt-1 text-xs text-navy-500">{dict.visa.applyExternalNote}</p>
      </div>
    </div>
  );
}
