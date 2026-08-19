import type { DestinationPairSuggestion, Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import { formatDuration } from "@/lib/format";

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
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
        pair.withinBudget ? "ring-brand-100 hover:ring-brand-300" : "ring-red-100 hover:ring-red-200"
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
            {leg.flight.stops > 0 && leg.flight.layoverCity && (
              <p className="text-xs text-gray-400">
                {dict.results.layoverIn
                  .replace("{city}", leg.flight.layoverCity)
                  .replace(
                    "{duration}",
                    leg.flight.layoverDurationMinutes ? formatDuration(leg.flight.layoverDurationMinutes, locale) : ""
                  )}
              </p>
            )}
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  leg.flight.baggageIncluded ? "bg-accent-50 text-accent-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                🧳 {leg.flight.baggageIncluded ? dict.results.baggageYes : dict.results.baggageNo}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  leg.hotel.breakfastIncluded ? "bg-accent-50 text-accent-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                🍳 {leg.hotel.breakfastIncluded ? dict.results.breakfastYes : dict.results.breakfastNo}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                📍 {dict.results.distanceFromCenter.replace("{km}", String(leg.hotel.distanceFromCenterKm))}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-500">{dict.results.remainingBudget}</span>
        <span className={pair.remainingBudget >= 0 ? "text-brand-900 font-semibold" : "text-red-600 font-semibold"}>
          {pair.remainingBudget.toLocaleString()} {pair.currency}
        </span>
      </div>
    </div>
  );
}
