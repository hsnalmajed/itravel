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

// Fetched per request behind a daily cache, never frozen into the build — a
// visa table baked into a deploy is stale the moment a rule changes.
export const dynamic = "force-dynamic";

export default async function VisaPage({ params }: PageProps<"/[locale]/visa">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  // The countries a traveller can actually act on, and a photo for each.
  const applyCodes = applicableCountryCodes().filter((code) => findCountry(code));
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
        officialUrl: officialVisaUrl(code),
        directUrl: directVisaUrl(code, loc),
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

  return (
    <div>
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-6xl text-center text-white">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">🛂 {dict.visa.title}</h1>
          <p className="mt-2 text-white/70">{dict.visa.subtitle}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <p className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-900 ring-1 ring-brand-100">
          🇸🇦 {dict.visa.onlySaudi}
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

        <section className="mb-10">
          <h2 className="text-xl font-extrabold text-brand-900">🛫 {dict.visa.applyHeading}</h2>
          <p className="mb-1 text-sm text-gray-500">{dict.visa.applySubtitle}</p>
          <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-900 ring-1 ring-emerald-200">
            {dict.visa.applySectionNote}
          </p>

          <VisaApplyGrid
            countries={applyCountries}
            dict={{
              searchPlaceholder: dict.visa.applySearchPlaceholder,
              applyOfficial: dict.visa.applyOfficial,
              applyDirect: dict.visa.applyDirect,
              officialNote: dict.visa.officialNote,
              countriesCount: dict.visa.applyCountriesCount,
              noResults: dict.visa.applyNoResults,
              chooseRoute: dict.visa.chooseRoute,
            }}
          />
          <p className="mt-3 text-xs text-gray-500">{dict.visa.applyExternalNote}</p>
        </section>

        <h2 className="mb-4 text-xl font-extrabold text-brand-900">❓ {dict.visa.statusHeading}</h2>

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
