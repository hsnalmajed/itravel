"use client";

import dynamic from "next/dynamic";
import type { Locale } from "@/lib/types";
import type { CountryPin } from "@/components/WorldMapCanvas";

export type { CountryPin } from "@/components/WorldMapCanvas";

// Leaflet touches `window` on import, so the real map is browser-only. This
// wrapper exists purely so `ssr: false` is legal — the maps index stays a
// server component and keeps fetching on the server.
const WorldMapCanvas = dynamic(() => import("@/components/WorldMapCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[45vh] min-h-[18rem] w-full animate-pulse rounded-2xl bg-mist-100"
      aria-hidden="true"
    />
  ),
});

export default function WorldMap(props: {
  locale: Locale;
  pins: CountryPin[];
  attribution: string;
}) {
  return <WorldMapCanvas {...props} />;
}
