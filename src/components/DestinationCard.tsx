import Link from "next/link";
import type { BedType, DestinationSuggestion, Locale, TravelerCounts, TripType } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import { formatDuration } from "@/lib/format";
import { serializeChildrenAges } from "@/lib/searchParamsUtil";

export default function DestinationCard({
  suggestion,
  locale,
  origin,
  tripType,
  departDate,
  returnDate,
  travelers,
  currency,
  directOnly,
  minStars,
  bedType,
}: {
  suggestion: DestinationSuggestion;
  locale: Locale;
  origin: string;
  tripType: TripType;
  departDate: string;
  returnDate: string;
  travelers: TravelerCounts;
  currency: string;
  directOnly: boolean;
  minStars: number;
  bedType?: BedType;
}) {
  const dict = getDictionary(locale);
  const name = locale === "ar" ? suggestion.destinationNameAr : suggestion.destinationNameEn;

  const resultsParams = new URLSearchParams({
    tripType,
    origin,
    destination: name,
    departDate,
    returnDate,
    adults: String(travelers.adults),
    childrenAges: serializeChildrenAges(travelers.childrenAges),
    infants: String(travelers.infants),
    budget: String(suggestion.totalPrice + suggestion.remainingBudget),
    currency,
    directOnly: String(directOnly),
    minStars: String(minStars),
    bedType: bedType || "",
  });

  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
        suggestion.withinBudget ? "ring-brand-100 hover:ring-brand-300" : "ring-red-100 hover:ring-red-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{suggestion.emoji}</span>
          <span className="font-bold text-gray-900">{name}</span>
        </div>
        <span className="text-lg font-extrabold text-gray-900">
          {suggestion.totalPrice.toLocaleString()} {suggestion.currency}
        </span>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        {suggestion.flight && (
          <>
            <p>
              ✈️ {suggestion.flight.airline} · {suggestion.flight.stops === 0 ? dict.results.stopsNone : `${suggestion.flight.stops} ${dict.results.stops}`}
            </p>
            {suggestion.flight.stops > 0 && suggestion.flight.layoverCity && (
              <p className="text-xs text-gray-400 ps-5">
                {dict.results.layoverIn
                  .replace("{city}", suggestion.flight.layoverCity)
                  .replace(
                    "{duration}",
                    suggestion.flight.layoverDurationMinutes
                      ? formatDuration(suggestion.flight.layoverDurationMinutes, locale)
                      : ""
                  )}
              </p>
            )}
          </>
        )}
        {suggestion.hotel && (
          <>
            <p>
              🏨 {suggestion.hotel.name} · {"★".repeat(Math.max(1, suggestion.hotel.stars))} · {suggestion.nights} {dict.results.nights}
            </p>
            <p className="text-xs text-gray-400 ps-5">
              {dict.results.distanceFromCenter.replace("{km}", String(suggestion.hotel.distanceFromCenterKm))}
            </p>
          </>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestion.flight && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              suggestion.flight.baggageIncluded ? "bg-accent-50 text-accent-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            🧳 {suggestion.flight.baggageIncluded ? dict.results.baggageYes : dict.results.baggageNo}
          </span>
        )}
        {suggestion.hotel && (
          <>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                suggestion.hotel.breakfastIncluded ? "bg-accent-50 text-accent-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              🍳 {suggestion.hotel.breakfastIncluded ? dict.results.breakfastYes : dict.results.breakfastNo}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              🛏️ {suggestion.hotel.bedType === "shared" ? dict.bedType.shared : dict.bedType.single}
            </span>
          </>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-500">{dict.results.remainingBudget}</span>
        <span className={suggestion.remainingBudget >= 0 ? "text-brand-900 font-semibold" : "text-red-600 font-semibold"}>
          {suggestion.remainingBudget.toLocaleString()} {suggestion.currency}
        </span>
      </div>

      <Link
        href={`/${locale}/results?${resultsParams.toString()}`}
        className="mt-4 block w-full text-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
      >
        {dict.discoverResults.viewDetails}
      </Link>
    </div>
  );
}
