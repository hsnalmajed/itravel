"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/types";
import type { MapPin } from "@/lib/mapPins";

interface PopupDict {
  activitiesHeading: string;
  nearbyHeading: string;
  foodHeading: string;
  historicHeading: string;
  readMore: string;
  englishOnly: string;
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
//
// Which Wikipedia depends on the pin: an Arabic-reading visitor gets the
// Arabic article where one exists, so the blurb they read is in their own
// language rather than a translation we made up.
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

  const lang = pin.wikiLang ?? "en";

  useEffect(() => {
    if (loaded || !pin.wikiTitle) return;
    let cancelled = false;
    fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        pin.wikiTitle.replace(/ /g, "_")
      )}`
    )
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
  }, [pin.wikiTitle, lang, loaded]);

  const LABELS: Record<typeof pin.category, string> = {
    historic: dict.historicHeading,
    food: dict.foodHeading,
    activity: dict.activitiesHeading,
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
      <p
        className="font-bold text-gray-900 leading-snug"
        // An English name inside an Arabic page needs its own direction, or
        // punctuation at either end jumps to the wrong side.
        dir={pin.englishOnly ? "ltr" : undefined}
      >
        {pin.name}
      </p>

      {pin.englishOnly && (
        <p className="mt-1 text-[10px] leading-snug text-amber-700">{dict.englishOnly}</p>
      )}

      {loading && <p className="mt-1 text-xs text-gray-400">…</p>}

      {loaded?.extract && (
        <p
          className="mt-1 text-xs leading-relaxed text-gray-600 line-clamp-5"
          dir={pin.englishOnly ? "ltr" : undefined}
        >
          {loaded.extract}
        </p>
      )}

      {loaded?.url && (
        <a
          href={loaded.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-xs font-semibold text-brand-700 hover:underline"
        >
          {dict.readMore} ↗
        </a>
      )}
    </div>
  );
}
