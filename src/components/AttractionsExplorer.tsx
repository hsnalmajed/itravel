"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import { COUNTRIES, flagEmoji, type Continent, type Country } from "@/lib/countries";
import { cityCountLabel } from "@/lib/format";

const CONTINENT_ORDER: Continent[] = ["asia", "africa", "europe", "northAmerica", "southAmerica", "oceania"];

export interface FeaturedDestination {
  code: string;
  nameAr: string;
  nameEn: string;
  // A real, live-fetched Wikipedia photo of the destination's best-known
  // landmark (falling back to the country's own page photo) — never a
  // hand-picked or invented image. Missing when neither lookup resolved a
  // usable photo; the card then falls back to a flag tile instead of a
  // broken image, the same honest-fallback pattern used everywhere else on
  // this site when a live fetch comes back empty.
  photo?: string;
  /** How many of this country's cities have a place guide of their own. */
  cityCount: number;
}

// Mirrors the shape of dict.attractions — only the keys this component
// actually renders.
interface ExplorerDict {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  featuredTitle: string;
  featuredSubtitle: string;
  moreDestinations: string;
  continents: Record<Continent, string>;
  citiesCount: string;
  cityOne: string;
  cityTwo: string;
  cityFew: string;
}

// Styled after how a real tour marketplace shows its destination picker: a
// grid of photo cards (one per popular destination we have a full guide
// for) with the name overlaid on the image, rather than a plain text list.
// Every destination without a deep guide yet still has its own page (a
// country-level Wikipedia summary), so it stays reachable via the plain
// directory below the grid — search covers both.
export default function AttractionsExplorer({
  locale,
  dict,
  featured,
}: {
  locale: Locale;
  dict: ExplorerDict;
  featured: FeaturedDestination[];
}) {
  const [query, setQuery] = useState("");

  const featuredCodes = useMemo(() => new Set(featured.map((f) => f.code)), [featured]);
  // The plain directory below covers every other country — excludes the
  // featured set above so nothing is listed twice.
  const restCountries = useMemo(() => COUNTRIES.filter((c) => !featuredCodes.has(c.code)), [featuredCodes]);

  function matches(nameAr: string, nameEn: string, code: string, q: string) {
    return (
      nameAr.includes(q) || nameEn.toLowerCase().includes(q.toLowerCase()) || code.toLowerCase() === q.toLowerCase()
    );
  }

  const filteredFeatured = useMemo(() => {
    const q = query.trim();
    if (!q) return featured;
    return featured.filter((c) => matches(c.nameAr, c.nameEn, c.code, q));
  }, [featured, query]);

  const filteredRest = useMemo(() => {
    const q = query.trim();
    if (!q) return restCountries;
    return restCountries.filter((c) => matches(c.nameAr, c.nameEn, c.code, q));
  }, [restCountries, query]);

  const groupedRest = useMemo(() => {
    const map = new Map<Continent, Country[]>();
    for (const continent of CONTINENT_ORDER) map.set(continent, []);
    for (const country of filteredRest) {
      const list = map.get(country.continent);
      if (list) list.push(country);
    }
    return map;
  }, [filteredRest]);

  const noResults = filteredFeatured.length === 0 && filteredRest.length === 0;

  return (
    <div>
      <div className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-6xl text-center text-white">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{dict.title}</h1>
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
        {filteredFeatured.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-bold text-brand-900 mb-1 flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
              {dict.featuredTitle}
            </h2>
            <p className="text-sm text-gray-500 mb-4 ms-3">{dict.featuredSubtitle}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredFeatured.map((c) => (
                <Link
                  key={c.code}
                  href={`/${locale}/attractions/${c.code}`}
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
                    {c.cityCount > 0 && (
                      <p className="text-[11px] text-white/75">🏙️ {cityCountLabel(c.cityCount, dict)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {filteredRest.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-brand-900 mb-3 flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
              {dict.moreDestinations}
            </h2>
            <div className="space-y-8">
              {CONTINENT_ORDER.map((continent) => {
                const countries = groupedRest.get(continent) ?? [];
                if (countries.length === 0) return null;
                return (
                  <div key={continent}>
                    <h3 className="text-sm font-bold text-gray-500 mb-3">{dict.continents[continent]}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {countries.map((country) => (
                        <Link
                          key={country.code}
                          href={`/${locale}/attractions/${country.code}`}
                          className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-brand-200 hover:shadow-md"
                        >
                          <span className="text-xl leading-none">{flagEmoji(country.code)}</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {locale === "ar" ? country.nameAr : country.nameEn}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {noResults && (
          <p className="text-center text-gray-400 py-10">{locale === "ar" ? "لا توجد نتائج" : "No results"}</p>
        )}
      </div>
    </div>
  );
}
