import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry } from "@/lib/countries";
import { flagImageUrl } from "@/lib/visaProviders";
import { fetchCountryPhotos } from "@/lib/countryPhotos";
import VisaWarning from "@/components/VisaWarning";
import VisaOfficialLinks from "@/components/VisaOfficialLinks";
import PageHero from "@/components/ui/PageHero";

export const dynamic = "force-dynamic";

// One country, and where to go to find out about entering it.
//
// We state no visa status here — see visaProviders.ts for why. The page is
// the warning, then the official links (IATA, the Saudi foreign ministry, the
// country's own portal where we have a verified one), then a typical
// checklist in the two cases where we know which one applies.
export default async function VisaCountryPage({ params }: PageProps<"/[locale]/visa/[code]">) {
  const { locale, code } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const country = findCountry(code);
  if (!country) notFound();

  // Full resolution: this one photo is a full-width hero, not a card.
  const photos = await fetchCountryPhotos([country.code], { full: true });
  const countryName = loc === "ar" ? country.nameAr : country.nameEn;

  return (
    <div>
      <PageHero
        photo={photos.get(country.code)}
        size="sm"
        eyebrow={dict.visa.title}
        title={dict.visa.headingForCountry.replace("{country}", countryName)}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/${loc}/visa`} className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20">
            {loc === "ar" ? "→" : "←"} {dict.visa.backToVisa}
          </Link>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={flagImageUrl(country.code)} alt="" className="h-full w-full object-cover" />
          </span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <VisaWarning
          dict={{
            warningTitle: dict.visa.warningTitle,
            warningBody: dict.visa.warningBody,
            checkIata: dict.visa.checkIata,
            checkMofa: dict.visa.checkMofa,
          }}
          scope={dict.visa.onlySaudi}
          showLinks={false}
        />

        <div className="mt-6">
          <VisaOfficialLinks countryCode={country.code} locale={loc} />
        </div>
      </div>
    </div>
  );
}
