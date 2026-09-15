// One specific photograph, named by its file on Wikimedia Commons.
//
// The country photos elsewhere on the site are discovered — "whatever
// Wikipedia currently leads the Turkey article with". That is right for a
// grid of forty destinations and wrong for the one picture the homepage is
// built around, which someone chose deliberately and should not change
// because an editor swapped an infobox image.
//
// Two things this does not do.
//
// It does not build a thumbnail URL by hand. Wikimedia only serves widths it
// has actually rendered for a file and answers 400 for anything else, so the
// width is *asked for* and whatever URL the API hands back is the one used —
// the same lesson already recorded in wikipedia.ts.
//
// The one exception is Special:FilePath, which is a different thing: it is the
// documented entry point that renders a file at whatever width you ask for,
// rather than a guess at the path of a thumbnail that may not exist. That is
// what the 4K variant uses, and it exists to save a request — the visa page
// was quietly losing its background because it makes dozens of lookups of its
// own and a Worker only gets so many per render. One call for the picture, not
// two, is the difference between a hero and a navy gradient.
//
// And it does not drop the credit. These photographs are published under
// licences that require the photographer to be named, so the author, the
// licence and a link to the file page come back with the image and the
// interface prints them. A photo used without its credit is a photo used
// without permission.

export interface CommonsImage {
  /** Ready to put in an <img src>, at (or near) the width asked for. */
  url: string;
  width: number;
  height: number;
  /**
   * The same photograph at 4K, for the screens that can show it. Offered
   * through srcset rather than as the default: a phone should not download a
   * four-megabyte panorama to display it 400 pixels wide.
   */
  url4k?: string;
  /** The photographer, as Commons records them. */
  artist?: string;
  /** e.g. "CC BY-SA 4.0". */
  license?: string;
  /** The file's page on Commons, where the full licence terms live. */
  descriptionUrl: string;
}

function stripHtml(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const text = value
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text || undefined;
}

/** The width the 4K candidate is rendered at. */
const UHD_WIDTH = 3840;

/**
 * The same file rendered at an arbitrary width.
 *
 * Special:FilePath renders on demand, so unlike a hand-edited thumbnail path
 * this is always a URL that resolves.
 */
function filePathUrl(fileName: string, width: number): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    fileName
  )}?width=${width}`;
}

/**
 * One Commons file, with a 4K variant alongside the display-size one.
 *
 * Returns null on any failure — an unreachable API, a renamed file, a
 * malformed response — so a caller can fall back to another image rather than
 * failing the page for the sake of a background.
 */
export async function fetchCommonsImage(
  fileName: string,
  width = 1920
): Promise<CommonsImage | null> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: `File:${fileName}`,
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiextmetadatafilter: "Artist|LicenseShortName",
    iiurlwidth: String(width),
    origin: "*",
  });

  try {
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {
      headers: {
        "User-Agent": "Sfratna/1.0 (https://sfratna.almajedhsn.workers.dev; travel metasearch site)",
        Accept: "application/json",
      },
      // The file doesn't change; only its metadata could, and slowly.
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      query?: {
        pages?: {
          missing?: boolean;
          imageinfo?: {
            thumburl?: string;
            thumbwidth?: number;
            thumbheight?: number;
            /** The source file's own dimensions, not the thumbnail's. */
            width?: number;
            url?: string;
            descriptionurl?: string;
            extmetadata?: Record<string, { value?: string }>;
          }[];
        }[];
      };
    };

    const page = data.query?.pages?.[0];
    if (!page || page.missing) return null;
    const info = page.imageinfo?.[0];
    const url = info?.thumburl || info?.url;
    if (!url || !info?.descriptionurl) return null;

    const displayWidth = info.thumbwidth ?? width;

    return {
      url,
      width: displayWidth,
      height: info.thumbheight ?? 0,
      // Offered only when the source really has 4K in it. A smaller file
      // renders at its own size whatever width is asked for, so describing it
      // as a 3840w candidate would be a lie the browser acts on — it would
      // pick the blurrier of two identical images on the biggest screens.
      url4k:
        (info.width ?? 0) >= UHD_WIDTH && displayWidth < UHD_WIDTH
          ? filePathUrl(fileName, UHD_WIDTH)
          : undefined,
      artist: stripHtml(info.extmetadata?.Artist?.value),
      license: stripHtml(info.extmetadata?.LicenseShortName?.value),
      descriptionUrl: info.descriptionurl,
    };
  } catch {
    return null;
  }
}
