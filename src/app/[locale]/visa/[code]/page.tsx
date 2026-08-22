import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry } from "@/lib/countries";
import { fetchVisaRequirements, VISA_SOURCE_URL, type VisaCategory } from "@/lib/visa";
import { documentsFor, isSchengen } from "@/lib/visaDocuments";
import { directVisaUrl, flagImageUrl, officialVisaUrl } from "@/lib/visaProviders";
import { fetchCountryPhotos } from "@/lib/countryPhotos";
import VisaBadge from "@/components/VisaBadge";
import VisaWarning from "@/components/VisaWarning";
import Photo from "@/components/Photo";

export const dynamic = "force-dynamic";

// One country, everything about entering it, ending on the apply buttons.
//
// The order is the order someone actually needs it in: what the rule is,
// then what to put in the folder, then where to hand it in. Putting the
// apply buttons at the bottom is deliberate — a visitor who has read the
// document list is far less likely to start an application they can't finish.
export default async function VisaCountryPage({ params }: PageProps<"/[locale]/visa/[code]">) {
  const { locale, code } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const country = findCountry(code);
  if (!country) notFound();

  const [data, photos] = await Promise.all([
    fetchVisaRequirements(),
    fetchCountryPhotos([country.code]),
  ]);

  const entry = data?.byCountry.get(country.code);
  const category: VisaCategory = entry?.category ?? "unknown";
  const documents = documentsFor(country.code, category);

  const officialUrl = officialVisaUrl(country.code);
  const directUrl = directVisaUrl(country.code, loc);
  const countryName = loc === "ar" ? country.nameAr : country.nameEn;

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

  return (
    <div>
      <div className="relative h-44 overflow-hidden sm:h-56">
        <Photo
          src={photos.get(country.code)}
          className="absolute inset-0 h-full w-full object-cover"
          fallback={<div className="absolute inset-0 bg-gradient-to-br from-brand-900 to-brand-950" />}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
        <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-4 pb-5 sm:px-6">
          <Link
            href={`/${loc}/visa`}
            className="mb-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-white/90 transition hover:text-white"
          >
            {loc === "ar" ? "→" : "←"} {dict.visa.backToVisa}
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flagImageUrl(country.code)} alt="" className="h-full w-full object-cover" />
            </span>
            <h1 className="text-2xl font-extrabold text-white drop-shadow-sm sm:text-3xl">
              {dict.visa.headingForCountry.replace("{country}", countryName)}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          {entry ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <VisaBadge category={category} label={labels[category]} />
                {entry.stay && (
                  <span className="text-sm font-semibold text-gray-600">
                    {dict.visa.allowedStay}: <span dir="ltr">{entry.stay}</span>
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{hints[category]}</p>
              {/* The source's exact wording, so a two-route status never gets
                  flattened into the badge alone. */}
              <p className="mt-1 text-xs text-gray-400" dir="ltr">
                {entry.status}
              </p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-amber-800">{dict.visa.unavailable}</p>
          )}
        </div>

        <div className="mt-4">
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

        <section className="mt-8">
          <h2 className="mb-1 text-xl font-extrabold text-brand-900">📋 {dict.visa.documentsHeading}</h2>
          {isSchengen(country.code) && (category === "required" || category === "eta") && (
            <p className="mb-3 rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-900 ring-1 ring-brand-100">
              🇪🇺 {dict.visa.schengenNote}
            </p>
          )}
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
            {dict.visa.documentsNote}
          </p>

          <ol className="space-y-2.5">
            {documents.map((doc, index) => (
              <li
                key={doc.titleEn}
                className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-bold text-gray-900">{loc === "ar" ? doc.titleAr : doc.titleEn}</p>
                  {(loc === "ar" ? doc.detailAr : doc.detailEn) && (
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {loc === "ar" ? doc.detailAr : doc.detailEn}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-extrabold text-brand-900">🛫 {dict.visa.applyNow}</h2>
          <p className="mb-4 text-sm text-gray-500">{dict.visa.applyNowSubtitle}</p>

          {officialUrl || directUrl ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                {officialUrl && (
                  <a
                    href={officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-3.5 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    🏛 {dict.visa.applyOfficial} ↗
                  </a>
                )}
                {directUrl && (
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl bg-brand-800 px-4 py-3.5 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
                  >
                    📄 {dict.visa.applyDirect} ↗
                  </a>
                )}
              </div>
              {officialUrl && (
                <p className="mt-2.5 text-xs leading-relaxed text-emerald-800">{dict.visa.officialNote}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">{dict.visa.applyExternalNote}</p>
            </>
          ) : (
            <p className="rounded-xl bg-gray-50 px-4 py-5 text-sm leading-relaxed text-gray-600">
              {dict.visa.noApplyRoute}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
