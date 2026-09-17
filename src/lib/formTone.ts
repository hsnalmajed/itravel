/**
 * One set of field styles, in two tones.
 *
 * The planner now lives in the hero, on top of a photograph, where a white
 * card would read as a different website pasted over the first one — the same
 * reason the showcase panel went navy. But the same planner still has to work
 * on a pale page elsewhere, and maintaining two copies of a four-hundred-line
 * form so that one of them is dark is how the two quietly drift apart.
 *
 * So the forms take a tone and read their classes from here. Every visual
 * decision about a field lives in this file and nowhere else.
 *
 * The dark tone is deliberately *translucent* rather than a flat dark fill:
 * the hero's photograph shows through it, which is what stops the panel
 * looking like a black box sitting on a picture.
 */
export type FormTone = "light" | "dark";

export interface FormStyles {
  /** Text inputs, selects, and anything that behaves like one. */
  input: string;
  /** The small caption above a field. */
  label: string;
  /** A checkbox's clickable row. */
  checkboxRow: string;
  /** The checkbox itself. */
  checkbox: string;
  /** A segmented choice — trip type, trip route. */
  segment: (active: boolean) => string;
  /** The panel that holds the optional extras. */
  panel: string;
  /** A hairline inside a panel. */
  divider: string;
  /** Body text that is neither a label nor a field. */
  muted: string;
  /** A small secondary action, such as "add a destination". */
  ghostButton: string;
  /** The form's own outer surface. In the hero the panel provides it. */
  surface: string;
}

const LIGHT: FormStyles = {
  input:
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.75 text-sm text-gray-800 shadow-sm transition outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 hover:border-gray-300 placeholder:text-gray-400 placeholder:font-normal",
  label: "block text-sm font-semibold text-gray-700 mb-1.5",
  checkboxRow: "flex items-center gap-2 text-sm text-gray-700",
  checkbox: "h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600",
  segment: (active) =>
    `rounded-xl px-2 py-3 text-xs font-bold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 sm:px-4 sm:text-sm ${
      active
        ? "bg-gradient-to-br from-brand-700 to-brand-900 text-white border-brand-800 shadow-md shadow-brand-900/25"
        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-white hover:border-brand-200 hover:text-brand-800"
    }`,
  panel: "rounded-xl border border-gray-200 bg-gray-50 p-4",
  divider: "border-gray-200",
  muted: "text-sm text-gray-500",
  ghostButton:
    "rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-900 hover:bg-brand-100 transition",
  surface:
    "relative z-10 w-full max-w-4xl mx-auto overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-950/10 ring-1 ring-black/5",
};

const DARK: FormStyles = {
  input:
    "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.75 text-sm text-white outline-none backdrop-blur-md transition placeholder:text-white/45 focus:border-sun-400 focus:bg-white/15 focus:ring-2 focus:ring-sun-400/30 hover:border-white/30",
  label: "block text-2xs font-bold text-white/60 mb-1.5",
  checkboxRow: "flex items-center gap-2 text-sm text-white/80",
  // accent-* colours the native tick itself, which is the only way to get a
  // checked box that isn't stock blue without rebuilding the control.
  checkbox: "h-4 w-4 rounded border-white/30 bg-white/10 accent-[var(--sun-400)]",
  segment: (active) =>
    `rounded-xl px-2 py-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 sm:px-4 sm:text-sm ${
      active
        ? "bg-sun-400 text-navy-950 shadow-[var(--shadow-sun)]"
        : "bg-white/10 text-white/70 ring-1 ring-white/20 hover:bg-white/20 hover:text-white"
    }`,
  panel: "rounded-xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-md",
  divider: "border-white/15",
  muted: "text-sm text-white/55",
  ghostButton:
    "rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition",
  // Nothing: the hero panel around it already is the surface.
  surface: "w-full",
};

export function formStyles(tone: FormTone = "light"): FormStyles {
  return tone === "dark" ? DARK : LIGHT;
}
