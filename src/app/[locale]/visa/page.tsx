import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { COUNTRIES, findCountry } from "@/lib/countries";
import { fetchVisaRequirements, VISA_SOURCE_URL, type VisaCategory } from "@/lib/visa";
import VisaWarning from "@/components/VisaWarning";
import VisaDirectory, { type VisaCountry } from "@/components/VisaDirectory";
import { applicableCountryCodes } from "@/lib/visaProviders";
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

  // Which countries have somewhere to apply. A local lookup, no network.
  const applyCodes = applicableCountryCodes().filter((code) => findCountry(code));

  // Two outbound lookups on this page, and no more. It used to also fetch a
  // photograph per country, which cost dozens of requests and was starving the
  // one that matters — the visa table itself, whose failure left the page
  // saying it could not check. The cards carry flags instead; see
  // VisaDirectory.
  const hero = await sectionHero("visa", loc);
  const data = await fetchVisaRequirements();

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
  //
  // One list for the whole page. Every country the source publishes, each
  // carrying the two things the page used to split across two sections: what
  // it takes to get in, and whether there is somewhere to apply. See
  // VisaDirectory for why that split was worth ending.
  const applySet = new Set(applyCodes);
  const directory: VisaCountry[] = data
    ? COUNTRIES.filter((c) => c.code !== "SA")
        .map((country): VisaCountry | null => {
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
            canApply: applySet.has(country.code),
          };
        })
        .filter((c): c is VisaCountry => c !== null)
    : [];

  const countBy = (cat: VisaCategory) => directory.filter((r) => r.category === cat).length;
  // Only shown when the table actually loaded — a row of zeroes would read
  // as "nowhere is visa-free" rather than "we could not check".
  const heroFacts =
    directory.length > 0
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

        <SectionHeading title={dict.visa.statusHeading} subtitle={dict.visa.applySubtitle} />

        {directory.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-sm leading-relaxed text-amber-800">
            {dict.visa.unavailable}
          </p>
        ) : (
          <>
            <VisaDirectory
              locale={loc}
              countries={directory}
              dict={{
                searchPlaceholder: dict.visa.searchPlaceholder,
                allStatuses: dict.visa.allStatuses,
                filterByType: dict.visa.filterByType,
                countriesCount: dict.visa.countriesCount,
                noResults: dict.visa.noResults,
                allowedStay: dict.visa.allowedStay,
                canApply: dict.visa.canApply,
                summaryFree: dict.visa.summaryFree,
                summaryEasy: dict.visa.summaryEasy,
                labels,
                hints,
                continents: dict.attractions.continents,
              }}
            />
            <p className="mt-4 text-xs text-gray-500">{dict.visa.applyExternalNote}</p>
          </>
        )}
      </div>
    </div>
  );
}
