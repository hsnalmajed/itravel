"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import Photo from "@/components/Photo";
import { countLabel } from "@/lib/format";
import Icon, { type IconName } from "@/components/ui/Icon";
import { openPlanner, type PlanProduct } from "@/lib/planEvents";

export interface ShowcaseDestination {
  code: string;
  name: string;
  photo?: string;
  cities: number;
}

export interface ShowcaseTool {
  href: string;
  icon: string;
  title: string;
  body: string;
}

export interface ShowcaseStep {
  n: string;
  title: string;
  body: string;
}

interface ShowcaseDict {
  tabFeatured: string;
  tabSeason: string;
  tabTools: string;
  tabHow: string;
  tabPlan: string;
  planSubtitle: string;
  flightsTitle: string;
  flightsHint: string;
  hotelsTitle: string;
  hotelsHint: string;
  featuredSubtitle: string;
  featuredCta: string;
  seasonTitle: string;
  seasonSubtitle: string;
  seasonCta: string;
  toolsSubtitle: string;
  toolCta: string;
  stepsTitle: string;
  cityCountOne: string;
  cityCountTwo: string;
  cityCountFew: string;
  cityCountMany: string;
}

type TabKey = "featured" | "season" | "tools" | "how" | "plan";

/**
 * Everything the site is, on one screen.
 *
 * The homepage used to run four full-height sections deep — favourites, then
 * this month, then the tools, then how it works — so seeing what Sfrtna
 * actually offers meant scrolling past three screens of it. A visitor who
 * doesn't scroll never learns the site has visa rules, city maps and currency
 * in it at all, which is most of its value and all of its difference.
 *
 * So the four sections are four tabs in one panel of fixed height. Nothing was
 * cut; it is the same content, reachable in a tap instead of a scroll, and the
 * page is a third of the length it was.
 *
 * The panel is deliberately a constant height across tabs. A tab strip that
 * makes the page jump as you move between tabs feels broken, and the jump is
 * worse than the empty row it avoids.
 *
 * It is navy, not white. A white card under a sunset photograph reads as a
 * different website pasted over the first one — the palette here is navy and
 * sunset orange, and the panel is the biggest surface on the page, so it is
 * the last thing that should be neutral. Dark, it continues the photograph
 * instead of interrupting it, and the destination photos inside it sit on the
 * dark ground they were shot against.
 */
