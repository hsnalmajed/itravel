"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import SearchForm from "@/components/SearchForm";
import DiscoverForm from "@/components/DiscoverForm";

/**
 * The two ways in.
 *
 * These now live inside the homepage's planner card rather than floating on
 * the seam between hero and page, so they can finally be styled as what they
 * are: two segments of one control. The chosen one goes navy-and-orange, the
 * other stays quiet — a much clearer read than two near-identical white
 * cards with a coloured ring on whichever was clicked.
 */
export default function SearchModeSwitcher({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const sp = useSearchParams();
  // "Edit search" links from the results pages set mode=known or mode=discover
  // explicitly, so returning to edit a previous search opens the right form
  // straight away, pre-filled. On a fresh visit there is no mode param at all
  // — nothing has been chosen yet, so neither form renders until the visitor
  // picks one.
  const initialMode = sp.get("mode") === "discover" ? "discover" : sp.get("mode") === "known" ? "known" : null;
  const [mode, setMode] = useState<"known" | "discover" | null>(initialMode);

  const tab = (active: boolean) =>
    `group flex flex-1 items-start gap-3.5 rounded-2xl px-4 py-4 text-start transition duration-200 ${
      active
        ? "bg-navy-900 shadow-[var(--shadow-card)]"
        : "bg-mist-100 ring-1 ring-mist-200 hover:bg-mist-200/70"
    }`;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row">
        <button type="button" onClick={() => setMode("known")} className={tab(mode === "known")}>
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition ${
              mode === "known" ? "bg-sun-400 text-navy-950" : "bg-white text-navy-700 ring-1 ring-mist-200"
            }`}
          >
            🎯
          </span>
          <span className="min-w-0">
            <span
              className={`block font-display font-extrabold ${
                mode === "known" ? "text-white" : "text-navy-900"
              }`}
            >
              {dict.modeSelect.knownTitle}
            </span>
            <span
              className={`mt-0.5 block text-[0.8rem] leading-snug ${
                mode === "known" ? "text-white/60" : "text-navy-600"
              }`}
            >
              {dict.modeSelect.knownSubtitle}
            </span>
          </span>
        </button>

        <button type="button" onClick={() => setMode("discover")} className={tab(mode === "discover")}>
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition ${
              mode === "discover" ? "bg-sun-400 text-navy-950" : "bg-white text-navy-700 ring-1 ring-mist-200"
            }`}
          >
            🧭
          </span>
          <span className="min-w-0">
            <span
              className={`block font-display font-extrabold ${
                mode === "discover" ? "text-white" : "text-navy-900"
              }`}
            >
              {dict.modeSelect.discoverTitle}
            </span>
            <span
              className={`mt-0.5 block text-[0.8rem] leading-snug ${
                mode === "discover" ? "text-white/60" : "text-navy-600"
              }`}
            >
              {dict.modeSelect.discoverSubtitle}
            </span>
          </span>
        </button>
      </div>

      {mode === "known" && <SearchForm locale={locale} />}
      {mode === "discover" && <DiscoverForm locale={locale} />}
      {mode === null && (
        <p className="rounded-xl bg-sun-50 px-4 py-3 text-center text-[0.82rem] font-semibold text-sun-800 ring-1 ring-sun-200">
          {dict.modeSelect.chooseModeFirst}
        </p>
      )}
    </div>
  );
}
