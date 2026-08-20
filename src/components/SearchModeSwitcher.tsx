"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import SearchForm from "@/components/SearchForm";
import DiscoverForm from "@/components/DiscoverForm";

export default function SearchModeSwitcher({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const sp = useSearchParams();
  // "Edit search" links from the results pages always set mode=known or
  // mode=discover explicitly, so returning to edit a previous search opens
  // the right form right away, pre-filled. On a fresh visit there's no mode
  // param at all — nothing has actually been chosen yet, so neither form
  // (and none of their fields, like the flight/hotel type buttons) should
  // render until the visitor picks one of the two cards below.
  const initialMode = sp.get("mode") === "discover" ? "discover" : sp.get("mode") === "known" ? "known" : null;
  const [mode, setMode] = useState<"known" | "discover" | null>(initialMode);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/*
          These tabs sit across the hero/white-page seam depending on
          viewport height, so their styling can't assume a dark background
          behind the inactive state — always render as a self-contained
          opaque card (readable on hero or page background alike), only the
          active/inactive treatment differs.
        */}
        <button
          type="button"
          onClick={() => setMode("known")}
          className={`group flex items-start gap-3.5 rounded-2xl px-5 py-4 text-start transition ring-1 ${
            mode === "known"
              ? "bg-white ring-2 ring-accent-500 shadow-lg shadow-accent-900/10"
              : "bg-white/95 ring-white/40 shadow-sm hover:bg-white hover:-translate-y-0.5"
          }`}
        >
          <span
            className={`shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
              mode === "known" ? "bg-accent-500 text-white" : "bg-brand-50 text-brand-800"
            }`}
          >
            🎯
          </span>
          <span>
            <p className={`font-bold ${mode === "known" ? "text-brand-950" : "text-gray-700"}`}>
              {dict.modeSelect.knownTitle}
            </p>
            <p className="text-sm mt-0.5 text-gray-500">{dict.modeSelect.knownSubtitle}</p>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode("discover")}
          className={`group flex items-start gap-3.5 rounded-2xl px-5 py-4 text-start transition ring-1 ${
            mode === "discover"
              ? "bg-white ring-2 ring-accent-500 shadow-lg shadow-accent-900/10"
              : "bg-white/95 ring-white/40 shadow-sm hover:bg-white hover:-translate-y-0.5"
          }`}
        >
          <span
            className={`shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
              mode === "discover" ? "bg-accent-500 text-white" : "bg-brand-50 text-brand-800"
            }`}
          >
            🧭
          </span>
          <span>
            <p className={`font-bold ${mode === "discover" ? "text-brand-950" : "text-gray-700"}`}>
              {dict.modeSelect.discoverTitle}
            </p>
            <p className="text-sm mt-0.5 text-gray-500">{dict.modeSelect.discoverSubtitle}</p>
          </span>
        </button>
      </div>

      {mode === "known" && <SearchForm locale={locale} />}
      {mode === "discover" && <DiscoverForm locale={locale} />}
      {mode === null && (
        // Self-contained opaque pill, not a plain text color — this sits
        // right across the hero/white-page seam (see the note on the mode
        // cards above), so it can't assume what's behind it either.
        <p className="mx-auto w-fit rounded-full bg-white/95 px-4 py-2 text-center text-sm font-semibold text-gray-500 shadow-sm ring-1 ring-black/5">
          {dict.modeSelect.chooseModeFirst}
        </p>
      )}
    </div>
  );
}
