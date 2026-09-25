"use client";

import type { Locale } from "@/lib/types";
import type { MapPin } from "@/lib/mapPins";

interface PopupDict {
  activitiesHeading: string;
  nearbyHeading: string;
  foodHeading: string;
  historicHeading: string;
  directions: string;
  englishOnly: string;
}

/**
 * A place's name, what it is, and a way to get there. The map pins come from
 * OpenStreetMap, which has no photographs or descriptions, so the popup says
 * only what is known and hands directions to Google Maps.
 */
export default function PlacePopup({
  pin,
  locale,
  dict,
}: {
  pin: MapPin;
  locale: Locale;
  dict: PopupDict;
}) {
  const LABELS: Record<typeof pin.category, string> = {
    historic: dict.historicHeading,
    food: dict.foodHeading,
    activity: dict.activitiesHeading,
    place: dict.nearbyHeading,
  };

  return (
    <div className="w-56" dir={locale === "ar" ? "rtl" : "ltr"}>
      <p className="text-[11px] font-semibold text-gray-400">{pin.extract ?? LABELS[pin.category]}</p>
      <p className="font-bold leading-snug text-gray-900" dir={pin.englishOnly ? "ltr" : undefined}>
        {pin.name}
      </p>
      {pin.englishOnly && <p className="mt-1 text-[10px] leading-snug text-amber-700">{dict.englishOnly}</p>}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lon}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-block text-xs font-semibold text-navy-700 hover:underline"
      >
        {dict.directions} ↗
      </a>
    </div>
  );
}
