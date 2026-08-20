"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/lib/types";

export interface MapPin {
  key: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lon: number;
  photo?: string;
  extract?: string;
  category: "attraction" | "activity";
}

interface MapDict {
  attractionsHeading: string;
  activitiesHeading: string;
  viewTours: string;
  mapAttribution: string;
}

// Leaflet's default marker icons are resolved from relative image paths that
// don't survive bundling, so we draw the pin ourselves. Doing it this way
// also lets attractions and activities read differently at a glance without
// shipping two image assets.
function pinIcon(category: MapPin["category"]) {
  const color = category === "activity" ? "#c2410c" : "#0f5132";
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;width:26px;height:26px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
    "></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });
}

// Frames the map on the pins it actually has, rather than a hard-coded
// centre that would sit in the sea for some countries.
function boundsOf(pins: MapPin[]): [[number, number], [number, number]] | null {
  if (pins.length === 0) return null;
  const lats = pins.map((p) => p.lat);
  const lons = pins.map((p) => p.lon);
  const pad = 0.35;
  return [
    [Math.min(...lats) - pad, Math.min(...lons) - pad],
    [Math.max(...lats) + pad, Math.max(...lons) + pad],
  ];
}

export default function MapCanvas({
  locale,
  countryCode,
  pins,
  dict,
}: {
  locale: Locale;
  countryCode: string;
  pins: MapPin[];
  dict: MapDict;
}) {
  const bounds = useMemo(() => boundsOf(pins), [pins]);

  if (!bounds) {
    return <div className="h-[70vh] w-full rounded-2xl bg-gray-100" aria-hidden="true" />;
  }

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
      <MapContainer bounds={bounds} scrollWheelZoom className="h-[70vh] w-full">
        <TileLayer
          attribution={dict.mapAttribution}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {pins.map((pin) => (
          <Marker key={pin.key} position={[pin.lat, pin.lon]} icon={pinIcon(pin.category)}>
            <Popup>
              <div className="w-56" dir={locale === "ar" ? "rtl" : "ltr"}>
                {pin.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pin.photo}
                    alt=""
                    className="mb-2 h-24 w-full rounded-lg object-cover"
                  />
                )}
                <p className="text-[11px] font-semibold text-gray-400">
                  {pin.category === "activity" ? dict.activitiesHeading : dict.attractionsHeading}
                </p>
                <p className="font-bold text-gray-900 leading-snug">
                  {locale === "ar" ? pin.nameAr : pin.nameEn}
                </p>
                {pin.extract && (
                  <p className="mt-1 text-xs text-gray-500 leading-snug line-clamp-3" dir="ltr">
                    {pin.extract}
                  </p>
                )}
                <Link
                  href={`/${locale}/attractions/${countryCode}`}
                  className="mt-2 block rounded-lg bg-brand-800 px-3 py-1.5 text-center text-xs font-bold text-white no-underline"
                >
                  {dict.viewTours}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
