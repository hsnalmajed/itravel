"use client";

import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { Continent } from "@/lib/countries";
import { flagEmoji } from "@/lib/countries";
import Photo from "@/components/Photo";
import { CONTINENT_ORDER } from "@/components/DestinationFilters";

export interface DestinationCountry {
  code: string;
  nameAr: string;
  nameEn: string;
  continent: Continent;
  photo?: string;
  /** Line under the name — a city count, a season, whatever the page needs. */
  subtitle?: string;
  /** Months this country's guide recommends, for the month filter. */
  months: number[];
  /** City names, so a search for "Antalya" finds Turkey. */
  cityNames: string[];
}

/**
 * Destination cards laid out continent by continent.
 *
 * A flat grid of forty countries is a wall — Turkey next to Peru next to
 * Norway, in whatever order the data happened to be in. Grouping by continent
 * matches how people actually narrow a holiday down, and it means the heading
 * above a card already tells you half of what you wanted to know.
 */
export default function CountryCardGrid({
  locale,
  countries,
  hrefBase,
  continentLabels,
}: {
  locale: Locale;
  countries: DestinationCountry[];
  /** Each card links to `${hrefBase}/${code}`. */
  hrefBase: string;
  continentLabels: Record<Continent, string>;
}) {
  return (
    <div className="space-y-8">
      {CONTINENT_ORDER.map((continent) => {
        const inContinent = countries.filter((c) => c.continent === continent);
        if (inContinent.length === 0) return null;

        return (
          <section key={continent}>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-900">
              <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
              {continentLabels[continent]}
              <span className="text-sm font-normal text-gray-400">({inContinent.length})</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {inContinent.map((c) => (
                <Link
                  key={c.code}
                  href={`${hrefBase}/${c.code}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Photo
                    src={c.photo}
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    fallback={
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-800 to-brand-950 text-4xl">
                        {flagEmoji(c.code)}
                      </div>
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                  <div className="absolute bottom-2.5 start-3 end-3">
                    <p className="truncate text-sm font-bold text-white drop-shadow-sm sm:text-base">
                      {locale === "ar" ? c.nameAr : c.nameEn}
                    </p>
                    {c.subtitle && <p className="text-[11px] text-white/75">{c.subtitle}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Shared matching rules, so every page's search behaves the same way. */
export function matchesFilters(
  country: DestinationCountry,
  { query, continent, month }: { query: string; continent: Continent | "all"; month: number | "all" }
): boolean {
  if (continent !== "all" && country.continent !== continent) return false;
  if (month !== "all" && !country.months.includes(month)) return false;

  const q = query.trim().toLowerCase();
  if (!q) return true;

  // City names are searchable too: someone who knows they want Sharm El
  // Sheikh shouldn't have to remember it's in Egypt.
  return (
    country.nameAr.includes(query.trim()) ||
    country.nameEn.toLowerCase().includes(q) ||
    country.code.toLowerCase() === q ||
    country.cityNames.some((n) => n.toLowerCase().includes(q) || n.includes(query.trim()))
  );
}
