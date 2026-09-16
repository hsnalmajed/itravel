"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/types";
import Photo from "@/components/Photo";

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
  featuredSubtitle: string;
  featuredCta: string;
  seasonTitle: string;
  seasonSubtitle: string;
  seasonCta: string;
  toolsSubtitle: string;
  toolCta: string;
  stepsTitle: string;
  cityCount: string;
}

type TabKey = "featured" | "season" | "tools" | "how";

/**
 * Everything the site is, on one screen.
 *
 * The homepage used to run four full-height sections deep — favourites, then
 * this month, then the tools, then how it works — so seeing what Sfratna
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
  const [active, setActive] = useState<TabKey>("featured");
  const isAr = locale === "ar";
  const arrow = isAr ? "←" : "→";

  const tabs: { key: TabKey; label: string; hidden?: boolean }[] = [
    { key: "featured", label: dict.tabFeatured },
    { key: "season", label: dict.tabSeason, hidden: inSeason.length === 0 },
    { key: "tools", label: dict.tabTools },
    { key: "how", label: dict.tabHow },
  ];

  const blurb: Record<TabKey, string> = {
    featured: dict.featuredSubtitle,
    season: dict.seasonSubtitle,
    tools: dict.toolsSubtitle,
    how: dict.stepsTitle,
  };

  const link: Partial<Record<TabKey, { href: string; label: string }>> = {
    featured: { href: `/${locale}/attractions`, label: dict.featuredCta },
    season: { href: `/${locale}/seasons`, label: dict.seasonCta },
  };

  const tabClass = (on: boolean) =>
    `shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition duration-200 ${
      on
        ? "bg-navy-900 text-white shadow-[var(--shadow-card)]"
        : "text-navy-600 hover:bg-white hover:text-navy-900"
    }`;

  const card = (d: ShowcaseDestination) => (
    <Link
      key={d.code}
      href={`/${locale}/attractions/${d.code}`}
      className="group relative isolate block aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-navy-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
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
          <p className="mt-0.5 truncate text-[0.7rem] font-semibold text-sun-300">
            {dict.cityCount.replace("{count}", String(d.cities))}
          </p>
        )}
      </div>
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[var(--shadow-card)] ring-1 ring-navy-950/5">
        {/* ── The strip ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-mist-200 bg-mist-50 px-3 py-3 sm:px-4">
          {tabs
            .filter((t) => !t.hidden)
            .map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                aria-pressed={active === t.key}
                className={tabClass(active === t.key)}
              >
                {t.key === "season" ? dict.seasonTitle : t.label}
              </button>
            ))}
        </div>

        {/* ── The panel ─────────────────────────────────────────────── */}
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm leading-relaxed text-navy-600">{blurb[active]}</p>
            {link[active] && (
              <Link
                href={link[active]!.href}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-navy-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-navy-800"
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
                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-mist-50 p-5 ring-1 ring-navy-950/5 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[var(--shadow-lift)]"
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-sun-400 to-sun-600 transition-transform duration-300 group-hover:scale-x-100 rtl:origin-right"
                      aria-hidden="true"
                    />
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sun-50 text-xl ring-1 ring-sun-200">
                      {t.icon}
                    </span>
                    <h3 className="mt-3.5 font-display text-base font-extrabold text-navy-900">
                      {t.title}
                    </h3>
                    <p className="mt-1.5 text-[0.82rem] leading-relaxed text-navy-600">{t.body}</p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-3.5 text-sm font-bold text-sun-700">
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

            {active === "how" && (
              <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                {steps.map((s) => (
                  <li
                    key={s.n}
                    className="relative rounded-2xl bg-mist-50 p-5 ring-1 ring-navy-950/5"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 font-display text-base font-black text-sun-400">
                      {s.n}
                    </span>
                    <h3 className="mt-3.5 font-display text-base font-extrabold text-navy-900">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-[0.82rem] leading-relaxed text-navy-600">{s.body}</p>
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
