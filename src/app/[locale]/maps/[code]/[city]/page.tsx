import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import {findCountry} from "@/lib/countries";
import { findCity } from "@/lib/cities";
import { buildLegend, fetchPlacesAroundCities, placeToPin } from "@/lib/mapPins";
import { PIN_STYLES } from "@/lib/pinStyles";
import AttractionsMap from "@/components/AttractionsMap";
import MapDownloads from "@/components/MapDownloads";
import PageHero from "@/components/ui/PageHero";

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
  // pin is then a documented article within 10 km of it, named in the
  // reader's own language wherever Wikipedia has an article in it.
  const places = await fetchPlacesAroundCities([cityEntry], { locale: loc });
  const pins = places.map((p) => placeToPin(p, loc));

  // Only show a legend entry for a kind of place this city actually has.
  const legend = buildLegend(pins, {
    historic: dict.maps.legendHistoric,
    food: dict.maps.legendFood,
    activity: dict.maps.legendCityActivity,
    place: dict.maps.legendPlace,
  });

  const cityName = loc === "ar" ? cityEntry.nameAr : cityEntry.nameEn;
  const pageTitle = dict.maps.cityMapTitle.replace("{city}", cityName);

  const mapDict = {
    activitiesHeading: dict.maps.legendCityActivity,
    nearbyHeading: dict.maps.nearbyHeading,
    foodHeading: dict.maps.foodHeading,
    historicHeading: dict.maps.historicHeading,
    readMore: dict.maps.readMore,
    englishOnly: dict.maps.englishOnly,
    viewTours: dict.maps.viewTours,
    mapAttribution: dict.maps.mapAttribution,
  };

  return (
    <div>
      <PageHero
        size="sm"
        eyebrow={loc === "ar" ? country.nameAr : country.nameEn}
        title={pageTitle}
      >
        <Link href={`/${loc}/maps/${country.code}`} className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/20">
          <span aria-hidden="true">{loc === "ar" ? "→" : "←"}</span>
          {dict.maps.backToCountryMap}
        </Link>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
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
            citySlug={cityEntry.slug}
            pins={pins}
            dict={mapDict}
          />
          <MapDownloads
            pins={pins}
            title={pageTitle}
            fileBase={`Sfratna-${cityEntry.nameEn}-map`}
            dict={dict.maps}
          />
          <p className="mt-4 rounded-xl bg-mist-100 px-3.5 py-3 text-xs leading-relaxed text-navy-500 ring-1 ring-mist-200">
            {dict.maps.sourceNote}
          </p>
        </>
      )}
      </div>
    </div>
  );
}
