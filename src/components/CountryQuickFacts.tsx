import Link from "next/link";
import type { Locale } from "@/lib/types";
import type { VisaCategory } from "@/lib/visa";
import { VISA_STYLES } from "@/components/VisaBadge";

/**
 * What a traveller needs in the first screen of a country page.
 *
 * The page used to open on Wikipedia's own first paragraph, which for
 * Türkiye is about its land borders and the share of its population that is
 * Kurdish. Both true, neither of any use to someone deciding whether to go —
 * and a page that opens with something useless teaches you to scroll past
 * the top of it.
 *
 * Every fact here is one the site already holds: the visa status from the
 * table the visa page reads, the best months from the country's own guide,
 * the currency from the converter's list, and the flight time from the
 * origin airports we cover. Nothing is invented, and a fact we do not have
 * is left out rather than filled with a plausible guess — a wrong flight
 * time is worse than no flight time.
 *
 * The encyclopaedia paragraph is not deleted; it moves below this, trimmed,
 * where someone who wants the background can still read it.
 */
export interface QuickFact {
  icon: string;
  label: string;
  value: string;
  /** Turns the value into a link — used for "see the visa rules". */
  href?: string;
  /** Colours the tile by visa category, when this is the visa fact. */
  visa?: VisaCategory;
}

export default function CountryQuickFacts({
  locale,
  facts,
  heading,
}: {
  locale: Locale;
  facts: QuickFact[];
  heading: string;
}) {
  if (facts.length === 0) return null;

  return (
    <section className="mb-8">
      <p className="eyebrow mb-3">{heading}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {facts.map((f) => {
          const tone = f.visa ? VISA_STYLES[f.visa].chip : "bg-white text-navy-900";
          const body = (
            <>
              <span className="text-lg leading-none" aria-hidden="true">
                {f.icon}
              </span>
              <span className="mt-2 block text-2xs font-bold uppercase tracking-wide text-navy-400">
                {f.label}
              </span>
              <span className="mt-1 block text-sm font-extrabold leading-snug">{f.value}</span>
            </>
          );

          return f.href ? (
            <Link
              key={f.label}
              href={f.href}
              className={`card card-hover block px-4 py-3.5 ${tone}`}
              lang={locale}
            >
              {body}
            </Link>
          ) : (
            <div key={f.label} className={`card px-4 py-3.5 ${tone}`}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
