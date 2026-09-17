"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import { money } from "@/lib/budget";

/**
 * What to say when the budget does not reach.
 *
 * A results page that answers "nothing fits" with an empty list is telling
 * the traveller they asked a bad question. The number they typed was a real
 * decision, and the useful reply is arithmetic: here is the cheapest trip we
 * actually found, here is the gap, and here are the two things you can do
 * about it — carry the same trip at a budget that reaches it, or keep the
 * budget and let us find somewhere it does reach.
 *
 * Both routes are built from the search already in the URL, so neither one
 * asks for anything to be typed again.
 */
export default function BudgetNotice({
  locale,
  currency,
  budgetTotal,
  cheapest,
}: {
  locale: Locale;
  currency: string;
  budgetTotal: number;
  /** The cheapest whole trip we found for this search. */
  cheapest: number;
}) {
  const dict = getDictionary(locale);
  const pathname = usePathname();
  const sp = useSearchParams();

  const gap = Math.max(0, cheapest - budgetTotal);
  if (gap <= 0) return null;

  // Rounded up to something a person would type. A button offering to search
  // at "8,437" reads as a machine's number; 8,500 reads as a decision.
  const suggested = Math.ceil(cheapest / 100) * 100;

  const raise = new URLSearchParams(sp.toString());
  raise.set("budget", String(suggested));

  // The same search, with the destination given back to us. Nothing else
  // changes — the dates, the party, the filters and the budget all travel.
  const elsewhere = new URLSearchParams(sp.toString());
  elsewhere.set("mode", "discover");
  elsewhere.delete("destination");
  elsewhere.delete("legs");

  return (
    <div className="rounded-2xl border border-amber-300/70 bg-amber-50 p-5 sm:p-6">
      <p className="font-display text-lg font-extrabold text-amber-900">
        {dict.results.shortfallTitle}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-amber-900/80">
        {dict.results.shortfallBody
          .replace("{cheapest}", money(cheapest, currency))
          .replace("{gap}", money(gap, currency))
          .replace("{budget}", money(budgetTotal, currency))}
      </p>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <Link
          href={`${pathname}?${raise.toString()}`}
          className="rounded-xl bg-amber-900 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900 focus-visible:ring-offset-2"
        >
          {dict.results.shortfallRaise.replace("{amount}", money(suggested, currency))}
        </Link>
        <Link
          href={`/${locale}/discover-results?${elsewhere.toString()}`}
          className="rounded-xl border border-amber-400 bg-white px-5 py-3 text-center text-sm font-bold text-amber-900 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900 focus-visible:ring-offset-2"
        >
          {dict.results.shortfallDiscover.replace("{budget}", money(budgetTotal, currency))}
        </Link>
      </div>
    </div>
  );
}
