"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { ViatorCity } from "@/lib/viator";

interface PickerDict {
  citiesHeading: string;
  citiesSubtitle: string;
  citySearchPlaceholder: string;
}

// A country can have hundreds of Viator destinations, so this is a searchable
// list rather than a plain grid — the same shape a real tour marketplace uses
// for its "where in this country?" step.
export default function CityPicker({
  locale,
  countryCode,
  cities,
  dict,
}: {
  locale: Locale;
  countryCode: string;
  cities: ViatorCity[];
  dict: PickerDict;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, query]);

  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-brand-900 mb-1 flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
        {dict.citiesHeading}
      </h2>
      <p className="text-sm text-gray-500 mb-4 ms-3">{dict.citiesSubtitle}</p>

      {cities.length > 12 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.citySearchPlaceholder}
          className="mb-4 w-full max-w-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 placeholder:text-gray-400"
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((city) => (
          <Link
            key={city.id}
            href={`/${locale}/attractions/${countryCode}/${city.id}`}
            className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-brand-200 hover:shadow-md"
          >
            <span className="text-base leading-none" aria-hidden="true">📍</span>
            <span className="text-sm font-semibold text-gray-800 truncate">{city.name}</span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-6 text-sm">
          {locale === "ar" ? "لا توجد نتائج" : "No results"}
        </p>
      )}
    </section>
  );
}
