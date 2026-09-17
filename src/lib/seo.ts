import type { Metadata } from "next";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";

/**
 * One page, one title.
 *
 * Every page on the site carried the same title and the same description —
 * "Sfratna — لكل سفرة حكاية" — which means a search engine has nothing to
 * tell one from another, and a link shared on WhatsApp says nothing about
 * what is behind it. For a site whose whole growth path is someone sending
 * a friend a destination, that is the difference between a link that gets
 * opened and one that doesn't.
 *
 * `hreflang` and `canonical` are built here too, because they are the same
 * three lines on every page and getting them slightly different on each is
 * how a site ends up competing with itself.
 */

/**
 * Where the site actually lives.
 *
 * Set NEXT_PUBLIC_SITE_URL once a real domain exists; until then the
 * workers.dev address is the honest answer, and a canonical pointing at the
 * address people can actually reach is better than one pointing at a domain
 * that does not resolve yet.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://sfratna.almajedhsn.workers.dev"
).replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Metadata for one page.
 *
 * `path` is the locale-less route ("/visa", "/attractions/TR"), so the two
 * language versions can point at each other without either being told where
 * the other is.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  /** An absolute image URL for link previews. */
  image?: string;
}): Metadata {
  const dict = getDictionary(locale);
  const clean = path === "/" ? "" : path;
  const url = absoluteUrl(`/${locale}${clean}`);
  // The site name goes last so the distinctive part survives truncation in
  // a search result or a browser tab.
  const fullTitle = `${title} | ${dict.siteName}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
      languages: {
        ar: absoluteUrl(`/ar${clean}`),
        en: absoluteUrl(`/en${clean}`),
        "x-default": absoluteUrl(`/ar${clean}`),
      },
    },
    openGraph: {
      type: "website",
      siteName: dict.siteName,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      title: fullTitle,
      description,
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      images: image ? [image] : undefined,
    },
  };
}

/**
 * Structured data for a destination page.
 *
 * Returned as a string to drop into a JSON-LD script tag. Only fields we
 * actually know are included — an empty `image` or a made-up `geo` would be
 * worse than omitting them, and Google treats invented structured data as a
 * reason to distrust the rest.
 */
export function touristDestinationJsonLd({
  name,
  description,
  url,
  image,
  country,
}: {
  name: string;
  description?: string;
  url: string;
  image?: string;
  country?: string;
}): string {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name,
    url,
  };
  if (description) data.description = description;
  if (image) data.image = image;
  if (country) {
    data.containedInPlace = { "@type": "Country", name: country };
  }
  return JSON.stringify(data);
}
