"use client";

import dynamic from "next/dynamic";
import type { Locale } from "@/lib/types";
import type { MapPin } from "@/components/MapCanvas";

export type { MapPin } from "@/components/MapCanvas";

// Leaflet reaches for `window` the moment it's imported, so the real map is
// pulled in only in the browser. This wrapper is a client component purely
// so `ssr: false` is legal here — the pages that use it stay server
// components and keep doing their data fetching on the server.
const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => <div className="h-[70vh] w-full rounded-2xl bg-gray-100 animate-pulse" aria-hidden="true" />,
});

export default function AttractionsMap(props: {
  locale: Locale;
  countryCode: string;
  pins: MapPin[];
  dict: {
    attractionsHeading: string;
    activitiesHeading: string;
    viewTours: string;
    mapAttribution: string;
  };
}) {
  return <MapCanvas {...props} />;
}
