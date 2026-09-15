import { Suspense } from "react";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { COUNTRY_CITIES } from "@/lib/cities";
import { findCountry } from "@/lib/countries";
import { fetchCountryPhotos } from "@/lib/countryPhotos";
import { fetchCommonsImage } from "@/lib/commonsImage";
import { countriesByMonth, monthName } from "@/lib/seasons";
import SearchModeSwitcher from "@/components/SearchModeSwitcher";
import SectionHeading from "@/components/ui/SectionHeading";
import Photo from "@/components/Photo";

export const dynamic = "force-dynamic";

/**
 * The destinations the homepage leads with.
 *
 * Hand-picked rather than "first nine in the data": the front page has one
 * job, which is to make someone want to go somewhere, and that argument is
 * won by places a Saudi traveller already half-wants — Istanbul, Tbilisi,
 * the Maldives — not by whichever country sorts first alphabetically.
 *
 * Nine, not ten. The first card spans two columns and two rows, so the grid
 * only comes out flush when the remaining eight exactly fill what is left:
 * 2 cols → 4+8 = 12 cells over 6 rows; 3 cols → 12 over 4 rows; 6 cols → 12
 * over 2 rows. Ten destinations left a visible hole at every width.
 */
const FEATURED = ["TR", "GE", "MV", "MY", "JP", "ES", "AZ", "TH", "IT"];

/**
 * The photograph the whole homepage rests on: Qasr Sahoud in Al-Ahsa.
 *
 * Named rather than discovered. A Saudi traveller should land on somewhere
 * they know — the site is built for them, and opening on a foreign skyline
 * says the opposite. Qasr Sahoud earns the slot on its own terms too: a mud
 * fort against a real blue sky reads instantly at hero size, and there is no
 * identifiable face in the frame.
 */
const HERO_FILE = "Qasr_sahood.jpg";

/**
 * Where the hero falls back to if Commons can't be reached — the same
 * discovered country photos the destination cards use.
 */
