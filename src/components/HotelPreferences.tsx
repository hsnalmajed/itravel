"use client";

import type { Locale, TravelerCounts } from "@/lib/types";
import { formStyles, type FormTone } from "@/lib/formTone";
import { getDictionary } from "@/lib/dictionaries";
import {
  MAX_GUESTS_PER_ROOM,
  occupancy,
  roomFitsParty,
  type StayType,
} from "@/lib/stayType";

/**
 * Star rating and stay type, for whichever search form is asking.
 *
 * Both forms had their own copy of these two controls and both showed them as
 * headline fields, level with the destination and the dates. They are not
 * headline fields: most people never touch them, and sitting them next to the
 * questions that actually have to be answered made the form look longer than
 * it is. They live in the extra-options panel now, which is where a preference
 * belongs.
 *
 * Written once and shared rather than pasted twice, because the two forms
 * drifting apart is exactly how a site ends up asking the same question two
 * different ways.
 */
export default function HotelPreferences({
  locale,
  travelers,
  minStars,
  onMinStarsChange,
  stayType,
  onStayTypeChange,
  tone = "light",
}: {
  locale: Locale;
  /** Who is travelling — what decides whether a room is even an option. */
  travelers: TravelerCounts;
  minStars: number;
  onMinStarsChange: (value: number) => void;
  stayType: StayType | "";
  onStayTypeChange: (value: StayType | "") => void;
  /** Inherited from whichever form is hosting this — see formTone.ts. */
  tone?: FormTone;
}) {
  const dict = getDictionary(locale);
  const guests = occupancy(travelers);
  const roomPossible = roomFitsParty(guests);

  const st = formStyles(tone);
  const dark = tone === "dark";
  const inputClass = st.input;
  const labelClass = st.label;

  // A disabled choice has to read as unavailable in both tones — on dark, a
  // grey fill is invisible, so the signal is opacity plus the cursor.
  const choiceClass = (active: boolean, disabled: boolean) =>
    disabled
      ? `rounded-lg px-3 py-2.5 text-sm font-bold border cursor-not-allowed ${
          dark
            ? "border-white/10 bg-white/[0.04] text-white/25"
            : "border-gray-200 bg-gray-100 text-gray-300"
        }`
      : st.segment(active);

  const choices: { value: StayType | ""; label: string; disabled: boolean }[] = [
    { value: "", label: dict.stayType.any, disabled: false },
    { value: "room", label: dict.stayType.room, disabled: !roomPossible },
    { value: "apartment", label: dict.stayType.apartment, disabled: false },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className={labelClass} htmlFor="pref-stars">
          {dict.form.minStars}
        </label>
        <select
          id="pref-stars"
          className={inputClass}
          value={minStars}
          onChange={(e) => onMinStarsChange(Number(e.target.value))}
        >
          <option value={0}>{dict.form.anyStars}</option>
          {[2, 3, 4, 5].map((s) => (
            <option key={s} value={s}>
              {"★".repeat(s)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>{dict.stayType.label}</span>
        <div className="grid grid-cols-3 gap-2">
          {choices.map((c) => (
            <button
              type="button"
              key={c.value || "any"}
              disabled={c.disabled}
              aria-pressed={stayType === c.value}
              onClick={() => onStayTypeChange(c.value)}
              className={choiceClass(stayType === c.value, c.disabled)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Why the choice looks the way it does. A greyed-out button with no
            explanation reads as a bug; with one, it reads as advice. */}
        <p className={`mt-1.5 text-xs leading-relaxed ${dark ? "text-white/55" : "text-gray-500"}`}>
          {roomPossible
            ? dict.stayType.roomFitsHint.replace("{max}", String(MAX_GUESTS_PER_ROOM))
            : dict.stayType.apartmentOnlyHint.replace("{count}", String(guests))}
        </p>
      </div>
    </div>
  );
}
