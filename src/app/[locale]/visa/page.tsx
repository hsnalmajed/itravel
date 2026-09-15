import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { COUNTRIES, findCountry } from "@/lib/countries";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { fetchVisaRequirements, VISA_SOURCE_URL, type VisaCategory } from "@/lib/visa";
import VisaExplorer, { type VisaRow } from "@/components/VisaExplorer";
import VisaWarning from "@/components/VisaWarning";
import VisaApplyGrid, { type ApplyCountry } from "@/components/VisaApplyGrid";
import { applicableCountryCodes, directVisaUrl, officialVisaUrl } from "@/lib/visaProviders";
import { fetchCountryPhotos } from "@/lib/countryPhotos";
import PageHero from "@/components/ui/PageHero";
import SectionHeading from "@/components/ui/SectionHeading";
import { sectionHero } from "@/lib/sectionHero";

// Fetched per request behind a daily cache, never frozen into the build — a
// visa table baked into a deploy is stale the moment a rule changes.
export const dynamic = "force-dynamic";

export default async function VisaPage({ params }: PageProps<"/[locale]/visa">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  // The countries a traveller can actually act on, and a photo for each.
  const applyCodes = applicableCountryCodes().filter((code) => findCountry(code));
  // The hero goes first, on its own. This page makes more outbound lookups
  // than any other — the visa table plus a photo for every country a Saudi
  // traveller can apply to — and a Worker is allowed only so many per render.
  // Bundled in with the rest, the background was the request that lost, and
  // the page came up as a navy gradient.
  const hero = await sectionHero("visa", loc);
  const [data, applyPhotos] = await Promise.all([
    fetchVisaRequirements(),
    fetchCountryPhotos(applyCodes),
  ]);

  const applyCountries: ApplyCountry[] = applyCodes
    .map((code): ApplyCountry | null => {
      const country = findCountry(code);
      if (!country) return null;
      return {
        code,
        name: loc === "ar" ? country.nameAr : country.nameEn,
        photo: applyPhotos.get(code),
        category: data?.byCountry.get(code)?.category ?? "unknown",
        hasOfficial: Boolean(officialVisaUrl(code)),
        hasDirect: Boolean(directVisaUrl(code, loc)),
      };
    })
    .filter((c): c is ApplyCountry => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name, loc === "ar" ? "ar" : "en"));

  const labels: Record<VisaCategory, string> = {
    free: dict.visa.free,
    arrival: dict.visa.arrival,
    eta: dict.visa.eta,
    required: dict.visa.required,
    unknown: dict.visa.unknown,
  };

  const hints: Record<VisaCategory, string> = {
    free: dict.visa.freeHint,
    arrival: dict.visa.arrivalHint,
    eta: dict.visa.etaHint,
    required: dict.visa.requiredHint,
    unknown: dict.visa.unknownHint,
  };

  // Saudi Arabia itself is dropped: "can a Saudi passport enter Saudi Arabia"
  // is not a question, and the source doesn't list it either.
  const rows: VisaRow[] = data
    ? COUNTRIES.filter((c) => c.code !== "SA")
        .map((country): VisaRow | null => {
          const entry = data.byCountry.get(country.code);
          if (!entry) return null;
          return {
            code: country.code,
            nameAr: country.nameAr,
            nameEn: country.nameEn,
            continent: country.continent,
            category: entry.category,
            status: entry.status,
            stay: entry.stay,
            hasGuide: Boolean(COUNTRY_GUIDES[country.code]),
          };
        })
        .filter((r): r is VisaRow => r !== null)
    : [];

  const countBy = (cat: VisaCategory) => rows.filter((r) => r.category === cat).length;
  // Only shown when the table actually loaded — a row of zeroes would read
  // as "nowhere is visa-free" rather than "we could not check".
  const heroFacts =
    rows.length > 0
      ? [
          { value: String(countBy("free")), label: dict.visa.free },
          { value: String(countBy("eta")), label: dict.visa.eta },
          { value: String(countBy("arrival")), label: dict.visa.arrival },
        ]
      : undefined;

  return (
    <div>
      <PageHero
        {...hero}
        eyebrow={dict.visa.forSaudiPassports}
        title={dict.visa.title}
        subtitle={dict.visa.subtitle}
        facts={heroFacts}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <p className="mb-4 rounded-xl bg-navy-50 px-4 py-3 text-sm leading-relaxed text-navy-800 ring-1 ring-navy-100">
          {dict.visa.onlySaudi}
        </p>

        <div className="mb-6">
          <VisaWarning
            dict={{
              warningTitle: dict.visa.warningTitle,
              warningBody: dict.visa.warningBody,
              checkIata: dict.visa.checkIata,
              checkMofa: dict.visa.checkMofa,
              viewSource: dict.visa.viewSource,
            }}
            sourceUrl={data ? data.sourceUrl : VISA_SOURCE_URL}
          />
        </div>

        <section className="mb-12">
          <SectionHeading title={dict.visa.applyHeading} subtitle={dict.visa.applySubtitle} />
          <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-900 ring-1 ring-emerald-200">
            {dict.visa.applySectionNote}
          </p>

          <VisaApplyGrid
            locale={loc}
            countries={applyCountries}
            dict={{
              searchPlaceholder: dict.visa.applySearchPlaceholder,
              countriesCount: dict.visa.applyCountriesCount,
              noResults: dict.visa.applyNoResults,
              filterByType: dict.visa.filterByType,
              allStatuses: dict.visa.allStatuses,
              labels,
            }}
          />
          <p className="mt-3 text-xs text-gray-500">{dict.visa.applyExternalNote}</p>
        </section>

        <SectionHeading title={dict.visa.statusHeading} />

        {rows.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-sm leading-relaxed text-amber-800">
            {dict.visa.unavailable}
          </p>
        ) : (
          <VisaExplorer
            locale={loc}
            rows={rows}
            dict={{
              searchPlaceholder: dict.visa.searchPlaceholder,
              allStatuses: dict.visa.allStatuses,
              countriesCount: dict.visa.countriesCount,
              noResults: dict.visa.noResults,
              allowedStay: dict.visa.allowedStay,
              summaryFree: dict.visa.summaryFree,
              summaryEasy: dict.visa.summaryEasy,
              labels,
              hints,
              continents: dict.attractions.continents,
            }}
          />
        )}
      </div>
    </div>
  );
}
