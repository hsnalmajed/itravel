"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { COUNTRIES, flagEmoji, type Continent } from "@/lib/countries";

const CONTINENT_ORDER: Continent[] = ["asia", "africa", "europe", "northAmerica", "southAmerica", "oceania"];

export default function AttractionsPage() {
  const params = useParams();
  const locale = (params.locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(locale);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.nameAr.includes(query.trim()) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.code.toLowerCase() === q
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<Continent, typeof COUNTRIES>();
    for (const continent of CONTINENT_ORDER) map.set(continent, []);
    for (const country of filtered) {
      const list = map.get(country.continent);
      if (list) list.push(country);
    }
    return map;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{dict.attractions.title}</h1>
      <p className="text-gray-500 mt-1 mb-6">{dict.attractions.subtitle}</p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={dict.attractions.searchPlaceholder}
        className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition placeholder:text-gray-400"
      />

      <div className="mt-8 space-y-10">
        {CONTINENT_ORDER.map((continent) => {
          const countries = grouped.get(continent) ?? [];
          if (countries.length === 0) return null;
          return (
            <section key={continent}>
              <h2 className="text-lg font-bold text-brand-900 mb-3">{dict.attractions.continents[continent]}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {countries.map((country) => (
                  <Link
                    key={country.code}
                    href={`/${locale}/attractions/${country.code}`}
                    className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-black/5 hover:ring-brand-200 hover:shadow-md transition"
                  >
                    <span className="text-xl leading-none">{flagEmoji(country.code)}</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {locale === "ar" ? country.nameAr : country.nameEn}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-10">{locale === "ar" ? "لا توجد نتائج" : "No results"}</p>
        )}
      </div>
    </div>
  );
}
