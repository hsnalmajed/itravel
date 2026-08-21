"use client";

import { useState } from "react";

/**
 * A photo that quietly gives up.
 *
 * Every image on this site comes from Wikipedia at request time, and any of
 * them can fail: an article's photo gets deleted, a file is renamed, a
 * thumbnail 400s. The browser's answer to that is a broken-image icon, which
 * on a grid of destination cards looks like the site itself is broken.
 *
 * So a failed load falls back to the tile the card would have shown if we'd
 * never found a photo at all — a flag, a city glyph, a category mark. The
 * card still reads correctly; it just isn't illustrated.
 */
export default function Photo({
  src,
  fallback,
  className,
}: {
  src?: string;
  /** Shown when there's no photo, or when the photo fails to load. */
  fallback: React.ReactNode;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
