"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import type { VisaCategory } from "@/lib/visa";
import VisaBadge, { VISA_STYLES } from "@/components/VisaBadge";

interface VisaResponse {
  available: boolean;
  code: string;
  name: string;
  category: VisaCategory;
  status: string;
  stay: string;
  schengen: boolean;
  documents: { title: string; detail?: string }[];
  officialUrl: string | null;
  directUrl: string | null;
  sourceUrl: string;
}

/**
 * "Do I need a visa for this?" — answered above the prices, not after them.
 *
 * Someone comparing fares to Cairo is making a decision they can only act on
 * if they can actually enter Egypt, so the answer belongs at the top of the
 * results rather than on a page they might never open. The headline is one
 * line — visa free, on arrival, eVisa, required — and the detail stays folded
 * away until asked for, so it informs the search without taking it over.
 *
 * It never claims to be the authority. Expanding it shows the source's own
 * wording, the usual document list framed as typical, and links to the
 * official portal and the full country page. If the source can't be read we
 * say so instead of showing an empty checklist, which would read as "nothing
 * required".
 */
export default function EntryRequirementsPanel({
  countryCode,
  locale,
}: {
  countryCode: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const [data, setData] = useState<VisaResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/visa?code=${encodeURIComponent(countryCode)}&locale=${locale}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((d: VisaResponse) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode, locale]);

  // While it is loading there is nothing useful to say, and a skeleton at the
  // very top of the page would push the prices down for no reason.
  if (failed || !data) return null;

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

  const style = VISA_STYLES[data.category];

  return (
    <section className="mb-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-start transition hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
          <div>
            <p className="text-sm font-extrabold text-gray-900">
              {dict.results.entryRequirementsTitle.replace("{country}", data.name)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {data.available ? hints[data.category] : dict.visa.unavailable}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {data.available && <VisaBadge category={data.category} label={labels[data.category]} />}
          <span className="text-xs font-bold text-brand-800">
            {open ? dict.results.entryRequirementsHide : dict.results.entryRequirementsShow}
          </span>
          <span
            aria-hidden="true"
            className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-5">
          {/* No checklist when the source couldn't be read. A visa-free list
              shown against an unknown status reads as "nothing required",
              which is the one wrong answer that costs someone a flight — so
              the panel says it doesn't know and points at the official
              sources instead. */}
          {data.available ? (
            <>
              <div className="mb-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {dict.visa.statusHeading}
                  </p>
                  {/* The source's own wording, shown verbatim. */}
                  <p className="mt-1 font-semibold text-gray-800">{data.status}</p>
                </div>
                {data.stay && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {dict.visa.allowedStay}
                    </p>
                    <p className="mt-1 font-semibold text-gray-800">{data.stay}</p>
                  </div>
                )}
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {dict.visa.documentsHeading}
              </p>
              <ul className="mt-2.5 space-y-2">
                {data.documents.map((doc) => (
                  <li key={doc.title} className="flex gap-2.5 text-sm">
                    <span className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true">
                      ✔
                    </span>
                    <span>
                      <span className="font-semibold text-gray-800">{doc.title}</span>
                      {doc.detail && (
                        <span className="block text-xs leading-relaxed text-gray-500">{doc.detail}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-3.5 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900">
                {dict.visa.documentsNote}
              </p>
            </>
          ) : (
            <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm leading-relaxed text-amber-900">
              {dict.visa.unavailable}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/${locale}/visa/${data.code}`}
              className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800"
            >
              {dict.visa.openDetails}
            </Link>
            {data.officialUrl && (
              <a
                href={data.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-50"
              >
                {dict.visa.applyOfficial}
              </a>
            )}
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-300"
            >
              {dict.visa.viewSource}
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
