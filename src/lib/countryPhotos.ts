// One representative photo per country, for the destination card grids.
//
// The photo we want is the country's best-known landmark — the picture a
// traveller recognises before they read the name. That comes from the guide's
// own first attraction, but any single article can turn out to have no lead
// image, so this walks a short chain of real candidates instead of giving up
// on the first miss:
//
//   1. each of the country's curated landmarks, in the order the guide lists
//      them (most famous first);
//   2. the country's own Wikipedia article.
//
// The walk is breadth-first on purpose: every country tries its first
// landmark in one batch, and only the countries still without a photo go on
// to the next candidate. A depth-first version would fetch four articles for
// forty countries; this one usually fetches one.

import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import { findCountry } from "@/lib/countries";
import { fetchWikiSummaries } from "@/lib/wikipedia";

/**
 * A country's own Wikipedia article usually leads with its flag, and a flag
 * is the one image a destination card must not use: the card already shows a
 * flag badge, and "here is Sweden" illustrated by the Swedish flag tells a
 * traveller nothing about whether they want to go. Treating a flag as no
 * photo at all lets the search fall through to the next candidate, or to the
 * card's own gradient.
 */
function isFlagImage(url: string): boolean {
  return /Flag[_%20]*of/i.test(url);
}

/** How many of a country's landmarks to try before falling back to the country article. */
const LANDMARKS_TO_TRY = 3;

export async function fetchCountryPhotos(codes: string[]): Promise<Map<string, string>> {
  const photos = new Map<string, string>();
  if (codes.length === 0) return photos;

  const candidatesFor = (code: string): string[] => {
    const guide = COUNTRY_GUIDES[code];
    const landmarks = (guide?.attractions ?? []).slice(0, LANDMARKS_TO_TRY).map((a) => a.wikiTitle);
    const countryName = findCountry(code)?.nameEn;
    if (!countryName) return landmarks;
    // "Tourism in X" before plain "X": the tourism article opens on a
    // landmark, while the country article opens on the flag we just rejected.
    // It exists for most countries and costs nothing for the ones that
    // already found a photo from their guide.
    return [...landmarks, `Tourism in ${countryName}`, countryName];
  };

  const maxRounds = LANDMARKS_TO_TRY + 2;
  for (let round = 0; round < maxRounds; round++) {
    const pending = codes.filter((c) => !photos.has(c));
    if (pending.length === 0) break;

    // One title per still-unphotographed country this round.
    const thisRound = pending
      .map((code) => ({ code, title: candidatesFor(code)[round] }))
      .filter((x): x is { code: string; title: string } => Boolean(x.title));
    if (thisRound.length === 0) break;

    const summaries = await fetchWikiSummaries(thisRound.map((x) => x.title));
    for (const { code, title } of thisRound) {
      const photo = summaries.get(title)?.thumbnail;
      if (photo && !isFlagImage(photo)) photos.set(code, photo);
    }
  }

  return photos;
}
