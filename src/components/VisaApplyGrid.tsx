"use client";

import { useMemo, useState } from "react";
import { flagImageUrl } from "@/lib/visaProviders";
import Photo from "@/components/Photo";

export interface ApplyCountry {
  code: string;
  name: string;
  photo?: string;
  /** The country's own government portal, when we have a verified one. */
  officialUrl?: string;
  /** Direct's requirement page for this country, when they cover it. */
  directUrl?: string;
}

interface ApplyDict {
  searchPlaceholder: string;
  applyOfficial: string;
  applyDirect: string;
  officialNote: string;
  countriesCount: string;
  noResults: string;
  chooseRoute: string;
}

/**
 * Pick a country, then pick how to apply.
 *
 * The two routes are shown side by side rather than one being hidden behind
 * the other, because they cost very different amounts: the government portal
 * charges the visa fee and nothing else, while an agency adds a service fee
 * for handling the paperwork. A traveller who doesn't know the first option
 * exists can't choose it, so where a verified official portal exists it goes
 * first and is labelled as the official one.
 */
export default function VisaApplyGrid({
  countries,
  dict,
}: {
  // Names arrive already in the reader's language, so this component never
  // needs to know which one that is.
  countries: ApplyCountry[];
  dict: ApplyDict;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) => c.name.toLowerCase().includes(q) || c.name.includes(query.trim()) || c.code.toLowerCase() === q
    );
  }, [countries, query]);

  const active = countries.find((c) => c.code === open);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={dict.searchPlaceholder}
        className="mb-3 w-full max-w-md rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-gray-400"
      />
      <p className="mb-4 text-xs font-semibold text-gray-500">
        {dict.countriesCount.replace("{count}", String(filtered.length))}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">{dict.noResults}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setOpen(open === c.code ? null : c.code)}
              aria-expanded={open === c.code}
              className={`group overflow-hidden rounded-2xl bg-white text-start shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ${
                open === c.code ? "ring-2 ring-brand-500" : "ring-black/5"
              }`}
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
                  <img
                    src={flagImageUrl(c.code)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </span>
              </div>
              <p className="px-2 pb-3 pt-8 text-center text-sm font-bold text-gray-900">{c.name}</p>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-200">
          <p className="mb-3 font-bold text-brand-900">
            {dict.chooseRoute.replace("{country}", active.name)}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            {active.officialUrl && (
              <a
                href={active.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                🏛 {dict.applyOfficial} ↗
              </a>
            )}
            {active.directUrl && (
              <a
                href={active.directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-brand-800 px-4 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
              >
                📄 {dict.applyDirect} ↗
              </a>
            )}
          </div>

          {active.officialUrl && (
            <p className="mt-2.5 text-xs leading-relaxed text-emerald-800">{dict.officialNote}</p>
          )}
        </div>
      )}
    </div>
  );
}
