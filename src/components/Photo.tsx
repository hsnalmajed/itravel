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
  priority = false,
  srcSet,
  sizes,
}: {
  src?: string;
  /** Shown when there's no photo, or when the photo fails to load. */
  fallback: React.ReactNode;
  className?: string;
  /**
   * Set on the one image that is the page's largest paint — a hero. Lazy
   * loading is right for a grid of cards below the fold and exactly wrong
   * for the picture already on screen when the page opens: it makes the
   * browser wait for layout before it will even start the request.
   */
  priority?: boolean;
  /** Alternative renderings by width, for screens that can use a bigger one. */
  srcSet?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt=""
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
