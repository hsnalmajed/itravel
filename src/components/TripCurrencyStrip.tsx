"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import { currencyFlag, type Currency } from "@/lib/currencies";
import { googleRateUrl } from "@/lib/rates";

/**
 * What your money is worth where you're going.
 *
 * Someone flying Riyadh → Istanbul is about to think in a currency they don't
 * use, and the first question is always the same: what is a riyal worth in
 * lira? Answering it here, on the page where they're already looking at
 * prices, saves a trip to a converter and stops them landing without a feel
 * for the numbers.
 *
 * Both directions are given, because travellers use them for different
 * things — one riyal in lira to price a coffee, a hundred lira in riyals to
 * check a taxi fare. And the strip says plainly that this is the mid-market
 * reference rate: it is not what an exchange counter hands over, and someone
 * budgeting off it should know that before they land, not after.
 */
export default function TripCurrencyStrip({
  from,
  to,
  locale,
}: {
  from: Currency;
  to: Currency;
  locale: Locale;
}) {
  const dict = getDictionary(locale);
  const [rate, setRate] = useState<number | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/rates?from=${from.code}&to=${to.code}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((d: { rate: number | null; source: string | null }) => {
        if (cancelled) return;
        if (d.rate == null) setFailed(true);
        else {
          setRate(d.rate);
          setSource(d.source);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [from.code, to.code]);

  // Nothing useful to say yet, and a skeleton here would only push the prices
  // down the page.
  if (failed || rate == null) return null;

  const name = (c: Currency) => (locale === "ar" ? c.nameAr : c.nameEn);
  const fmt = (value: number, decimals: number) =>
    value.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  // A hundred of the destination's money is the useful reverse figure: one
  // lira in riyals rounds to almost nothing and tells a traveller less than
  // the price of a taxi does.
  const reverse = 100 / rate;

  return (
    <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {dict.results.currencyHeading}
          </p>

          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-lg font-extrabold text-gray-900">
            <span aria-hidden="true">{currencyFlag(from)}</span>
            <span>
              1 {name(from)} ={" "}
              <span className="text-brand-800">
                {fmt(rate, to.decimals)} {name(to)}
              </span>
            </span>
            <span aria-hidden="true">{currencyFlag(to)}</span>
          </p>

          <p className="mt-1 text-sm text-gray-500">
            100 {name(to)} ={" "}
            <span className="font-bold text-gray-700">
              {fmt(reverse, from.decimals)} {name(from)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${locale}/currency?from=${from.code}&to=${to.code}`}
            className="rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-50"
          >
            {dict.results.currencyConvert}
          </Link>
          <a
            href={googleRateUrl(1, from.code, to.code)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-300"
          >
            {dict.currency.checkOnGoogle}
          </a>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-gray-400">
        {dict.results.currencyNote}
        {source ? ` · ${source}` : ""}
      </p>
    </section>
  );
}
