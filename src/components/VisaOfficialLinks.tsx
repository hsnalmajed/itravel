import { findCountry } from "@/lib/countries";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { checklistFor } from "@/lib/visaDocuments";
import {
  IATA_TRAVEL_CENTRE_URL,
  SAUDI_MOFA_URL,
  directVisaUrl,
  officialVisaUrl,
} from "@/lib/visaProviders";

/**
 * Where to check, and where to apply, for one country.
 *
 * The site states no visa status of its own. What it can give with certainty
 * is the right doors: IATA's Travel Centre (the Timatic database an airline
 * checks before it prints a boarding pass), the Saudi foreign ministry, and —
 * where we have verified one — the country's own government portal. Every
 * link here comes from visaProviders.ts; nothing is looked up or guessed.
 *
 * Also rendered inside the results page's client panel, so it holds no
 * server-only code: it's plain markup over local constants.
 */
export default function VisaOfficialLinks({
  countryCode,
  locale,
  showChecklist = true,
}: {
  countryCode: string;
  locale: Locale;
  /** The typical-documents list, where one applies. Off in compact spots. */
  showChecklist?: boolean;
}) {
  const dict = getDictionary(locale);
  const country = findCountry(countryCode);
  const name = country ? (locale === "ar" ? country.nameAr : country.nameEn) : countryCode;

  const officialUrl = officialVisaUrl(countryCode);
  const directUrl = directVisaUrl(countryCode, locale);
  const checklist = showChecklist ? checklistFor(countryCode) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
        <p className="mb-3 text-sm font-extrabold text-gray-900">{dict.visa.officialLinksHeading}</p>

        {/* The one check that matches what happens at the airport. */}
        <a
          href={IATA_TRAVEL_CENTRE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl bg-brand-800 px-4 py-3.5 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
        >
          ✈️ {dict.visa.iataButton.replace("{country}", name)} ↗
        </a>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          {dict.visa.iataNote.replace("{country}", name)}
        </p>

        <a
          href={SAUDI_MOFA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block rounded-xl border border-brand-200 px-4 py-3 text-center text-sm font-bold text-brand-800 transition hover:bg-brand-50"
        >
          🇸🇦 {dict.visa.checkMofa} ↗
        </a>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">{dict.visa.mofaNote}</p>

        <div className="mt-5 border-t border-gray-100 pt-4">
          {officialUrl || directUrl ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                {officialUrl && (
                  <a
                    href={officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-navy-900 px-4 py-3.5 text-sm font-extrabold text-white shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:bg-navy-800"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-base" aria-hidden="true">
                      🏛
                    </span>
                    <span className="text-start">
                      <span className="block text-2xs font-bold uppercase tracking-wide text-sea-300">{dict.visa.badgeOfficial}</span>
                      {dict.visa.applyOfficial} ↗
                    </span>
                  </a>
                )}
                {directUrl && (
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-sun-400 px-4 py-3.5 text-sm font-extrabold text-navy-950 shadow-[var(--shadow-sun)] transition hover:-translate-y-0.5 hover:bg-sun-300"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-950/10 text-base" aria-hidden="true">
                      📄
                    </span>
                    <span className="text-start">
                      <span className="block text-2xs font-bold uppercase tracking-wide text-navy-950/60">{dict.visa.badgeDirect}</span>
                      {dict.visa.applyDirect} ↗
                    </span>
                  </a>
                )}
              </div>
              {officialUrl && (
                <p className="mt-2.5 text-xs leading-relaxed text-navy-700">{dict.visa.officialNote}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">{dict.visa.applyExternalNote}</p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-gray-600">{dict.visa.noApplyRoute}</p>
          )}
        </div>
      </div>

      {checklist && (
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
          <p className="mb-3 text-sm font-extrabold text-gray-900">
            {checklist.kind === "schengen"
              ? dict.visa.schengenChecklistHeading
              : dict.visa.onlineChecklistHeading}
          </p>
          {checklist.kind === "schengen" && (
            <p className="mb-3 rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-900 ring-1 ring-brand-100">
              🇪🇺 {dict.visa.schengenNote}
            </p>
          )}
          <ol className="space-y-2.5">
            {checklist.items.map((doc, index) => {
              const detail = locale === "ar" ? doc.detailAr : doc.detailEn;
              return (
                <li key={doc.titleEn} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{locale === "ar" ? doc.titleAr : doc.titleEn}</p>
                    {detail && <p className="mt-1 text-sm leading-relaxed text-gray-600">{detail}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
            {dict.visa.documentsNote}
          </p>
        </section>
      )}
    </div>
  );
}
