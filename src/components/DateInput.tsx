"use client";

import { useState } from "react";

// A date field that always reads "DD/MM/YYYY" in gray until a date is
// picked (never a real date pre-filled in as if the user had typed it),
// and always displays the chosen date in DD/MM/YYYY once picked — instead
// of leaving that up to whatever format/locale the visitor's browser
// happens to default a native date input to.
//
// The real <input type="date"> stays fully interactive (native calendar
// picker, keyboard entry, required/min validation all still work exactly
// as before). While it's not focused, we paint its own text transparent
// and lay our own DD/MM/YYYY text on top of it, so the resting formatting
// is guaranteed instead of browser/OS-dependent. While it IS focused —
// actively being typed into or mid-pick from the calendar — we let the
// browser render its own native segments normally instead of hiding them,
// since Chromium always paints the focused segment's own highlight/text
// regardless of an author `color`, and fighting that just doubles up into
// a garbled overlap. The polished DD/MM/YYYY look reappears the instant
// focus leaves the field.
function formatDMY(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

export default function DateInput({
  value,
  onChange,
  min,
  required,
  className,
}: {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  required?: boolean;
  className: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        min={min}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`${className} relative z-10`}
        // Inline styles (not utility classes) so they reliably win over the
        // "bg-white text-gray-800" already baked into `className`, whatever
        // order Tailwind happens to emit the generated CSS in. Only applied
        // at rest — see comment above for why focus reverts to native.
        style={
          focused
            ? undefined
            : { color: "transparent", backgroundColor: "transparent", caretColor: "transparent" }
        }
      />
      {!focused && (
        <div
          aria-hidden="true"
          dir="ltr"
          className={`pointer-events-none absolute inset-y-0 start-0 flex items-center px-4 text-sm ${
            value ? "text-gray-800" : "text-gray-400"
          }`}
        >
          {value ? formatDMY(value) : "DD/MM/YYYY"}
        </div>
      )}
    </div>
  );
}
