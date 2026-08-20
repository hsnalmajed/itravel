import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { findCountry, flagEmoji } from "@/lib/countries";
import { fetchToursForCity, findCityById, viatorConfigured } from "@/lib/viator";
import { fetchWikiSummary } from "@/lib/wikipedia";
import TourCard from "@/components/TourCard";

// Live Viator pricing and availability — always fetched per request rather
// than frozen into the build, so a price shown here is the price Viator is
// quoting now.
export const dynamic = "force-dynamic";

export default async function CityToursPage({
  params,
}: PageProps<"/[locale]/attractions/[code]/[city]">) {
  const { locale, code, city } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const country = findCountry(code);
  if (!country) notFound();

  const cityId = Number(city);
  if (!Number.isFinite(cityId)) notFound();

  if (!viatorConfigured()) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <Link
          href={`/${loc}/attractions/${country.code}`}
          className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span aria-hidden="true">{loc === "ar" ? "→" : "←"}</span>
          {dict.attractions.backToCities}
        </Link>
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
          <h1 className="font-bold text-amber-900">{dict.attractions.viatorDisabledTitle}</h1>
          <p className="mt-1.5 text-sm text-amber-800 leading-relaxed">{dict.attractions.viatorDisabledBody}</p>
        </div>
      </div>
    );
  }

  const cityInfo = await findCityById(cityId);
  if (!cityInfo) notFound();

  // A real photo of the city for the hero, from the same live Wikipedia
  // source used everywhere else on this site — falling back to a plain
  // gradient rather than a stand-in image if nothing resolves.
  const [{ tours, total }, citySummary] = await Promise.all([
    // USD for both locales: it's the currency Viator quotes most reliably,
    // and showing the real quoted currency beats converting it ourselves.
    fetchToursForCity(cityId, { count: 50, currency: "USD" }),
    fetchWikiSummary(cityInfo.name),
  ]);

  return (
    <div>
      <div className="relative h-48 sm:h-64 overflow-hidden">
        {citySummary?.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={citySummary.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900 to-brand-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        <div className="relative mx-auto max-w-5xl h-full px-4 sm:px-6 flex flex-col justify-end pb-6">
          <Link
            href={`/${loc}/attractions/${country.code}`}
            className="mb-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-white/90 transition hover:text-white"
          >
            {loc === "ar" ? "→" : "←"} {dict.attractions.backToCities}
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{flagEmoji(country.code)}</span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-sm" dir="ltr">
              {cityInfo.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-brand-900 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-accent-500" aria-hidden="true" />
            {dict.attractions.toursHeading}
          </h2>
          {total > 0 && (
            <p className="mt-1 ms-3 text-sm text-gray-500">
              {dict.attractions.toursCount.replace("{count}", total.toLocaleString())}
            </p>
          )}
        </div>

        {tours.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            {dict.attractions.noToursYet}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {tours.map((tour) => (
                <TourCard key={tour.code} tour={tour} locale={loc} dict={dict.attractions} />
              ))}
            </div>
            <p className="mt-6 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
              {dict.attractions.contentSourceNote}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
