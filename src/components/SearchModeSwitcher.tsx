"use client";

import { useState } from "react";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import SearchForm from "@/components/SearchForm";
import DiscoverForm from "@/components/DiscoverForm";

export default function SearchModeSwitcher({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [mode, setMode] = useState<"known" | "discover">("known");

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => setMode("known")}
          className={`rounded-2xl px-5 py-4 text-start transition ring-1 ${
            mode === "known"
              ? "bg-white ring-brand-200 shadow-lg"
              : "bg-white/10 ring-white/20 hover:bg-white/15"
          }`}
        >
          <p className={`font-bold ${mode === "known" ? "text-brand-900" : "text-white"}`}>
            🎯 {dict.modeSelect.knownTitle}
          </p>
          <p className={`text-sm mt-0.5 ${mode === "known" ? "text-gray-500" : "text-white/80"}`}>
            {dict.modeSelect.knownSubtitle}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("discover")}
          className={`rounded-2xl px-5 py-4 text-start transition ring-1 ${
            mode === "discover"
              ? "bg-white ring-brand-200 shadow-lg"
              : "bg-white/10 ring-white/20 hover:bg-white/15"
          }`}
        >
          <p className={`font-bold ${mode === "discover" ? "text-brand-900" : "text-white"}`}>
            🧭 {dict.modeSelect.discoverTitle}
          </p>
          <p className={`text-sm mt-0.5 ${mode === "discover" ? "text-gray-500" : "text-white/80"}`}>
            {dict.modeSelect.discoverSubtitle}
          </p>
        </button>
      </div>

      {mode === "known" ? <SearchForm locale={locale} /> : <DiscoverForm locale={locale} />}
    </div>
  );
}
