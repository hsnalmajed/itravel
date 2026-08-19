import type { DestinationPairSuggestion, Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";

export default function DestinationPairCard({
  pair,
  locale,
}: {
  pair: DestinationPairSuggestion;
  locale: Locale;
}) {
  const dict = getDictionary(locale);

  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 transition hover:shadow-md ${
        pair.withinBudget ? "ring-brand-blue/10" : "ring-red-100"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 font-bold text-gray-900">
          {pair.legs.map((leg, i) => (
            <span key={leg.destinationCode} className="flex items-center gap-1">
              <span className="text-xl">{leg.emoji}</span>
              {locale === "ar" ? leg.destinationNameAr : leg.destinationNameEn}
              {i === 0 && <span className="text-gray-400 mx-1">←→</span>}
            </span>
          ))}
        </div>
        <span className="text-lg font-extrabold text-gray-900">
          {pair.totalPrice.toLocaleString()} {pair.currency}
        </span>
      </div>

      <div className="space-y-2">
        {pair.legs.map((leg) => (
          <div key={leg.destinationCode} className="text-sm text-gray-600 border-t border-dashed border-gray-200 pt-2 first:border-0 first:pt-0">
            <p className="font-semibold text-gray-800">
              {dict.discoverResults.leg}: {locale === "ar" ? leg.destinationNameAr : leg.destinationNameEn} · {leg.nights} {dict.results.nights}
            </p>
            <p>
              ✈️ {leg.flight.airline} · {leg.flight.stops === 0 ? dict.results.stopsNone : `${leg.flight.stops} ${dict.results.stops}`} — 🏨 {leg.hotel.name} ({"★".repeat(Math.max(1, leg.hotel.stars))})
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-500">{dict.results.remainingBudget}</span>
        <span className={pair.remainingBudget >= 0 ? "text-brand-navy font-semibold" : "text-red-600 font-semibold"}>
          {pair.remainingBudget.toLocaleString()} {pair.currency}
        </span>
      </div>
    </div>
  );
}
