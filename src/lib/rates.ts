// Live exchange rates.
//
// A note on where these come from, because it matters and it isn't what you
// might expect: Google has no public exchange-rate API, and scraping its
// results page would be both against its terms and something that silently
// breaks the first time the page's markup changes. On a commercial site,
// numbers a traveller might act on cannot rest on a scraper.
//
// So the rate shown is fetched from a real rates feed, and the interface puts
// a one-click link next to it that runs the same conversion on Google — the
// visitor gets the live figure here and can confirm it against Google without
// typing anything.
//
// Two feeds, both free and neither needing a key. The second is a fallback,
// not a blend: mixing two sources would produce a number neither of them
// published.
//
//   1. open.er-api.com — the open tier of exchangerate-api.com.
//   2. Fawaz Ahmed's currency API on jsDelivr, which tracks 200+ currencies.
//
// Both quote mid-market reference rates. That is *not* the rate a bank or an
// exchange counter gives a traveller — they add a margin — and the interface
// says so rather than letting someone budget off a number they won't get.

export interface Rates {
  /** Every rate is quoted per 1 unit of this. */
  base: string;
  /** Currency code (upper case) to units per 1 base. */
  rates: Record<string, number>;
  /** ISO timestamp of the feed's own last update, not of our fetch. */
  updatedAt: string;
  /** Host the numbers came from, shown to the reader. */
  source: string;
}

const BASE = "USD";

async function fromErApi(): Promise<Rates | null> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${BASE}`, {
      headers: { Accept: "application/json" },
      // Rates move slowly and these feeds publish daily; an hour keeps the
      // page fast without ever showing something meaningfully stale.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result?: string;
      time_last_update_unix?: number;
      rates?: Record<string, number>;
    };
    if (data.result !== "success" || !data.rates) return null;
    return {
      base: BASE,
      rates: data.rates,
      updatedAt: new Date((data.time_last_update_unix ?? 0) * 1000).toISOString(),
      source: "open.er-api.com",
    };
  } catch {
    return null;
  }
}

async function fromCurrencyApi(): Promise<Rates | null> {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
      { headers: { Accept: "application/json" }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { date?: string; usd?: Record<string, number> };
    if (!data.usd) return null;
    // This feed keys currencies in lower case; ours are upper.
    const rates: Record<string, number> = {};
    for (const [code, value] of Object.entries(data.usd)) {
      if (typeof value === "number") rates[code.toUpperCase()] = value;
    }
    return {
      base: BASE,
      rates,
      updatedAt: data.date ? new Date(`${data.date}T00:00:00Z`).toISOString() : new Date().toISOString(),
      source: "currency-api",
    };
  } catch {
    return null;
  }
}

/**
 * The current rates table, or null if both feeds are unreachable.
 *
 * Null is a real answer here, not a failure to handle: the page shows that it
 * can't quote a rate right now and still offers the Google link. Falling back
 * to a hard-coded table would mean printing a number that was true months ago
 * as though it were today's.
 */
export async function fetchRates(): Promise<Rates | null> {
  return (await fromErApi()) ?? (await fromCurrencyApi());
}

/**
 * `amount` in `from`, expressed in `to`.
 *
 * Both currencies are quoted against the same base, so the cross rate is one
 * divided by the other. Returns null when either currency is missing from the
 * feed — better an honest "unavailable" than a conversion through a rate we
 * don't have.
 */
export function convert(
  amount: number,
  from: string,
  to: string,
  rates: Rates
): number | null {
  const rate = rateBetween(from, to, rates);
  if (rate === null) return null;
  return amount * rate;
}

/** Units of `to` for one unit of `from`. */
export function rateBetween(from: string, to: string, rates: Rates): number | null {
  if (from === to) return 1;
  const fromRate = from === rates.base ? 1 : rates.rates[from];
  const toRate = to === rates.base ? 1 : rates.rates[to];
  if (!fromRate || !toRate) return null;
  return toRate / fromRate;
}

/**
 * A Google search that runs this exact conversion, so the visitor can check
 * our number against theirs in one tap.
 */
export function googleRateUrl(amount: number, from: string, to: string): string {
  const query = `${amount} ${from} to ${to}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
