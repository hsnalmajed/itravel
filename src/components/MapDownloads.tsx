"use client";

import type { Locale } from "@/lib/types";
import type { MapPin } from "@/components/MapCanvas";
import { downloadText, safeFileName, toGPX, toKML, type ExportPlace } from "@/lib/mapExport";

interface DownloadsDict {
  downloadHeading: string;
  downloadHint: string;
  downloadGpx: string;
  downloadGpxHint: string;
  downloadKml: string;
  downloadKmlHint: string;
  legendAttractions: string;
  legendActivities: string;
}

export default function MapDownloads({
  locale,
  pins,
  title,
  fileBase,
  dict,
}: {
  locale: Locale;
  pins: MapPin[];
  /** Shown inside the file — this is the name the maps app displays. */
  title: string;
  /**
   * Used for the filename only. Kept ASCII on purpose: some Android file
   * managers and map apps mangle right-to-left filenames, while the title
   * inside the file carries the Arabic name just fine.
   */
  fileBase: string;
  dict: DownloadsDict;
}) {
  // Export the names in the language the traveller is browsing in, so the
  // pins read the same on their phone as they do here.
  const places: ExportPlace[] = pins.map((p) => ({
    name: locale === "ar" ? p.nameAr : p.nameEn,
    lat: p.lat,
    lon: p.lon,
    description: p.extract,
    category: p.category === "activity" ? dict.legendActivities : dict.legendAttractions,
  }));

  function handleGpx() {
    downloadText(toGPX(places, title), safeFileName(fileBase, "gpx"), "application/gpx+xml");
  }

  function handleKml() {
    downloadText(toKML(places, title), safeFileName(fileBase, "kml"), "application/vnd.google-earth.kml+xml");
  }

  const buttonClass =
    "flex-1 min-w-[10rem] rounded-xl border border-gray-200 bg-white px-4 py-3 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";

  return (
    <div className="mt-5 rounded-2xl bg-brand-50 p-4 sm:p-5 ring-1 ring-brand-100">
      <p className="font-bold text-brand-900">📥 {dict.downloadHeading}</p>
      <p className="mt-1 mb-3.5 text-sm text-brand-800 leading-relaxed">{dict.downloadHint}</p>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleGpx} className={buttonClass}>
          <span className="block text-sm font-bold text-gray-900">🧭 {dict.downloadGpx}</span>
          <span className="mt-0.5 block text-xs text-gray-500 leading-snug">{dict.downloadGpxHint}</span>
        </button>

        <button type="button" onClick={handleKml} className={buttonClass}>
          <span className="block text-sm font-bold text-gray-900">🌍 {dict.downloadKml}</span>
          <span className="mt-0.5 block text-xs text-gray-500 leading-snug">{dict.downloadKmlHint}</span>
        </button>
      </div>
    </div>
  );
}
