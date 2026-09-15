// How a typed query is compared against Arabic and Latin text.
//
// Arabic gives the same word several legitimate spellings, and a traveller
// types whichever one their keyboard and habit produce. "إسطنبول" and
// "اسطنبول" are the same city; so are "مكة" and "مكه". Comparing the raw
// strings makes the site look broken to someone who spelled their own
// country's city perfectly well.
//
// Folding is applied to BOTH sides — the query and the data — so it does not
// matter which spelling the dataset happens to use.

/**
 * Letters that Unicode itself will not fold for us.
 *
 * Most of the work is done by NFD: أ إ آ decompose to ا plus a combining
 * hamza, and ؤ ئ to و and ي, so stripping combining marks handles them for
 * free — and it strips Arabic tashkeel and Latin accents (é → e) in the same
 * pass. These four have no decomposition and must be named.
 */
const FOLD: Record<string, string> = {
  "ة": "ه", // ة → ه   (مكة  = مكه)
  "ى": "ي", // ى → ي   (مصطفى = مصطفي)
  "ٱ": "ا", // ٱ → ا
  "ـ": "", // ـ  tatweel, purely decorative
};

/** Arabic-Indic and Eastern Arabic-Indic digits → 0-9. */
function foldDigits(ch: string): string {
  const code = ch.codePointAt(0)!;
  if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
  if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
  return ch;
}

/**
 * The comparable form of a piece of text.
 *
 * Deliberately lossy: it exists only for matching and must never be shown to
 * anyone or written back into the data. The visible spelling always stays
 * exactly as the traveller typed it or as the guide wrote it.
 */
export function normalizeSearch(input: string): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    // Combining marks: Arabic tashkeel, the hamza left behind by decomposing
    // أ إ آ ؤ ئ, and Latin accents.
    .replace(/[̀-ًͯ-ٰٟ]/g, "")
    .replace(/[ةىٱـ]/g, (ch) => FOLD[ch] ?? ch)
    .replace(/[٠-٩۰-۹]/g, foldDigits)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Does any of `fields` contain `query`, ignoring spelling variants?
 *
 * An empty query matches everything, which is what a search box should do
 * before anyone types in it.
 */
export function searchMatches(fields: (string | undefined | null)[], query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  return fields.some((f) => (f ? normalizeSearch(f).includes(q) : false));
}

/** Exact comparison under the same folding — for codes and short keys. */
export function searchEquals(a: string | undefined | null, b: string): boolean {
  if (!a) return false;
  return normalizeSearch(a) === normalizeSearch(b);
}
