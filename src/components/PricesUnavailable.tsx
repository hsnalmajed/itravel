import Link from "next/link";
import type { Locale } from "@/lib/types";

/**
 * What the results page says when it has no real prices.
 *
 * The alternative was worse in a way that is easy to underrate: the page used
 * to generate plausible fares, print them at full size, and add a small amber
 * line admitting they were invented. People do not read the amber line. They
 * read "4,545 SAR to Cairo" and plan around it — and the first time reality
 * disagrees, the site has spent the only thing a price-comparison site has.
 *
 * So there are no numbers here at all. What there is instead is the rest of
 * the site: the destination guide and the day planner both work perfectly
 * well without a fare, and the traveller came here to plan a trip, not
 * specifically to see a number. A dead end would have been the third bad
 * option.
 */
export default function PricesUnavailable({
  locale,
  dict,
  exploreHref,
  planHref,
}: {
  locale: Locale;
  dict: {
    results: {
      pricesUnavailableTitle: string;
      pricesUnavailableBody: string;
      pricesUnavailableExplore: string;
      pricesUnavailablePlan: string;
    };
  };
  exploreHref: string;
  planHref: string;
}) {
  const arrow = locale === "ar" ? "←" : "→";

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-10 sm:py-12">
        <span
          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sun-400/15 text-2xl ring-1 ring-sun-400/30"
          aria-hidden="true"
        >
          🧭
        </span>

        <div>
          <h2 className="font-display text-h3 font-extrabold text-navy-900">
            {dict.results.pricesUnavailableTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-navy-600">
            {dict.results.pricesUnavailableBody}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href={planHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sun-400 px-6 py-3.5 text-sm font-bold text-navy-950 shadow-[var(--shadow-sun)] transition hover:-translate-y-0.5 hover:bg-sun-300"
          >
            {dict.results.pricesUnavailablePlan}
            <span aria-hidden="true">{arrow}</span>
          </Link>
          <Link
            href={exploreHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-navy-800 ring-1 ring-mist-300 transition hover:-translate-y-0.5 hover:ring-navy-300"
          >
            {dict.results.pricesUnavailableExplore}
            <span aria-hidden="true">{arrow}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
