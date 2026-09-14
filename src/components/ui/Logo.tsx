import Image from "next/image";

/**
 * The Sfratna logo, unaltered.
 *
 * Three cuts of the same artwork, because one size never serves every slot:
 *
 *   "lockup"  mark + wordmark — the primary lockup, for the header, where the
 *             descriptor would be an illegible smear at 32px tall.
 *   "full"    the complete signature including «لكل سفرة حكاية», for the
 *             footer, where there is room to read it.
 *   "mark"    the pin alone, for favicons and square slots.
 *
 * The wordmark is Primary Navy, which would vanish against the navy header,
 * so on dark surfaces it sits on a white card rather than being recoloured.
 * Reversing it by repainting the navy white would also repaint the navy
 * *inside* the pin, and the mark would stop being the mark.
 */
// Intrinsic sizes match the files on disk. Images are served unoptimized on
// Workers (see next.config.ts), so the browser performs every downscale
// itself — each asset is stored at roughly 3x the largest size it is ever
// displayed at rather than at master resolution.
const SOURCES = {
  lockup: { src: "/sfratna-lockup.png", width: 360, height: 123 },
  full: { src: "/sfratna-logo.png", width: 560, height: 189 },
  mark: { src: "/sfratna-mark.png", width: 256, height: 276 },
} as const;

export default function Logo({
  variant = "lockup",
  className = "",
  priority = false,
  alt,
}: {
  variant?: keyof typeof SOURCES;
  className?: string;
  priority?: boolean;
  alt: string;
}) {
  const s = SOURCES[variant];
  return (
    <Image
      src={s.src}
      alt={alt}
      width={s.width}
      height={s.height}
      priority={priority}
      className={className}
    />
  );
}
