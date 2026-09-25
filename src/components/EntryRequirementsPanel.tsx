"use client";

import { useState } from "react";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry } from "@/lib/countries";
import VisaOfficialLinks from "@/components/VisaOfficialLinks";

/**
 * "Can I get in?" — raised above the prices, not after them.
 *
 * Someone comparing fares to Cairo is making a decision they can only act on
 * if they can actually enter Egypt, so the prompt belongs at the top of the
 * results. The site states no visa status of its own (see visaProviders.ts),
 * so this doesn't answer the question — it hands over the places that can:
 * IATA's Travel Centre, the Saudi foreign ministry and, where we have a
 * verified one, the country's own portal. Folded by default so it informs
 * the search without taking it over.
 *
 * Everything here is local data, so there is nothing to fetch and nothing to
 * shift the prices down while it loads.
 */
export default function EntryRequirementsPanel({
  countryCode,
  locale,
}: {
  countryCode: string;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const [open, setOpen] = useState(false);

  const country = findCountry(countryCode);
  // "Entry requirements for Saudi Arabia" on a Saudi passport is not a question.
  if (!country || country.code === "SA") return null;
  const name = locale === "ar" ? country.nameAr : country.nameEn;

  return (
    <section className="mb-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-start transition hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-inset"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg leading-none" aria-hidden="true">
            🛂
          </span>
          <div>
            <p className="text-sm font-extrabold text-gray-900">
              {dict.results.entryRequirementsTitle.replace("{country}", name)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">{dict.visa.warningTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
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
          <p className="mb-4 text-sm leading-relaxed text-gray-600">{dict.visa.warningBody}</p>
          <VisaOfficialLinks countryCode={country.code} locale={locale} showChecklist={false} />
          <Link
            href={`/${locale}/visa/${country.code}`}
            className="mt-4 inline-block rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800"
          >
            {dict.visa.openDetails}
          </Link>
        </div>
      )}
    </section>
  );
}
