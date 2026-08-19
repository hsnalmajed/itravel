"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale, TravelerCounts } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";

const MAX_ADULTS = 9;
const MAX_CHILDREN = 6;
const MAX_INFANTS = 4;
const DEFAULT_CHILD_AGE = 6;

function summarize(value: TravelerCounts, dict: ReturnType<typeof getDictionary>): string {
  const parts: string[] = [];
  parts.push(`${value.adults} ${value.adults === 1 ? dict.travelers.adultShort : dict.travelers.adultsShort}`);
  if (value.childrenAges.length > 0) {
    parts.push(
      `${value.childrenAges.length} ${value.childrenAges.length === 1 ? dict.travelers.childShort : dict.travelers.childrenShort}`
    );
  }
  if (value.infants > 0) {
    parts.push(`${value.infants} ${value.infants === 1 ? dict.travelers.infantShort : dict.travelers.infantsShort}`);
  }
  return parts.join(" · ");
}

function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          −
        </button>
        <span className="w-4 text-center text-sm font-semibold text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function TravelersPicker({
  locale,
  value,
  onChange,
}: {
  locale: Locale;
  value: TravelerCounts;
  onChange: (next: TravelerCounts) => void;
}) {
  const dict = getDictionary(locale);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none transition";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass} flex items-center justify-between text-start`}
      >
        <span>{summarize(value, dict)}</span>
        <span aria-hidden="true">🧑‍🤝‍🧑</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full sm:w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-xl divide-y divide-gray-100">
          <Counter
            label={dict.travelers.adults}
            hint={dict.travelers.adultsHint}
            value={value.adults}
            min={1}
            max={MAX_ADULTS}
            onChange={(adults) => onChange({ ...value, adults })}
          />
          <div className="py-2">
            <Counter
              label={dict.travelers.children}
              hint={dict.travelers.childrenHint}
              value={value.childrenAges.length}
              min={0}
              max={MAX_CHILDREN}
              onChange={(count) => {
                const next = [...value.childrenAges];
                while (next.length < count) next.push(DEFAULT_CHILD_AGE);
                while (next.length > count) next.pop();
                onChange({ ...value, childrenAges: next });
              }}
            />
            {value.childrenAges.length > 0 && (
              <div className="mt-1 space-y-1.5 ps-1">
                {value.childrenAges.map((age, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                    <span>
                      {dict.travelers.childAgeLabel} {i + 1}
                    </span>
                    <select
                      value={age}
                      onChange={(e) => {
                        const next = [...value.childrenAges];
                        next[i] = Number(e.target.value);
                        onChange({ ...value, childrenAges: next });
                      }}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                    >
                      {Array.from({ length: 12 }, (_, y) => y + 1).map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Counter
            label={dict.travelers.infants}
            hint={dict.travelers.infantsHint}
            value={value.infants}
            min={0}
            max={MAX_INFANTS}
            onChange={(infants) => onChange({ ...value, infants })}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-900 transition"
          >
            {dict.travelers.done}
          </button>
        </div>
      )}
    </div>
  );
}
