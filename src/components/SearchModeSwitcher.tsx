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
  // "Edit search" links from the discover-results page set mode=discover so
  // the right form (with its own fields pre-filled) opens by default.
  const [mode, setMode] = useState<"known" | "discover">(sp.get("mode") === "discover" ? "discover" : "known");

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
          className={`rounded-2xl px-5 py-4 text-start transition ring-1 ${
            mode === "known"
              ? "bg-white ring-brand-200 shadow-lg"
              : "bg-white/95 ring-white/40 shadow-sm hover:bg-white"
          }`}
        >
          <p className={`font-bold ${mode === "known" ? "text-brand-900" : "text-gray-700"}`}>
            🎯 {dict.modeSelect.knownTitle}
          </p>
          <p className={`text-sm mt-0.5 ${mode === "known" ? "text-gray-500" : "text-gray-500"}`}>
            {dict.modeSelect.knownSubtitle}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("discover")}
          className={`rounded-2xl px-5 py-4 text-start transition ring-1 ${
            mode === "discover"
              ? "bg-white ring-brand-200 shadow-lg"
              : "bg-white/95 ring-white/40 shadow-sm hover:bg-white"
          }`}
        >
          <p className={`font-bold ${mode === "discover" ? "text-brand-900" : "text-gray-700"}`}>
            🧭 {dict.modeSelect.discoverTitle}
          </p>
          <p className={`text-sm mt-0.5 ${mode === "discover" ? "text-gray-500" : "text-gray-500"}`}>
            {dict.modeSelect.discoverSubtitle}
          </p>
        </button>
      </div>

      {mode === "known" ? <SearchForm locale={locale} /> : <DiscoverForm locale={locale} />}
    </div>
  );
}
