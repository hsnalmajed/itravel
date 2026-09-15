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

/**
 * Look up one Commons file.
 *
 * Returns null on any failure — an unreachable API, a renamed file, a
 * malformed response — so a caller can fall back to another image rather than
 * failing the page for the sake of a background.
 */
async function fetchOne(fileName: string, width: number): Promise<CommonsImage | null> {
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

    return {
      url,
      width: info.thumbwidth ?? width,
      height: info.thumbheight ?? 0,
      artist: stripHtml(info.extmetadata?.Artist?.value),
      license: stripHtml(info.extmetadata?.LicenseShortName?.value),
      descriptionUrl: info.descriptionurl,
    };
  } catch {
    return null;
  }
}

/**
 * One Commons file, with a 4K variant alongside the display-size one.
 *
 * Both widths are asked for rather than derived, for the reason above: the
 * only URL guaranteed to exist is the one Wikimedia hands back. The two
 * lookups run together and both sit behind the same daily cache, so this
 * costs one round trip, once a day.
 */
export async function fetchCommonsImage(
  fileName: string,
  width = 1920
): Promise<CommonsImage | null> {
  const [base, large] = await Promise.all([
    fetchOne(fileName, width),
    fetchOne(fileName, 3840),
  ]);
  if (!base) return null;
  return {
    ...base,
    // Only when it really is larger — a file smaller than 4K comes back at
    // its own size, and advertising that as a 3840w candidate would make the
    // browser pick a blurrier image on a big screen.
    url4k: large && large.width > base.width ? large.url : undefined,
  };
}
