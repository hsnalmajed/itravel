"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/types";
import type { MapPin } from "@/components/MapCanvas";

interface PopupDict {
  attractionsHeading: string;
  activitiesHeading: string;
  nearbyHeading: string;
  foodHeading: string;
  historicHeading: string;
  readMore: string;
}

interface Loaded {
  photo?: string;
  extract?: string;
  url?: string;
}

// A city map carries hundreds of pins, so pre-fetching a photo and blurb for
// every one would be hundreds of requests for content almost nobody opens.
// Instead each popup fetches its own place the first time it's opened —
// Leaflet only builds popup content on open, so this runs once per place the
// visitor actually taps, straight from their browser to Wikipedia.
export default function PlacePopup({
  pin,
  locale,
  dict,
}: {
  pin: MapPin;
  locale: Locale;
  dict: PopupDict;
}) {
  const initial = pin.photo || pin.extract ? { photo: pin.photo, extract: pin.extract } : null;
  const [loaded, setLoaded] = useState<Loaded | null>(initial);
  // Seeded rather than flipped on inside the effect: if there's a title to
  // look up and nothing preloaded, this popup starts out loading.
  const [loading, setLoading] = useState(Boolean(!initial && pin.wikiTitle));

  useEffect(() => {
    if (loaded || !pin.wikiTitle) return;
    let cancelled = false;
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pin.wikiTitle.replace(/ /g, "_"))}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setLoaded({
          photo: d.thumbnail?.source,
          extract: d.extract,
          url: d.content_urls?.desktop?.page,
        });
      })
      // A failed lookup just means no photo or blurb; the name and its
      // position on the map are still correct and useful.
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pin.wikiTitle, loaded]);

  const LABELS: Record<typeof pin.category, string> = {
    attraction: dict.attractionsHeading,
    activity: dict.activitiesHeading,
    historic: dict.historicHeading,
    food: dict.foodHeading,
    cityActivity: dict.activitiesHeading,
    place: dict.nearbyHeading,
  };
  const label = LABELS[pin.category];

  return (
    <div className="w-56" dir={locale === "ar" ? "rtl" : "ltr"}>
      {loaded?.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={loaded.photo} alt="" className="mb-2 h-24 w-full rounded-lg object-cover" />
      )}
      <p className="text-[11px] font-semibold text-gray-400">{label}</p>
      <p className="font-bold text-gray-900 leading-snug">{locale === "ar" ? pin.nameAr : pin.nameEn}</p>

      {loading && <p className="mt-1 text-xs text-gray-400">…</p>}

      {loaded?.extract && (
        <p className="mt-1 text-xs text-gray-500 leading-snug line-clamp-3" dir="ltr">
          {loaded.extract}
        </p>
      )}

      {loaded?.url && (
        <a
          href={loaded.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-center text-xs font-semibold text-brand-700"
        >
          {dict.readMore}
        </a>
      )}
    </div>
  );
}
