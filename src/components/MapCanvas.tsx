"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/lib/types";
import PlacePopup from "@/components/PlacePopup";

export interface MapPin {
  key: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lon: number;
  photo?: string;
  extract?: string;
  category: "attraction" | "activity" | "nearby";
  /**
   * Wikipedia article title. Present on pins discovered by GeoSearch, where
   * we deliberately don't pre-fetch a photo for every one of several hundred
   * places — the popup loads it on demand instead.
   */
  wikiTitle?: string;
}

interface MapDict {
  attractionsHeading: string;
  activitiesHeading: string;
  nearbyHeading: string;
  readMore: string;
  viewTours: string;
  mapAttribution: string;
}

// Leaflet's default marker icons are resolved from relative image paths that
// don't survive bundling, so we draw the pin ourselves. Doing it this way
// also lets attractions and activities read differently at a glance without
// shipping two image assets.
const PIN_COLORS: Record<MapPin["category"], string> = {
  activity: "#c2410c",
  attraction: "#0f5132",
  // Discovered places are the bulk of a city map, so they get a quieter
  // colour and a smaller pin — the curated highlights stay dominant.
  nearby: "#1e50a2",
};

function pinIcon(category: MapPin["category"]) {
  const color = PIN_COLORS[category];
  const size = category === "nearby" ? 18 : 26;
  return L.divIcon({
    className: "",
    html: `<span style="
      display:block;width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
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
              <div>
                <PlacePopup pin={pin} locale={locale} dict={dict} />
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
