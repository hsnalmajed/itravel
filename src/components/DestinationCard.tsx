import Link from "next/link";
import type { DestinationSuggestion, Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";

export default function DestinationCard({
  suggestion,
  locale,
  origin,
  adults,
  currency,
  directOnly,
  minStars,
}: {
  suggestion: DestinationSuggestion;
  locale: Locale;
  origin: string;
  adults: number;
  currency: string;
  directOnly: boolean;
  minStars: number;
}) {
  const dict = getDictionary(locale);
  const name = locale === "ar" ? suggestion.destinationNameAr : suggestion.destinationNameEn;

  const departDate = suggestion.flight.departTime.slice(0, 10);
  const returnDate = new Date(new Date(departDate).getTime() + suggestion.nights * 86400000)
    .toISOString()
    .slice(0, 10);

  const resultsParams = new URLSearchParams({
    tripType: "both",
    origin,
    destination: name,
    departDate,
    returnDate,
    adults: String(adults),
    budget: String(suggestion.totalPrice + suggestion.remainingBudget),
    currency,
    directOnly: String(directOnly),
    minStars: String(minStars),
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
        <p>
          ✈️ {suggestion.flight.airline} · {suggestion.flight.stops === 0 ? dict.results.stopsNone : `${suggestion.flight.stops} ${dict.results.stops}`}
        </p>
        <p>
          🏨 {suggestion.hotel.name} · {"★".repeat(Math.max(1, suggestion.hotel.stars))} · {suggestion.nights} {dict.results.nights}
        </p>
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
