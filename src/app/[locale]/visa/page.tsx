import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/types";
import { COUNTRIES } from "@/lib/countries";
import VisaWarning from "@/components/VisaWarning";
import VisaDirectory, { type VisaCountry } from "@/components/VisaDirectory";
import { applicableCountryCodes } from "@/lib/visaProviders";
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

// An index into the country pages. The site states no visa status (see
// visaProviders.ts), so there is nothing to count or filter by — only a
// search, and a note on the cards where we hold a verified application link.
export default async function VisaPage({ params }: PageProps<"/[locale]/visa">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const hero = await sectionHero("visa", loc);

  // Saudi Arabia itself is dropped: "can a Saudi passport enter Saudi Arabia"
  // is not a question.
  const applySet = new Set(applicableCountryCodes());
  const directory: VisaCountry[] = COUNTRIES.filter((c) => c.code !== "SA").map((country) => ({
    code: country.code,
    nameAr: country.nameAr,
    nameEn: country.nameEn,
    continent: country.continent,
    canApply: applySet.has(country.code),
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
            canApply: dict.visa.canApply,
            continents: dict.attractions.continents,
          }}
        />
        <p className="mt-4 text-xs text-gray-500">{dict.visa.applyExternalNote}</p>
      </div>
    </div>
  );
}
