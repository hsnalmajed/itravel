/**
 * How far over a budget is still worth showing.
 *
 * The site's promise is that the budget is the search, not a sort order: a
 * results page that opens on a trip the traveller cannot afford has quietly
 * changed the question. So results are held to the budget.
 *
 * But an absolute cut-off is its own kind of dishonesty. A trip 40 riyals
 * over is not "unavailable", and hiding it to defend a round number the
 * traveller typed in ten seconds serves nobody. So there is a tolerance, it
 * is opt-in, and it is small and fixed: the traveller asks to see slightly
 * dearer options, and "slightly" is defined here rather than left to grow
 * into "anything we have".
 *
 * These figures are a *tolerance*, not a conversion. They are the round
 * amount that reads as "a bit more" in each currency — roughly a thousand
 * riyals' worth, rounded to something a person would actually say. They are
 * deliberately not taken from the exchange-rate feed: a threshold that moves
 * with the market would change what a traveller is shown between one search
 * and the next for no reason they could see.
 */
const ALLOWANCE: Record<string, number> = {
  SAR: 1000,
  AED: 1000,
  QAR: 1000,
  KWD: 80,
  BHD: 100,
  OMR: 100,
  EGP: 13000,
  JOD: 200,
  USD: 250,
  EUR: 250,
  GBP: 200,
};

/** A quarter of the budget, for a currency we have no round figure for. */
const FALLBACK_SHARE = 0.15;

export function overBudgetAllowance(currency: string, budgetTotal: number): number {
  const fixed = ALLOWANCE[currency?.toUpperCase?.() ?? ""];
  if (fixed) return fixed;
  return Math.max(1, Math.round((budgetTotal * FALLBACK_SHARE) / 10) * 10);
}

/**
 * What a budget can buy, given the cheapest of each half.
 *
 * `floor` is the cheapest a whole trip could possibly come to — the cheapest
 * flight plus the cheapest hotel that survived the traveller's own filters.
 * Anything above it is a choice; the floor itself is the answer to "can this
 * budget buy this trip at all".
 */
export interface BudgetStanding {
  /** No budget was given, so nothing is filtered and nothing is warned about. */
  unlimited: boolean;
  /** The cheapest possible total. */
  floor: number;
  /** floor − budget, when positive: the budget cannot buy even the cheapest. */
  shortfall: number;
  /** The most a trip may cost right now, tolerance included when asked for. */
  ceiling: number;
  /** The tolerance itself, for naming it in the button that offers it. */
  allowance: number;
}

export function budgetStanding(
  budgetTotal: number,
  floor: number,
  includeAllowance: boolean,
  currency: string
): BudgetStanding {
  const allowance = overBudgetAllowance(currency, budgetTotal);
  if (!budgetTotal || budgetTotal <= 0) {
    return { unlimited: true, floor, shortfall: 0, ceiling: Infinity, allowance };
  }
  return {
    unlimited: false,
    floor,
    shortfall: Math.max(0, floor - budgetTotal),
    ceiling: budgetTotal + (includeAllowance ? allowance : 0),
    allowance,
  };
}

/**
 * Money as the results pages write it: grouped, with the code after it.
 *
 * Wrapped in a left-to-right isolate. These figures are dropped into the
 * middle of Arabic sentences, and an unisolated "2,925 SAR" is re-ordered by
 * the bidirectional algorithm into "SAR 2,925" — the currency code jumps to
 * the wrong end of its own number, which reads as a typo in a sentence whose
 * entire job is to be trusted about money. The isolate says "this run has its
 * own direction, lay it out on its own" without needing an element around it,
 * which matters because these go through string interpolation, not JSX.
 */
export function money(amount: number, currency: string): string {
  return `⁦${Math.round(amount).toLocaleString("en-US")} ${currency}⁩`;
}
