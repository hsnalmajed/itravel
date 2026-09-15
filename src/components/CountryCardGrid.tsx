"use client";

import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { Continent } from "@/lib/countries";
import { flagEmoji } from "@/lib/countries";
import Photo from "@/components/Photo";
import { CONTINENT_ORDER } from "@/components/DestinationFilters";
import { searchMatches, searchEquals } from "@/lib/search";

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
            <h3 className="mb-3.5 flex items-center gap-2.5">
              <span className="h-4 w-1 rounded-full bg-gradient-to-b from-sun-300 to-sun-600" aria-hidden="true" />
              <span className="font-display text-base font-extrabold text-navy-900">
                {continentLabels[continent]}
              </span>
              <span className="text-sm font-medium text-navy-300">({inContinent.length})</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {inContinent.map((c) => (
                <Link
                  key={c.code}
                  href={`${hrefBase}/${c.code}`}
                  className="group relative isolate block aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-navy-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                >
                  <Photo
                    src={c.photo}
                    className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                    fallback={
                      <div className="absolute inset-0 -z-10 flex items-center justify-center bg-gradient-to-br from-navy-700 to-navy-990 text-4xl">
                        {flagEmoji(c.code)}
                      </div>
                    }
                  />
                  <div className="scrim-soft absolute inset-0 -z-10" />
                  {/* A sunset hairline that draws itself on hover — the same
                      mark as the section rules, at card scale. */}
                  <span
                    className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-sun-300 to-sun-600 transition-transform duration-300 group-hover:scale-x-100 rtl:origin-right"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="truncate font-display text-sm font-extrabold text-white drop-shadow-sm sm:text-base">
                      {locale === "ar" ? c.nameAr : c.nameEn}
                    </p>
                    {c.subtitle && (
                      <p className="mt-0.5 truncate text-[0.7rem] font-semibold text-sun-300">
                        {c.subtitle}
                      </p>
                    )}
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

  const q = query.trim();
  if (!q) return true;

  // City names are searchable too: someone who knows they want Sharm El
  // Sheikh shouldn't have to remember it's in Egypt.
  return (
    searchMatches([country.nameAr, country.nameEn, ...country.cityNames], q) ||
    searchEquals(country.code, q)
  );
}
