"use client";

import { useState } from "react";

/**
 * A picture of the hotel — when there actually is one.
 *
 * Booking providers return property photos, and a photo tells a traveller
 * more about a place in a glance than the star rating does. But when the
 * provider gives us nothing (demo data, or a property with no imagery), we
 * show a designed tile with the star rating on it rather than a stock photo
 * of the city. A generic skyline next to a hotel's name reads as a picture of
 * that hotel, and that is a claim we have no right to make.
 */
export default function HotelThumb({
  photoUrl,
  stars,
  className = "h-20 w-24",
}: {
  photoUrl?: string;
  stars: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      <span className={`block shrink-0 overflow-hidden rounded-xl bg-gray-100 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- provider CDN,
            and the app runs with the Next image optimizer disabled on Workers. */}
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-gradient-to-br from-brand-100 to-sea-100 text-brand-800 ring-1 ring-brand-100 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18M5 20V6a1 1 0 011-1h7a1 1 0 011 1v14M14 20V10h4a1 1 0 011 1v9M8 8h3M8 11h3M8 14h3" />
      </svg>
      {stars > 0 && <span className="text-[0.65rem] font-bold tracking-widest text-amber-600">{"★".repeat(Math.min(5, stars))}</span>}
    </span>
  );
}
