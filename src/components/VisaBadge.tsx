import type { VisaCategory } from "@/lib/visa";

/**
 * The four statuses, colour-coded the way a traveller reads them: green means
 * board the plane, red means don't book yet.
 *
 * Colour is never the only signal — each badge carries its own label, and the
 * status wording from the source sits beside it. Someone who can't tell the
 * green from the red still gets the whole answer in words.
 */
export const VISA_STYLES: Record<VisaCategory, { chip: string; dot: string; icon: string }> = {
  free: { chip: "bg-emerald-100 text-emerald-900", dot: "bg-emerald-500", icon: "✅" },
  arrival: { chip: "bg-sky-100 text-sky-900", dot: "bg-sky-500", icon: "🛬" },
  eta: { chip: "bg-amber-100 text-amber-900", dot: "bg-amber-500", icon: "💻" },
  required: { chip: "bg-rose-100 text-rose-900", dot: "bg-rose-500", icon: "📋" },
  unknown: { chip: "bg-gray-100 text-gray-700", dot: "bg-gray-400", icon: "❔" },
};

export const VISA_ORDER: VisaCategory[] = ["free", "arrival", "eta", "required", "unknown"];

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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${style.chip} ${className}`}
    >
      <span aria-hidden="true">{style.icon}</span>
      {label}
    </span>
  );
}