export default function HomeShowcase({
  locale,
  featured,
  inSeason,
  tools,
  steps,
  dict,
}: {
  locale: Locale;
  featured: ShowcaseDestination[];
  inSeason: ShowcaseDestination[];
  tools: ShowcaseTool[];
  steps: ShowcaseStep[];
  dict: ShowcaseDict;
}) {
  const [active, setActive] = useState<TabKey>(inSeason.length > 0 ? "season" : "featured");
  const isAr = locale === "ar";
  const arrow = isAr ? "←" : "→";

  const tabs: { key: TabKey; label: string; hidden?: boolean }[] = [
    { key: "season", label: dict.tabSeason, hidden: inSeason.length === 0 },
    { key: "featured", label: dict.tabFeatured },
    { key: "tools", label: dict.tabTools },
    { key: "how", label: dict.tabHow },
    { key: "plan", label: dict.tabPlan },
  ];

  const blurb: Record<TabKey, string> = {
    featured: dict.featuredSubtitle,
    season: dict.seasonSubtitle,
    tools: dict.toolsSubtitle,
    how: dict.stepsTitle,
    plan: dict.planSubtitle,
  };

  const link: Partial<Record<TabKey, { href: string; label: string }>> = {
    featured: { href: `/${locale}/attractions`, label: dict.featuredCta },
    season: { href: `/${locale}/seasons`, label: dict.seasonCta },
  };

  const tabClass = (on: boolean) =>
    `shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition duration-200 sm:px-5 sm:text-base ${
      on
        ? "bg-sun-400 text-navy-950 shadow-lg shadow-sun-900/25"
        : "text-white/60 hover:bg-white/10 hover:text-white"
    }`;

  // "Plan your trip" is not another thing to browse — it is the way out of
  // browsing and into a search. So it looks like it at rest: sky blue, the
  // one colour on the strip that isn't the orange of "you are here" or the
  // grey of "somewhere else", with a plane on it.
  const planTabClass = (on: boolean) =>
    `inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-extrabold transition duration-200 sm:px-5 sm:text-base ${
      on
        ? "bg-sea-400 text-navy-950 shadow-lg shadow-sea-900/30"
        : "bg-sea-600/25 text-sea-200 ring-1 ring-sea-400/60 hover:bg-sea-600/40 hover:text-white"
    }`;

  const planChoices: { value: PlanProduct; icon: IconName; title: string; hint: string }[] = [
    { value: "flights", icon: "plane", title: dict.flightsTitle, hint: dict.flightsHint },
    { value: "hotels", icon: "hotel", title: dict.hotelsTitle, hint: dict.hotelsHint },
  ];

  const card = (d: ShowcaseDestination) => (
    <Link
      key={d.code}
      href={`/${locale}/attractions/${d.code}`}
      className="group relative isolate block aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:ring-sun-400/50"
    >
      <Photo
        src={d.photo}
        className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
        fallback={<div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-700 to-navy-990" />}
      />
      <div className="scrim-soft absolute inset-0 -z-10" />
      <span
        className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-sun-300 to-sun-600 transition-transform duration-300 group-hover:scale-x-100 rtl:origin-right"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="truncate font-display text-sm font-extrabold text-white drop-shadow-sm sm:text-base">
          {d.name}
        </p>
        {d.cities > 0 && (
          <p className="mt-0.5 truncate text-2xs font-semibold text-sun-300">
            {countLabel(d.cities, {
              one: dict.cityCountOne,
              two: dict.cityCountTwo,
              few: dict.cityCountFew,
              many: dict.cityCountMany,
            })}
          </p>
        )}
      </div>
    </Link>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-b from-navy-900 to-navy-990 shadow-[0_30px_80px_-20px_rgba(4,24,47,0.6)] ring-1 ring-white/10">
        {/* ── The strip ─────────────────────────────────────────────── */}
        <div className="rail rail-fade flex items-center gap-2 overflow-x-auto border-b border-white/10 bg-white/[0.04] px-3 py-3 sm:px-5">
          {tabs
            .filter((t) => !t.hidden)
            .map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                aria-pressed={active === t.key}
                className={t.key === "plan" ? planTabClass(active === t.key) : tabClass(active === t.key)}
              >
                {t.key === "plan" && <Icon name="plane" className="h-4 w-4" />}
                {t.key === "season" ? dict.seasonTitle : t.label}
              </button>
            ))}
        </div>

        {/* ── The panel ─────────────────────────────────────────────── */}
        <div className="p-4 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm leading-relaxed text-white/65">{blurb[active]}</p>
            {link[active] && (
              <Link
                href={link[active]!.href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                {link[active]!.label}
                <span aria-hidden="true">{arrow}</span>
              </Link>
            )}
          </div>

          {/* Keyed on the tab so the fade replays on every switch. The floor
              on the height is what stops the page jumping under the strip
              when a shorter panel replaces a taller one — a jump reads as a
              glitch, and is worse than the blank inch it saves. */}
          <div key={active} className="tab-fade min-h-[16rem] sm:min-h-[15rem]">
            {active === "featured" && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
                {featured.slice(0, 6).map(card)}
              </div>
            )}

            {active === "season" && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
                {inSeason.slice(0, 6).map(card)}
              </div>
            )}

            {active === "tools" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                {tools.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.12] hover:ring-sun-400/40"
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-sun-300 to-sun-600 transition-transform duration-300 group-hover:scale-x-100 rtl:origin-right"
                      aria-hidden="true"
                    />
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sun-400/15 text-xl ring-1 ring-sun-400/30">
                      {t.icon}
                    </span>
                    <h3 className="mt-3.5 font-display text-base font-extrabold text-white">
                      {t.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/60">{t.body}</p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-3.5 text-sm font-bold text-sun-300">
                      {dict.toolCta}
                      <span
                        className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                        aria-hidden="true"
                      >
                        {arrow}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {active === "plan" && (
              <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {planChoices.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => openPlanner(c.value)}
                    className="group flex items-center gap-4 rounded-2xl bg-white/[0.06] p-6 text-start ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.12] hover:ring-sun-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 sm:p-8"
                  >
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sun-400 text-navy-950">
                      <Icon name={c.icon} className="h-7 w-7" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-h3 font-extrabold text-white">{c.title}</span>
                      <span className="mt-0.5 block text-sm text-white/60">{c.hint}</span>
                    </span>
                    <span
                      className="ms-auto text-xl text-sun-300 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                      aria-hidden="true"
                    >
                      {arrow}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {active === "how" && (
              <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                {steps.map((s) => (
                  <li
                    key={s.n}
                    className="relative rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sun-400 font-display text-base font-black text-navy-950">
                      {s.n}
                    </span>
                    <h3 className="mt-3.5 font-display text-base font-extrabold text-white">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/60">{s.body}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
