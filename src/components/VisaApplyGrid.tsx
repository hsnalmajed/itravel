"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { VisaCategory } from "@/lib/visa";
import { flagImageUrl } from "@/lib/visaProviders";
import Photo from "@/components/Photo";
import { VISA_ORDER, VISA_STYLES } from "@/components/VisaBadge";

export interface ApplyCountry {
  code: string;
  name: string;
  photo?: string;
  /** Whether a visa is needed at all, so the card can say so under the name. */
  category: VisaCategory;
  hasOfficial: boolean;
  hasDirect: boolean;
}

interface ApplyDict {
  searchPlaceholder: string;
  countriesCount: string;
  noResults: string;
  filterByType: string;
  allStatuses: string;
  labels: Record<VisaCategory, string>;
}

/**
 * Pick a destination by what it costs you to get in.
 *
 * The status under each name is the whole point of the grid: "Georgia" tells
 * a traveller nothing, "Georgia — no visa needed" turns browsing into
 * deciding. And the filter above turns it around entirely — instead of
 * checking countries one at a time to find one you can just fly to, you ask
 * for all of them at once.
 */
export default function VisaApplyGrid({
  locale,
  countries,
  dict,
}: {
  locale: Locale;
  countries: ApplyCountry[];
  dict: ApplyDict;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<VisaCategory | "all">("all");

  const counts = useMemo(() => {
    const c = {} as Record<VisaCategory, number>;
    for (const cat of VISA_ORDER) c[cat] = 0;
    for (const country of countries) c[country.category]++;
    return c;
  }, [countries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countries.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.name.includes(query.trim()) || c.code.toLowerCase() === q;
    });
  }, [countries, query, category]);

  const chipClass = (active: boolean) =>
    `rounded-full px-3.5 py-2 text-xs sm:text-sm font-bold transition ${
      active ? "bg-brand-800 text-white shadow-sm" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-brand-300"
    }`;

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={dict.searchPlaceholder}
        className="mb-3 w-full max-w-md rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-gray-400"
      />

      <p className="mb-2 text-sm font-bold text-gray-700">{dict.filterByType}</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setCategory("all")} className={chipClass(category === "all")}>
          {dict.allStatuses}
        </button>
        {VISA_ORDER.filter((c) => counts[c] > 0).map((c) => (
          <button key={c} type="button" onClick={() => setCategory(c)} className={chipClass(category === c)}>
            <span className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${VISA_STYLES[c].dot}`} aria-hidden="true" />
              {dict.labels[c]}
              <span className={category === c ? "text-white/70" : "text-gray-400"}>({counts[c]})</span>
            </span>
          </button>
        ))}
      </div>

      <p className="mb-4 text-xs font-semibold text-gray-500">
        {dict.countriesCount.replace("{count}", String(filtered.length))}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">{dict.noResults}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {filtered.map((c) => (
            <Link
              key={c.code}
              href={`/${locale}/visa/${c.code}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-200"
            >
              <div className="relative h-24 sm:h-28">
                <Photo
                  src={c.photo}
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  fallback={<div className="absolute inset-0 bg-gradient-to-br from-brand-700 to-brand-950" />}
                />
                {/* The flag sits on the seam between photo and label, exactly
                    where the eye lands when scanning a grid of destinations. */}
                <span className="absolute -bottom-6 start-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white rtl:translate-x-1/2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={flagImageUrl(c.code)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </span>
              </div>

              <div className="px-2 pb-3 pt-8 text-center">
                <p className="truncate text-sm font-bold text-gray-900">{c.name}</p>
                <span
                  className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${VISA_STYLES[c.category].chip}`}
                >
                  <span aria-hidden="true">{VISA_STYLES[c.category].icon}</span>
                  {dict.labels[c.category]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
