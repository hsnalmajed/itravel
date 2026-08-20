"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/lib/types";
import PlacePopup from "@/components/PlacePopup";
import { PIN_STYLES, type PinCategory } from "@/lib/pinStyles";
import type { MapPin } from "@/lib/mapPins";

export type { PinCategory } from "@/lib/pinStyles";
export type { MapPin } from "@/lib/mapPins";

interface MapDict {
  attractionsHeading: string;
  activitiesHeading: string;
  nearbyHeading: string;
  foodHeading: string;
  historicHeading: string;
  readMore: string;
  viewTours: string;
  mapAttribution: string;
}

// Leaflet's default marker icons are resolved from relative image paths that
// don't survive bundling, so we draw the pin ourselves.
//

function pinIcon(category: PinCategory) {
  const { color, glyph } = PIN_STYLES[category];
  const size = 26;
  return L.divIcon({
    className: "",
    // The glyph is counter-rotated so it sits upright inside the teardrop.
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
    "><span style="transform:rotate(45deg);font-size:12px;line-height:1">${glyph}</span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Frames the map on the pins it actually has, rather than a hard-coded
// centre that would sit in the sea for some countries.
//
// The breathing room is a fraction of how far the pins actually spread, not
// a fixed number of degrees: a country map spans hundreds of kilometres and
// wants a wide margin, while a city map spans a few kilometres and would be
// squeezed into an unreadable dot by that same margin.
function boundsOf(pins: MapPin[]): [[number, number], [number, number]] | null {
  if (pins.length === 0) return null;
  const lats = pins.map((p) => p.lat);
  const lons = pins.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  // A floor keeps a single pin (or several almost on top of each other) from
  // collapsing to a zero-size box, which Leaflet would zoom to maximum on.
  const padLat = Math.max((maxLat - minLat) * 0.12, 0.01);
  const padLon = Math.max((maxLon - minLon) * 0.12, 0.01);

  return [
    [minLat - padLat, minLon - padLon],
    [maxLat + padLat, maxLon + padLon],
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
