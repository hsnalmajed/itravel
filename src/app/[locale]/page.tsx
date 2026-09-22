import { Suspense } from "react";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { COUNTRY_CITIES } from "@/lib/cities";
import { findCountry } from "@/lib/countries";
import { fetchCountryPhotos } from "@/lib/countryPhotos";
import { fetchCommonsImage } from "@/lib/commonsImage";
import { heroPhotoForToday } from "@/lib/heroPhotos";
import { countriesByMonth, monthName } from "@/lib/seasons";
import HomeShowcase from "@/components/HomeShowcase";
import HeroPlanner from "@/components/HeroPlanner";
import Photo from "@/components/Photo";
import { brandJsonLd } from "@/lib/seo";

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

  // A different corner of the world each day — see heroPhotos.ts for the
  // brief these are chosen against.
  const heroPick = heroPhotoForToday();
  const photoCodes = Array.from(new Set([...HERO_CANDIDATES, ...FEATURED, ...inSeasonCodes]));
  const [photos, heroImage] = await Promise.all([
    fetchCountryPhotos(photoCodes),
    fetchCommonsImage(heroPick.file),
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


  const faqs = [
    { q: dict.home.faqQ1, a: dict.home.faqA1 },
    { q: dict.home.faqQ2, a: dict.home.faqA2 },
    { q: dict.home.faqQ3, a: dict.home.faqA3 },
    { q: dict.home.faqQ4, a: dict.home.faqA4 },
  ];

  const steps = [
    { n: "1", title: dict.home.step1Title, body: dict.home.step1Body },
    { n: "2", title: dict.home.step2Title, body: dict.home.step2Body },
    { n: "3", title: dict.home.step3Title, body: dict.home.step3Body },
  ];

  return (
    <div className="bg-mist-50">
      {/* The site's name and every spelling of it, for search engines. Only
          on the homepage, which is where Google reads it from — see seo.ts. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandJsonLd(loc)) }}
      />
      {/* ── Hero ─────────────────────────────────────────────────────────
          The photograph and the planner, together.

          It is no longer measured in svh. A fixed slab worked when the hero
          held a headline and a button; now that the whole form lives in it —
          and that form changes height as options open and as the mode
          switches — a fixed height would either clip it or leave a gap under
          the short version. It takes the height its contents need, with a
          floor so it still reads as a hero on a short window. */}
      <section className="relative isolate flex min-h-[46rem] items-center overflow-hidden bg-navy-990 lg:min-h-[44rem]">
        <Photo
          src={heroPhoto}
          priority
          srcSet={
            heroImage?.url4k ? `${heroImage.url} 1920w, ${heroImage.url4k} 3840w` : undefined
          }
          sizes="100vw"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          fallback={
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(130%_100%_at_60%_0%,var(--navy-700),var(--navy-990))]" />
          }
        />
        <div className="scrim-soft absolute inset-0 -z-10" />

        {/* Centred, because the panel is the point.
            Left-aligned, the headline ran along one edge and the search
            panel — narrower than the page — sat under it off to one side,
            so the first thing the eye met was a column of empty photograph.
            A hero whose whole reason for existing is one panel puts that
            panel in the middle of the window. */}
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-14 pt-28 text-center sm:px-6 sm:pb-16">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-2xs font-bold tracking-wide text-sun-200 ring-1 ring-white/15 backdrop-blur-md">
            ✈️ {dict.hero.badge}
          </p>

          <h1 className="max-w-3xl font-display text-h1 font-black text-white drop-shadow-[0_2px_18px_rgba(4,24,47,0.55)]">
            {dict.hero.titleLine1}
            <br />
            <span className="text-sunlit">{dict.hero.titleLine2}</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm text-white/80 drop-shadow-[0_1px_10px_rgba(4,24,47,0.75)] sm:text-base">
            {dict.hero.subtitle}
          </p>

          {/* The whole planner, not a cut-down version of it. Both modes and
              every option now live here; see HeroPlanner for why the full
              form moved up and the section at the foot of the page went. */}
          <Suspense fallback={null}>
            <HeroPlanner locale={loc} />
          </Suspense>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {stats.map((s) => (
              <p key={s.label} className="text-sm font-semibold text-white/70">
                <span className="font-display text-xl font-black text-sun-400">{s.value}</span>{" "}
                {s.label}
              </p>
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
            className="absolute bottom-2 end-3 z-10 text-2xs text-white/45 transition hover:text-white/75"
          >
            {dict.hero.photoCredit
              .replace("{place}", isAr ? heroPick.placeAr : heroPick.placeEn)
              .replace("{artist}", heroImage.artist ?? "Wikimedia Commons")
              .replace("{license}", heroImage.license ?? "")}
          </a>
        )}
      </section>

      {/* ── What the site is ────────────────────────────────────────────
          Four sections of the old page, now four tabs in one panel that
          straddles the seam below the photograph. See HomeShowcase. */}
      <section className="relative z-10 -mt-20 pb-14 sm:-mt-24 sm:pb-16">
        <HomeShowcase
          locale={loc}
          featured={featured}
          inSeason={inSeason.map((d) => ({ ...d, cities: 0 }))}
          tools={tools}
          steps={steps}
          dict={{
            tabFeatured: dict.home.tabFeatured,
            tabSeason: dict.home.tabSeason,
            tabTools: dict.home.tabTools,
            tabHow: dict.home.tabHow,
            featuredSubtitle: dict.home.featuredSubtitle,
            featuredCta: dict.home.featuredCta,
            seasonTitle: dict.home.seasonTitle.replace("{month}", monthName(month, loc)),
            seasonSubtitle: dict.home.seasonSubtitle,
            seasonCta: dict.home.seasonCta,
            toolsSubtitle: dict.home.toolsSubtitle,
            toolCta: dict.home.toolCta,
            stepsTitle: dict.home.stepsTitle,
            cityCountOne: dict.home.cityCountOne,
            cityCountTwo: dict.home.cityCountTwo,
            cityCountFew: dict.home.cityCountFew,
            cityCountMany: dict.home.cityCountMany,
          }}
        />
      </section>


      {/* ── What people ask before they trust a price ────────────────────
          A comparison site is asking a stranger to believe a number. The
          four questions below are the ones that decide whether they do —
          who takes the money, whether the price is real, what it costs
          them, and whether the visa line can be relied on. Answering them
          on the front page is cheaper than losing the visitor to the doubt.

          Marked up as FAQPage so the answers can appear in search results,
          where the same doubts get typed. */}
      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="mb-7 text-center">
            <p className="eyebrow">{dict.home.faqEyebrow}</p>
            <h2 className="rule-sun rule-sun-center mt-1.5 font-display text-h2 font-extrabold text-navy-900">
              {dict.home.faqTitle}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl bg-mist-50 px-5 py-4 ring-1 ring-mist-200 transition hover:ring-navy-200"
              >
                <summary className="cursor-pointer list-none text-sm font-bold text-navy-900 marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <span
                      className="shrink-0 text-navy-400 transition group-open:rotate-45"
                      aria-hidden="true"
                    >
                      ＋
                    </span>
                  </span>
                </summary>
                <p className="mt-2.5 text-sm leading-relaxed text-navy-600">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href={`/${loc}/about`}
              className="text-sm font-bold text-navy-700 underline decoration-sun-400 decoration-2 underline-offset-4 transition hover:text-sun-700"
            >
              {dict.home.faqMore}
            </Link>
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      </section>
    </div>
  );
}
