"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import { flagEmoji } from "@/lib/countries";

export interface MapCountry {
  code: string;
  nameAr: string;
  nameEn: string;
  photo?: string;
  placeCount: number;
}

interface MapsDict {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  pinsCount: string;
}

export default function MapsCountryList({
  locale,
  dict,
  countries,
}: {
  locale: Locale;
  dict: MapsDict;
  countries: MapCountry[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.nameAr.includes(q) ||
        c.nameEn.toLowerCase().includes(q.toLowerCase()) ||
        c.code.toLowerCase() === q.toLowerCase()
    );
  }, [countries, query]);

  return (
    <div>
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-6xl text-center text-white">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">🗺️ {dict.title}</h1>
          <p className="text-white/70 mt-2 mb-6">{dict.subtitle}</p>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.searchPlaceholder}
            className="w-full max-w-md mx-auto block rounded-xl border-0 bg-white px-4 py-3 text-sm text-gray-800 shadow-lg outline-none transition focus:ring-4 focus:ring-white/20 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((c) => (
            <Link
              key={c.code}
              href={`/${locale}/maps/${c.code}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {c.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.photo}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-800 to-brand-950 text-4xl">
                  {flagEmoji(c.code)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
              <div className="absolute bottom-2.5 start-3 end-3">
                <p className="truncate text-sm sm:text-base font-bold text-white drop-shadow-sm">
                  {locale === "ar" ? c.nameAr : c.nameEn}
                </p>
                <p className="text-[11px] text-white/75">
                  📍 {dict.pinsCount.replace("{count}", String(c.placeCount))}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-10">
            {locale === "ar" ? "لا توجد نتائج" : "No results"}
          </p>
        )}
      </div>
    </div>
  );
}
