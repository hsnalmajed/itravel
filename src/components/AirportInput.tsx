"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/types";
import { airportLabel, searchAirports } from "@/lib/airports";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition placeholder:text-gray-400 placeholder:font-normal";

export default function AirportInput({
  locale,
  value,
  onChange,
  placeholder,
  required,
}: {
  locale: Locale;
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState(() => (value ? airportLabel(value, locale) : ""));
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the visible text in sync when the value changes from outside this
  // component (edit-search prefill, or the parent resetting the field).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(value ? airportLabel(value, locale) : "");
  }, [value, locale]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = open ? searchAirports(query) : [];

  return (
    <div className="relative" ref={containerRef}>
      <input
        className={inputClass}
        value={query}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {results.map((a) => (
            <button
              type="button"
              key={a.iata}
              onClick={() => {
                onChange(a.iata);
                setQuery(airportLabel(a.iata, locale));
                setOpen(false);
              }}
              className="block w-full px-4 py-2 text-start hover:bg-brand-50 transition"
            >
              <div className="text-sm font-semibold text-gray-800">
                {locale === "ar" ? a.nameAr : a.nameEn}
                <span className="ms-1.5 font-normal text-gray-400">· {a.iata}</span>
              </div>
              <div className="text-xs text-gray-500">
                {locale === "ar" ? a.cityAr : a.cityEn} · {locale === "ar" ? a.countryAr : a.countryEn}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
