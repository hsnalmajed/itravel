import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { fetchRates } from "@/lib/rates";
import CurrencyConverter from "@/components/CurrencyConverter";
import PageHero from "@/components/ui/PageHero";

// Rates are fetched per request (behind an hourly cache in the fetch itself),
// so the page never serves a rate frozen at build time.
export const dynamic = "force-dynamic";

export default async function CurrencyPage({ params }: PageProps<"/[locale]/currency">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  const rates = await fetchRates();

  // Shown in the reader's own calendar and language, from the feed's own
  // timestamp — not from when this page happened to render.
  const updated = rates
    ? new Intl.DateTimeFormat(
        // Gregorian with Latin digits in Arabic too: "ar-SA" alone defaults to
        // the Umm al-Qura calendar, and a Hijri date next to a flight booking
        // and a market rate is a date nobody can cross-check at a glance.
        loc === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB",
        { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }
      ).format(new Date(rates.updatedAt))
    : null;

  return (
    <div>
      <PageHero
        size="sm"
        align="center"
        title={dict.currency.title}
        subtitle={dict.currency.subtitle}
      />

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <CurrencyConverter
          locale={loc}
          rates={rates}
          dict={{
            amount: dict.currency.amount,
            from: dict.currency.from,
            to: dict.currency.to,
            swap: dict.currency.swap,
            searchPlaceholder: dict.currency.searchPlaceholder,
            noMatches: dict.currency.noMatches,
            rateLine: dict.currency.rateLine,
            inverseLine: dict.currency.inverseLine,
            checkOnGoogle: dict.currency.checkOnGoogle,
            googleHint: dict.currency.googleHint,
            unavailable: dict.currency.unavailable,
            pairUnavailable: dict.currency.pairUnavailable,
            disclaimer: dict.currency.disclaimer,
          }}
        />

        {rates && updated && (
          <p className="mt-3 text-center text-xs text-navy-400">
            🕒 {dict.currency.updatedAt.replace("{when}", `${updated} UTC`)} ·{" "}
            {dict.currency.sourceNote.replace("{source}", rates.source)}
          </p>
        )}
      </div>
    </div>
  );
}
