"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { Continent } from "@/lib/countries";
import { flagEmoji } from "@/lib/countries";
import type { VisaCategory } from "@/lib/visa";
import { CONTINENT_ORDER } from "@/components/DestinationFilters";
import VisaBadge, { VISA_ORDER, VISA_STYLES } from "@/components/VisaBadge";

export interface VisaRow {
  code: string;
  nameAr: string;
  nameEn: string;
  continent: Continent;
  category: VisaCategory;
  /** The source's own wording, shown as-is. */
  status: string;
  stay: string;
  /** True when this country has a guide on the site to link through to. */
  hasGuide: boolean;
}

interface VisaExplorerDict {
  searchPlaceholder: string;
  allStatuses: string;
  countriesCount: string;
  noResults: string;
  allowedStay: string;
  summaryFree: string;
  summaryEasy: string;
  labels: Record<VisaCategory, string>;
  hints: Record<VisaCategory, string>;
  continents: Record<Continent, string>;
}

export default function VisaExplorer({
  locale,
  rows,
  dict,
}: {
  locale: Locale;
  rows: VisaRow[];
  dict: VisaExplorerDict;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<VisaCategory | "all">("all");

  const counts = useMemo(() => {
    const c = {} as Record<VisaCategory, number>;
    for (const cat of VISA_ORDER) c[cat] = 0;
    for (const r of rows) c[r.category]++;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (!q) return true;
      return (
        r.nameAr.includes(query.trim()) ||
        r.nameEn.toLowerCase().includes(q) ||
        r.code.toLowerCase() === q
      );
    });
  }, [rows, query, category]);

  const grouped = useMemo(() => {
    const map = new Map<Continent, VisaRow[]>();
    for (const continent of CONTINENT_ORDER) map.set(continent, []);
    for (const row of filtered) map.get(row.continent)?.push(row);
    return map;
  }, [filtered]);

  const chipClass = (active: boolean) =>
    `rounded-full px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
      active ? "bg-brand-800 text-white shadow-sm" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-brand-300"
    }`;

  return (
    <div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <p className="text-2xl font-extrabold text-emerald-900">{counts.free}</p>
          <p className="text-sm font-semibold text-emerald-800">
            {dict.summaryFree.replace("{count}", String(counts.free))}
          </p>
        </div>
        <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
          <p className="text-2xl font-extrabold text-sky-900">{counts.arrival + counts.eta}</p>
          <p className="text-sm font-semibold text-sky-800">
            {dict.summaryEasy.replace("{count}", String(counts.arrival + counts.eta))}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-black/5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-gray-400"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => setCategory("all")} className={chipClass(category === "all")}>
            {dict.allStatuses}
          </button>
          {VISA_ORDER.filter((c) => counts[c] > 0).map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={chipClass(category === c)}>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${VISA_STYLES[c].dot}`}
                  aria-hidden="true"
                />
                {dict.labels[c]}
                <span className={category === c ? "text-white/70" : "text-gray-400"}>({counts[c]})</span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs font-semibold text-gray-500">
          {dict.countriesCount.replace("{count}", String(filtered.length))}
        </p>
      </div>

      {category !== "all" && (
        <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-900 ring-1 ring-brand-100">
          {dict.hints[category]}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
          {dict.noResults}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {CONTINENT_ORDER.map((continent) => {
            const inContinent = grouped.get(continent) ?? [];
            if (inContinent.length === 0) return null;

            return (
              <section key={continent}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
                  <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
                  {dict.continents[continent]}
                  <span className="text-sm font-normal text-gray-400">({inContinent.length})</span>
                </h2>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {inContinent.map((r) => {
                    const name = locale === "ar" ? r.nameAr : r.nameEn;
                    const inner = (
                      <>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl leading-none" aria-hidden="true">
                            {flagEmoji(r.code)}
                          </span>
                          <span className="flex-1 truncate text-sm font-bold text-gray-900">{name}</span>
                          <span
                            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${VISA_STYLES[r.category].dot}`}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <VisaBadge category={r.category} label={dict.labels[r.category]} />
                          {r.stay && (
                            <span className="text-[11px] font-semibold text-gray-500">
                              {dict.allowedStay}: <span dir="ltr">{r.stay}</span>
                            </span>
                          )}
                        </div>
                        {/* The source's exact wording, so a conditional route
                            like "eVisa / Visa on arrival" is never flattened
                            into just the badge. */}
                        <p className="mt-1.5 text-[11px] text-gray-400" dir="ltr">
                          {r.status}
                        </p>
                      </>
                    );

                    const cardClass =
                      "block rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-black/5 transition";

                    return r.hasGuide ? (
                      <Link
                        key={r.code}
                        href={`/${locale}/attractions/${r.code}`}
                        className={`${cardClass} hover:-translate-y-0.5 hover:ring-brand-200 hover:shadow-md`}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div key={r.code} className={cardClass}>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