const HERO_CANDIDATES = ["TR", "MV", "GE", "IT", "JP"];

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);
  const isAr = loc === "ar";

  const guideCodes = Object.keys(COUNTRY_GUIDES);
  const cityCount = guideCodes.reduce((n, code) => n + (COUNTRY_CITIES[code]?.length ?? 0), 0);

  // This month, and the countries whose own guide recommends it. The seasons
  // page derives these from the same table, so the homepage can never drift
  // out of agreement with it.
  const month = new Date().getMonth() + 1;
  const inSeasonCodes = (countriesByMonth().get(month) ?? []).slice(0, 6);

  const photoCodes = Array.from(new Set([...HERO_CANDIDATES, ...FEATURED, ...inSeasonCodes]));
  const [photos, heroImage] = await Promise.all([
    fetchCountryPhotos(photoCodes),
    fetchCommonsImage(HERO_FILE),
  ]);

  const heroPhoto = heroImage?.url ?? HERO_CANDIDATES.map((c) => photos.get(c)).find(Boolean);
  const nameOf = (code: string) => {
    const c = findCountry(code);
    return c ? (isAr ? c.nameAr : c.nameEn) : code;
  };

  const featured = FEATURED.map((code) => ({
    code,
    name: nameOf(code),
    photo: photos.get(code),
    cities: COUNTRY_CITIES[code]?.length ?? 0,
  }));

  const inSeason = inSeasonCodes.map((code) => ({
    code,
    name: nameOf(code),
    photo: photos.get(code),
  }));

  const stats = [
    { value: String(guideCodes.length), label: dict.home.statCountries },
    { value: String(cityCount), label: dict.home.statCities },
    { value: "6", label: dict.home.statContinents },
  ];

  const tools = [
    { href: `/${loc}/attractions`, icon: "🏛", title: dict.home.toolAttractions, body: dict.home.toolAttractionsBody },
    { href: `/${loc}/maps`, icon: "🗺", title: dict.home.toolMaps, body: dict.home.toolMapsBody },
    { href: `/${loc}/visa`, icon: "🛂", title: dict.home.toolVisa, body: dict.home.toolVisaBody },
    { href: `/${loc}/currency`, icon: "💱", title: dict.home.toolCurrency, body: dict.home.toolCurrencyBody },
  ];

  return (
    <div className="bg-mist-50">
      {/* ── Hero ─────────────────────────────────────────────────────────
          One photograph, edge to edge, with the header sitting on top of
          it. Everything the old hero tried to do with gradients and a
          wireframe globe, a real picture of somewhere does better. */}
      <section className="relative isolate flex min-h-[86svh] items-end overflow-hidden bg-navy-990">
        <Photo
          src={heroPhoto}
          priority
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          fallback={
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(130%_100%_at_60%_0%,var(--navy-700),var(--navy-990))]" />
          }
        />
        <div className="scrim absolute inset-0 -z-10" />

        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:px-6 sm:pb-24">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[0.72rem] font-bold tracking-wide text-sun-200 ring-1 ring-white/15 backdrop-blur-md">
            ✈️ {dict.hero.badge}
          </p>

          <h1 className="max-w-3xl font-display text-[2.1rem] font-black leading-[1.12] text-white drop-shadow-[0_2px_18px_rgba(4,24,47,0.55)] sm:text-6xl">
            {dict.hero.titleLine1}
            <br />
            <span className="text-sunlit">{dict.hero.titleLine2}</span>
          </h1>

          <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-white/75 sm:text-lg">
            {dict.hero.subtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-end gap-x-10 gap-y-5 border-t border-white/15 pt-6">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl font-black leading-none text-sun-400 sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/55">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* These photographs are licensed on the condition that the
            photographer is named. */}
        {heroImage && (
          <a
            href={heroImage.descriptionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 end-3 z-10 text-[0.6rem] text-white/45 transition hover:text-white/75"
          >
            {dict.hero.photoCredit
              .replace("{artist}", heroImage.artist ?? "Wikimedia Commons")
              .replace("{license}", heroImage.license ?? "")}
          </a>
        )}
      </section>

      {/* ── The planner ─────────────────────────────────────────────────
          Lifted so it straddles the seam between photograph and page: the
          card is the first thing that isn't scenery, which is exactly the
          emphasis the site's one differentiating feature deserves. */}
      <section id="plan" className="relative z-10 -mt-16 px-4 pb-16 sm:-mt-20 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[1.75rem] bg-white/95 p-5 shadow-[var(--shadow-lift)] ring-1 ring-navy-950/5 backdrop-blur-xl sm:p-7">
            <div className="mb-5 text-center">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-sun-700">
                {dict.home.planEyebrow}
              </p>
              <h2 className="mt-1.5 font-display text-xl font-extrabold text-navy-900 sm:text-2xl">
                {dict.home.planTitle}
              </h2>
            </div>
            <Suspense fallback={null}>
              <SearchModeSwitcher locale={loc} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── Featured destinations ───────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <SectionHeading
          eyebrow={dict.home.featuredEyebrow}
          title={dict.home.featuredTitle}
          subtitle={dict.home.featuredSubtitle}
          action={
            <Link
              href={`/${loc}/attractions`}
              className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-navy-800"
            >
              {dict.home.featuredCta}
              <span aria-hidden="true">{isAr ? "←" : "→"}</span>
            </Link>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {featured.map((d, i) => (
            <Link
              key={d.code}
              href={`/${loc}/attractions/${d.code}`}
              className={`group relative isolate block overflow-hidden rounded-2xl ring-1 ring-navy-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${
                // The first card earns twice the room — a grid of identical
                // tiles has no entry point, and the eye needs one.
                i === 0 ? "col-span-2 row-span-2" : "aspect-[4/5]"
              }`}
            >
              <Photo
                src={d.photo}
                className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
                fallback={<div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-700 to-navy-990" />}
              />
              <div className="scrim-soft absolute inset-0 -z-10" />
              <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                <p
                  className={`font-display font-extrabold text-white drop-shadow-sm ${
                    i === 0 ? "text-xl sm:text-3xl" : "text-sm sm:text-base"
                  }`}
                >
                  {d.name}
                </p>
                {d.cities > 0 && (
                  <p className="mt-0.5 text-[0.7rem] font-semibold text-sun-300">
                    {dict.home.cityCount.replace("{count}", String(d.cities))}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── In season now ───────────────────────────────────────────────
          A calendar answer to "when", placed where a traveller is already
          thinking about where. It is also the only part of the homepage
          that changes by itself, month to month. */}
      {inSeason.length > 0 && (
        <section className="bg-navy-990">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <SectionHeading
              tone="light"
              eyebrow={dict.home.seasonEyebrow}
              title={dict.home.seasonTitle.replace("{month}", monthName(month, loc))}
              subtitle={dict.home.seasonSubtitle}
              action={
                <Link
                  href={`/${loc}/seasons`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sun-400 px-4 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-sun-300"
                >
                  {dict.home.seasonCta}
                  <span aria-hidden="true">{isAr ? "←" : "→"}</span>
                </Link>
              }
            />

            <div className="rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-6">
              {inSeason.map((d) => (
                <Link
                  key={d.code}
                  href={`/${loc}/attractions/${d.code}`}
                  className="group relative isolate block aspect-[3/4] w-36 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 transition hover:-translate-y-1 sm:w-auto"
                >
                  <Photo
                    src={d.photo}
                    className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    fallback={<div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-700 to-navy-990" />}
                  />
                  <div className="scrim-soft absolute inset-0 -z-10" />
                  <p className="absolute inset-x-0 bottom-0 truncate p-3 font-display text-sm font-bold text-white">
                    {d.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Traveller tools ─────────────────────────────────────────────
          The site's real depth — maps, visas, rates — was previously
          reachable only from the nav bar, so most visitors never learned it
          existed. */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          align="center"
          eyebrow={dict.home.toolsEyebrow}
          title={dict.home.toolsTitle}
          subtitle={dict.home.toolsSubtitle}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-navy-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
            >
              <span
                className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-sun-400 to-sun-600 transition-transform duration-300 group-hover:scale-x-100 rtl:origin-right"
                aria-hidden="true"
              />
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sun-50 text-2xl ring-1 ring-sun-200">
                {t.icon}
              </span>
              <h3 className="mt-4 font-display text-lg font-extrabold text-navy-900">{t.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{t.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-sun-700">
                {dict.home.toolCta}
                <span
                  className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                  aria-hidden="true"
                >
                  {isAr ? "←" : "→"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="border-t border-mist-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading
            align="center"
            eyebrow={dict.home.stepsEyebrow}
            title={dict.home.stepsTitle}
          />

          <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
            <div
              className="absolute inset-x-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-sun-300 to-transparent sm:block"
              aria-hidden="true"
            />
            {[
              { n: "1", title: dict.home.step1Title, body: dict.home.step1Body },
              { n: "2", title: dict.home.step2Title, body: dict.home.step2Body },
              { n: "3", title: dict.home.step3Title, body: dict.home.step3Body },
            ].map((s) => (
              <div key={s.n} className="relative text-center">
                <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 font-display text-xl font-black text-sun-400 ring-4 ring-white">
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-lg font-extrabold text-navy-900">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-navy-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
