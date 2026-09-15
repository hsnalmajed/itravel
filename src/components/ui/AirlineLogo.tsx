"use client";

import { useState } from "react";
import { airlineLogoUrl, airlineMonogram } from "@/lib/airlineLogos";

/**
 * An airline's mark, with a monogram behind it.
 *
 * The logo is decorative — the airline's name is always printed next to it —
 * so the image carries an empty alt and a screen reader never hears "Saudia"
 * twice. If the CDN is unreachable or has no file for this carrier, the tile
 * falls back to initials rather than leaving a broken-image box in the middle
 * of a price list.
 */
export default function AirlineLogo({
  code,
  name,
  className = "h-10 w-10",
}: {
  code: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = airlineLogoUrl(code);

  if (!src || failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[0.7rem] font-extrabold text-brand-800 ring-1 ring-brand-100 ${className}`}
        aria-hidden="true"
      >
        {airlineMonogram(name)}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- external CDN,
          and the app runs with the Next image optimizer disabled on Workers. */}
      <img
        src={src}
        alt=""
        loading="lazy"
        width={40}
        height={40}
        onError={() => setFailed(true)}
        className="h-full w-full object-contain p-1"
      />
    </span>
  );
}
