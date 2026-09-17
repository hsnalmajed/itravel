"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import SearchForm from "@/components/SearchForm";
import DiscoverForm from "@/components/DiscoverForm";

type Mode = "known" | "discover";

/**
 * The whole planner, on the first screen.
 *
 * This replaces two things that used to be separated by the length of the
 * page: a cut-down search in the hero, and the full planner at the bottom.
 * That split had two costs. A visitor who wanted to set the hotel rating or
 * search multiple cities had to scroll past everything to find out those
 * options existed — and the two forms asked overlapping questions in
 * different words, which reads as two different tools rather than one.
 *
 * So the real forms move up here, complete, and the choice between them
 * becomes the first thing on the panel rather than a decision buried three
 * clicks in. Both are the same components used elsewhere; they take a dark
 * tone (see formTone.ts) rather than being reimplemented, because two copies
 * of a four-hundred-line form is how the two quietly drift apart.
 *
 * The two tabs are a *segmented control*, not two cards. Cards imply two
 * destinations; a segment implies one question with two answers, which is
 * what this is — and it takes a quarter of the height, which matters when
 * what follows it is a full form sitting on a photograph.
 */
export default function HeroPlanner({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const sp = useSearchParams();

  // Arriving from "edit search" carries the mode, so returning to change one
  // field opens the same form you left, already filled in.
  const [mode, setMode] = useState<Mode>(sp.get("mode") === "discover" ? "discover" : "known");

  const tab = (active: boolean) =>
    `flex-1 rounded-xl px-4 py-3 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 sm:text-base ${
      active
        ? "bg-sun-400 text-navy-950 shadow-[var(--shadow-sun)]"
        : "text-white/65 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div
      id="plan"
      className="mt-7 w-full max-w-4xl scroll-mt-24 overflow-hidden rounded-2xl bg-navy-990/55 ring-1 ring-white/15 backdrop-blur-xl"
    >
      {/* ── The one question that comes first ─────────────────────────
          Everything below changes depending on this answer, so it sits
          above everything and is never scrolled past. */}
      <div className="flex gap-1.5 border-b border-white/10 bg-white/[0.04] p-1.5">
        <button
          type="button"
          onClick={() => setMode("known")}
          aria-pressed={mode === "known"}
          className={tab(mode === "known")}
        >
          <span className="me-1.5" aria-hidden="true">
            🎯
          </span>
          {dict.modeSelect.knownTitle}
        </button>
        <button
          type="button"
          onClick={() => setMode("discover")}
          aria-pressed={mode === "discover"}
          className={tab(mode === "discover")}
        >
          <span className="me-1.5" aria-hidden="true">
            🧭
          </span>
          {dict.modeSelect.discoverTitle}
        </button>
      </div>

      {/* One line saying what the chosen mode will do, so the difference
          between the two is legible before the form is filled in rather
          than after it is submitted. */}
      <p className="px-4 pt-3.5 text-xs leading-relaxed text-white/55 sm:px-5">
        {mode === "known" ? dict.modeSelect.knownSubtitle : dict.modeSelect.discoverSubtitle}
      </p>

      {/* Keyed on the mode so the fade replays when they switch — without
          it the fields swap silently and it is easy to miss that the form
          changed underneath you. */}
      <div key={mode} className="tab-fade p-4 sm:p-5">
        {mode === "known" ? (
          <SearchForm locale={locale} tone="dark" />
        ) : (
          <DiscoverForm locale={locale} tone="dark" />
        )}
      </div>
    </div>
  );
}
