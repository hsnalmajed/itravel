import type { Locale, PackageCombo } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";

function formatTime(iso: string, locale: Locale) {
  try {
    return new Date(iso).toLocaleTimeString(locale === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PackageCard({ combo, locale }: { combo: PackageCombo; locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 transition hover:shadow-md ${
        combo.withinBudget ? "ring-teal-100" : "ring-red-100"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            combo.withinBudget ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-600"
          }`}
        >
          {combo.withinBudget ? dict.results.withinBudget : dict.results.overBudget}
        </span>
        <span className="text-lg font-extrabold text-gray-900">
          {combo.totalPrice.toLocaleString()} {combo.currency}
        </span>
      </div>

      {combo.flight && (
        <div className="border-t border-dashed border-gray-200 pt-3 mt-1 first:border-0 first:pt-0 first:mt-0">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{dict.results.flightOption}</p>
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold text-gray-800">{combo.flight.airline}</p>
              <p className="text-gray-500">
                {combo.flight.origin} → {combo.flight.destination}
              </p>
            </div>
            <div className="text-end">
              <p className="text-gray-800">
                {formatTime(combo.flight.departTime, locale)} - {formatTime(combo.flight.arriveTime, locale)}
              </p>
              <p className="text-gray-500">
                {combo.flight.stops === 0 ? dict.results.stopsNone : `${combo.flight.stops} ${dict.results.stops}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {combo.hotel && (
        <div className="border-t border-dashed border-gray-200 pt-3 mt-3">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{dict.results.hotelOption}</p>
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold text-gray-800">{combo.hotel.name}</p>
              <p className="text-amber-500">{"★".repeat(Math.max(1, combo.hotel.stars))}</p>
            </div>
            <div className="text-end">
              <p className="text-gray-800">
                {combo.hotel.pricePerNight.toLocaleString()} {combo.hotel.currency} / {dict.results.perNight}
              </p>
              <p className="text-gray-500">
                {combo.hotel.nights} {dict.results.nights}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
        <span className="text-gray-500">{dict.results.remainingBudget}</span>
        <span className={combo.remainingBudget >= 0 ? "text-teal-700 font-semibold" : "text-red-600 font-semibold"}>
          {combo.remainingBudget.toLocaleString()} {combo.currency}
        </span>
      </div>

      {(combo.flight?.isMock || combo.hotel?.isMock) && (
        <p className="mt-2 text-[11px] text-amber-600">Demo</p>
      )}
    </div>
  );
}
