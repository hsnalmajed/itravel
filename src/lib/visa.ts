// Entry requirements for a Saudi passport.
//
// This is the highest-stakes information on the site. Everything else here
// costs a visitor a disappointing afternoon if it's wrong; this costs them a
// flight. So two rules govern it.
//
// First, the numbers come from a real, maintained, citable source —
// Wikipedia's "Visa requirements for Saudi citizens", which carries a
// reference against each country and is kept current by editors. We parse it
// live rather than freezing a copy into the code, because a visa table frozen
// in a source file is wrong within months and nobody notices.
//
// Second, we never present it as authoritative. Rules change without notice,
// an airline can refuse boarding on its own reading, and the embassy is the
// only body that actually decides. Every surface that shows this data also
// shows where to confirm it. We would rather send a traveller to check than
// have them trust us and be turned away at a gate.
//
// If the source can't be parsed, this returns null and the interface says so.
// A partial table would be worse than none: a country silently missing from
// a "visa-free" list reads as "visa required", and one wrongly present reads
// as permission.

import { COUNTRIES } from "@/lib/countries";

export type VisaCategory = "free" | "arrival" | "eta" | "required" | "unknown";

export interface VisaEntry {
  /** ISO 3166-1 alpha-2 of the destination. */
  code: string;
  /** Wikipedia's own wording, shown verbatim — never paraphrased. */
  status: string;
  /** Allowed stay as the source states it ("90 days", "1 month", ""). */
  stay: string;
  category: VisaCategory;
}

export interface VisaData {
  byCountry: Map<string, VisaEntry>;
  sourceUrl: string;
  /** How many destinations the source listed, for the page's own summary. */
  total: number;
}

const SOURCE_PAGE = "Visa_requirements_for_Saudi_citizens";
export const VISA_SOURCE_URL = `https://en.wikipedia.org/wiki/${SOURCE_PAGE}`;

/**
 * Wikipedia titles that differ from the names this site uses.
 *
 * Kept deliberately small and explicit. A fuzzy matcher would quietly pair
 * the wrong countries — "Republic of the Congo" and "Democratic Republic of
 * the Congo" are two states with different visa rules and nearly the same
 * name, and a near-miss there is exactly the failure this file exists to
 * avoid.
 */
const TITLE_ALIASES: Record<string, string> = {
  "cape verde": "cabo verde",
  "democratic republic of the congo": "dr congo",
  "ivory coast": "côte d'ivoire",
  "czech republic": "czechia",
  "republic of ireland": "ireland",
  "federated states of micronesia": "micronesia",
};

function normaliseTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/\s*\(country\)$/, "")
    .replace(/^the\s+/, "")
    .trim();
  return TITLE_ALIASES[base] ?? base;
}

/**
 * Which bucket a status line falls into, for filtering.
 *
 * Where a country offers more than one route ("eVisa / Visa on arrival"), it
 * lands in the easiest one — that's the question a traveller is actually
 * asking. The full original wording is always displayed alongside, so the
 * bucket never hides a condition.
 */
export function categoriseVisa(status: string): VisaCategory {
  const s = status.toLowerCase();
  if (!s.trim()) return "unknown";
  // Freedom of movement is the GCC agreement — an ID card is enough.
  if (s.includes("not required") || s.includes("freedom of movement")) return "free";
  if (s.includes("on arrival") || s.includes("permit on arrival")) return "arrival";
  if (
    s.includes("evisa") ||
    s.includes("e-visa") ||
    s.includes("online visa") ||
    s.includes("electronic travel") ||
    s.includes("electronic border") ||
    s.includes("eta")
  ) {
    return "eta";
  }
  if (s.includes("required")) return "required";
  return "unknown";
}

function stripTags(value: string): string {
  return value
    // Reference markers ([12]) live in <sup> and would otherwise end up
    // glued to the status text.
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Rows parsed out of the article's first wikitable.
 *
 * Exported for its own test: this is a regex over someone else's HTML, which
 * is exactly the kind of code that quietly rots, so it's checked against a
 * saved copy of the real markup rather than trusted.
 */
export function parseVisaTable(html: string): { title: string; status: string; stay: string }[] {
  const table = html.match(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (!table) return [];

  const rows: { title: string; status: string; stay: string }[] = [];

  for (const row of table[1].split(/<tr[^>]*>/i).slice(1)) {
    const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((m) => m[1]);
    if (cells.length < 2) continue;

    // The country is the first article link in the first cell — skipping the
    // flag image, whose own link points at a File: page.
    const link = [...cells[0].matchAll(/<a[^>]*href="\/wiki\/([^"#]+)"[^>]*title="([^"]+)"/gi)].find(
      (m) => !/^(File|Image):/i.test(m[2])
    );
    if (!link) continue;

    const status = stripTags(cells[1]);
    if (!status) continue;

    rows.push({ title: link[2], status, stay: stripTags(cells[2] ?? "") });
  }

  return rows;
}

/**
 * How few rows would mean the article's structure changed under us.
 *
 * The table lists nearly every country on earth. If a parse returns a
 * fraction of that, the markup moved and what we did extract can't be
 * trusted either — so the whole fetch fails rather than shipping a table
 * with holes in it.
 */
const MINIMUM_PLAUSIBLE_ROWS = 150;

export async function fetchVisaRequirements(): Promise<VisaData | null> {
  try {
    const params = new URLSearchParams({
      action: "parse",
      page: SOURCE_PAGE,
      prop: "text",
      formatversion: "2",
      format: "json",
      origin: "*",
    });

    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`, {
      headers: {
        "User-Agent": "iTravel/1.0 (https://itravel.almajedhsn.workers.dev; travel metasearch site)",
        Accept: "application/json",
      },
      // Visa rules change on their own schedule, not ours; a day-old reading
      // of a page that's edited a few times a month is fine, and the
      // interface tells the reader to confirm regardless.
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { parse?: { text?: string } };
    const html = data.parse?.text;
    if (!html) return null;

    const rows = parseVisaTable(html);
    if (rows.length < MINIMUM_PLAUSIBLE_ROWS) return null;

    const byName = new Map(COUNTRIES.map((c) => [c.nameEn.toLowerCase(), c.code]));
    const byCountry = new Map<string, VisaEntry>();

    for (const row of rows) {
      const code = byName.get(normaliseTitle(row.title));
      // A destination we don't have a country entry for is skipped rather
      // than guessed at.
      if (!code) continue;
      byCountry.set(code, {
        code,
        status: row.status,
        stay: row.stay,
        category: categoriseVisa(row.status),
      });
    }

    if (byCountry.size < MINIMUM_PLAUSIBLE_ROWS) return null;

    return { byCountry, sourceUrl: VISA_SOURCE_URL, total: byCountry.size };
  } catch {
    return null;
  }
}
