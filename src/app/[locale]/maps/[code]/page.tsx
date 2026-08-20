import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry, flagEmoji } from "@/lib/countries";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { COUNTRY_CITIES } from "@/lib/cities";
import { fetchWikiSummaries } from "@/lib/wikipedia";
import { buildLegend, pinsAroundCities, type MapPin } from "@/lib/mapPins";
import { PIN_STYLES } from "@/lib/pinStyles";
import AttractionsMap from "@/components/AttractionsMap";
import MapDownloads from "@/components/MapDownloads";

export const dynamic = "force-dynamic";

export default async function CountryMapPage({ params }: PageProps<"/[locale]/maps/[code]">) {
  const { locale, code } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const country = findCountry(code);
  if (!country) notFound();

  const guide = COUNTRY_GUIDES[country.code];
  if (!guide) notFound();

  const countryName = loc === "ar" ? country.nameAr : country.nameEn;
  const cities = COUNTRY_CITIES[country.code] ?? [];

  const landmarkTitles = guide.attractions.map((a) => a.wikiTitle);
  const activityTitles = guide.activities
    .map((a) => a.wikiTitle)
    .filter((t): t is string => Boolean(t));

  // The country map is built from two sources at once, fetched together:
  //   1. the hand-written guide, whose entries carry proper Arabic names and
  //      a photo we've already looked up;
  //   2. every documented place around each of the country's tourist cities,
  //      which is what turns a handful of pins into hundreds.
  const [summaries, cityPins] = await Promise.all([
    fetchWikiSummaries([...landmarkTitles, ...activityTitles]),
    pinsAroundCities(cities),
  ]);

  // Only places Wikipedia actually gives coordinates for get a pin. An
  // approximate or guessed position would be worse than no pin at all.
  const guidePins: MapPin[] = [
    ...guide.attractions.map((a) => ({ entry: a, category: "historic" as const, title: a.wikiTitle })),
    ...guide.activities
      .filter((a) => a.wikiTitle)
      .map((a) => ({ entry: a, category: "activity" as const, title: a.wikiTitle as string })),
  ]
    .map(({ entry, category, title }): MapPin | null => {
      const s = summaries.get(title);
      if (typeof s?.lat !== "number" || typeof s?.lon !== "number") return null;
      return {
        key: title,
        nameAr: entry.nameAr,
        nameEn: entry.nameEn,
        lat: s.lat,
        lon: s.lon,
        photo: s.thumbnail,
        extract: s.extract,
        category,
      };
    })
    .filter((p): p is MapPin => p !== null);

  // A curated landmark usually also turns up in its city's GeoSearch. The
  // guide's version wins, because it has the Arabic name and the photo.
  const guideTitles = new Set(guidePins.map((p) => p.nameEn));
  const pins: MapPin[] = [
    ...guidePins,
    ...cityPins.filter((p) => !guideTitles.has(p.nameEn)),
  ];

  const legend = buildLegend(pins, {
    historic: dict.maps.legendHistoric,
    food: dict.maps.legendFood,
    activity: dict.maps.legendCityActivity,
    place: dict.maps.legendPlace,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <Link
        href={`/${loc}/maps`}
        className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <span aria-hidden="true">{loc === "ar" ? "→" : "←"}</span>
        {dict.maps.backToMaps}
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 text-xl sm:text-2xl font-extrabold text-gray-900">
          <span className="text-2xl leading-none">{flagEmoji(country.code)}</span>
          {dict.maps.countryMapTitle.replace("{country}", countryName)}
        </h1>
      </div>

      {legend.length > 0 && (
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
      )}

      {pins.length === 0 ? (
        <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-5 text-sm text-amber-800 leading-relaxed">
          {dict.maps.noPins}
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">
            📍 {dict.maps.pinsCount.replace("{count}", String(pins.length))}
          </p>
          {cities.length > 0 && (
            <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-800 ring-1 ring-brand-100">
              {dict.maps.countryOverviewNote}
            </p>
          )}
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
            title={dict.maps.countryMapTitle.replace("{country}", countryName)}
            fileBase={`iTravel-${country.nameEn}-map`}
            dict={dict.maps}
          />
          <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
            {dict.maps.sourceNote}
          </p>
        </>
      )}

      {cities.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-brand-900 mb-1 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
            {dict.maps.citiesHeading}
          </h2>
          <p className="text-sm text-gray-500 mb-4 ms-3">{dict.maps.citiesSubtitle}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cities.map((c) => (
              <Link
                key={c.slug}
                href={`/${loc}/maps/${country.code}/${c.slug}`}
                className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-brand-200 hover:shadow-md"
              >
                <span className="text-base leading-none" aria-hidden="true">🗺️</span>
                <span className="text-sm font-semibold text-gray-800 truncate">
                  {loc === "ar" ? c.nameAr : c.nameEn}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
