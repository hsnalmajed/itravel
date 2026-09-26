import type { VisaCategory } from "@/data/visaStatus";

/**
 * The four statuses, colour-coded the way a traveller reads them: green means
 * book the flight, red means sort the visa first.
 *
 * These are the one place on the site that steps outside the navy / sun / sea
 * palette, on purpose: a status is a traffic signal, and green-to-red is the
 * signal everyone already reads. Colour is never the only signal — each badge
 * carries an icon and its own words, so someone who cannot tell the green
 * from the red still gets the whole answer.
 */
export const VISA_STYLES: Record<VisaCategory, { chip: string; dot: string; icon: string }> = {
  free: { chip: "bg-emerald-100 text-emerald-900 ring-emerald-200", dot: "bg-emerald-500", icon: "✅" },
  arrival: { chip: "bg-sky-100 text-sky-900 ring-sky-200", dot: "bg-sky-500", icon: "🛬" },
  eta: { chip: "bg-amber-100 text-amber-900 ring-amber-200", dot: "bg-amber-500", icon: "💻" },
  required: { chip: "bg-rose-100 text-rose-900 ring-rose-200", dot: "bg-rose-500", icon: "📋" },
};

export default function VisaBadge({
  category,
  label,
  className = "",
}: {
  category: VisaCategory;
  label: string;
  className?: string;
}) {
  const style = VISA_STYLES[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${style.chip} ${className}`}
    >
      <span aria-hidden="true">{style.icon}</span>
      {label}
    </span>
  );
}
