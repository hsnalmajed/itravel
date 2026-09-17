"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/lib/types";

export interface CountryPin {
  code: string;
  name: string;
  lat: number;
  lon: number;
  cities: number;
}

/**
 * Every country we cover, on one map.
 *
 * The maps section used to open on a grid of country cards — which is a
 * second copy of the attractions index, not a map. Someone who clicks
 * "خرائط سياحية" has said what they want to look at, and making them read
 * a list first to reach the first map takes three screens.
 *
 * Each pin carries its city count, because that is the one thing that
 * decides whether opening a country is worth it. Clicking goes to that
 * country's cities; the card grid stays underneath for anyone who would
 * rather search or filter than aim.
 */
function countryIcon(cities: number, name: string) {
  const size = cities >= 5 ? 40 : cities >= 3 ? 34 : 30;
  return L.divIcon({
    className: "",
    html: `<span title="${name}" style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:999px;
      background:#0b2d5b;color:#fff;font-weight:800;font-size:12px;
      border:3px solid #fff;box-shadow:0 2px 10px rgba(4,24,47,.4);
    ">${cities}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function WorldMapCanvas({
  locale,
  pins,
  attribution,
}: {
  locale: Locale;
  pins: CountryPin[];
  attribution: string;
}) {
  const router = useRouter();

  const bounds = useMemo((): [[number, number], [number, number]] | null => {
    if (pins.length === 0) return null;
    const lats = pins.map((p) => p.lat);
    const lons = pins.map((p) => p.lon);
    return [
      [Math.min(...lats) - 6, Math.min(...lons) - 6],
      [Math.max(...lats) + 6, Math.max(...lons) + 6],
    ];
  }, [pins]);

  if (!bounds) return null;

  return (
    // `isolate` keeps Leaflet's controls (z-index 800) and popups (700)
    // underneath the site header, which sits at 50 — see the same note in
    // MapCanvas.
    <div className="isolate">
      <div className="relative z-0 overflow-hidden rounded-2xl shadow-sm ring-1 ring-navy-950/5">
        <MapContainer
          bounds={bounds}
          // Wheel-zoom off on purpose: this map sits at the top of a page
          // people are scrolling through, and a full-width map that swallows
          // the wheel traps them in it.
          scrollWheelZoom={false}
          className="h-[45vh] w-full min-h-[18rem]"
        >
          <TileLayer
            attribution={attribution}
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={12}
          />
          {pins.map((p) => (
            <Marker
              key={p.code}
              position={[p.lat, p.lon]}
              icon={countryIcon(p.cities, p.name)}
              eventHandlers={{ click: () => router.push(`/${locale}/maps/${p.code}`) }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
