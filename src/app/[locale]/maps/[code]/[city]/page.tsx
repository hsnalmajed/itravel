import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry, flagEmoji } from "@/lib/countries";
import { findCity } from "@/lib/cities";
import { buildLegend, pinsAroundCities } from "@/lib/mapPins";
import { PIN_STYLES } from "@/lib/pinStyles";
import AttractionsMap from "@/components/AttractionsMap";
import MapDownloads from "@/components/MapDownloads";

export const dynamic = "force-dynamic";

export default async function CityMapPage({ params }: PageProps<"/[locale]/maps/[code]/[city]">) {
  const { locale, code, city } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const country = findCountry(code);
  if (!country) notFound();

  const cityEntry = findCity(country.code, city);
  if (!cityEntry) notFound();

  // The city's own Wikipedia article gives us its real centre point; every
  // pin is then a documented article within 10 km of it.
  const pins = await pinsAroundCities([cityEntry]);

  // Only show a legend entry for a kind of place this city actually has.
  const legend = buildLegend(pins, {
    historic: dict.maps.legendHistoric,
    food: dict.maps.legendFood,
    activity: dict.maps.legendCityActivity,
    place: dict.maps.legendPlace,
  });

  const cityName = loc === "ar" ? cityEntry.nameAr : cityEntry.nameEn;
  const pageTitle = dict.maps.cityMapTitle.replace("{city}", cityName);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href={`/${loc}/maps/${country.code}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span aria-hidden="true">{loc === "ar" ? "→" : "←"}</span>
          {dict.maps.backToCountryMap}
        </Link>
      </div>

      <h1 className="mb-1 flex items-center gap-2.5 text-xl sm:text-2xl font-extrabold text-gray-900">
        <span className="text-2xl leading-none">{flagEmoji(country.code)}</span>
        {pageTitle}
      </h1>

      {pins.length === 0 ? (
        <p className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-5 text-sm text-amber-800 leading-relaxed">
          {dict.maps.cityNoPlaces}
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">
            📍 {dict.maps.pinsCount.replace("{count}", String(pins.length))}
          </p>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {legend.map((l) => (
              <span key={l.category} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                  style={{ backgroundColor: PIN_STYLES[l.category].color }}
                  aria-hidden="true"
                >
                  {PIN_STYLES[l.category].glyph}
                </span>
                {l.label}
                <span className="font-normal text-gray-400">({l.count})</span>
              </span>
            ))}
          </div>
          <AttractionsMap
            locale={loc}
            countryCode={country.code}
            pins={pins}
            dict={{
              attractionsHeading: dict.maps.legendAttractions,
              activitiesHeading: dict.maps.legendActivities,
              nearbyHeading: dict.maps.nearbyHeading,
              foodHeading: dict.maps.foodHeading,
              historicHeading: dict.maps.historicHeading,
              readMore: dict.maps.readMore,
              viewTours: dict.maps.viewTours,
              mapAttribution: dict.maps.mapAttribution,
            }}
          />
          <MapDownloads
            locale={loc}
            pins={pins}
            title={pageTitle}
            fileBase={`iTravel-${cityEntry.nameEn}-map`}
            dict={dict.maps}
          />
          <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
            {dict.maps.sourceNote}
          </p>
        </>
      )}
    </div>
  );
}
