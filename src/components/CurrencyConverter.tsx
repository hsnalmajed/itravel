"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/types";
import { CURRENCIES, currencyFlag, findCurrency } from "@/lib/currencies";
import { googleRateUrl, rateBetween, type Rates } from "@/lib/rates";

interface ConverterDict {
  amount: string;
  from: string;
  to: string;
  swap: string;
  rateLine: string;
  inverseLine: string;
  checkOnGoogle: string;
  googleHint: string;
  unavailable: string;
  pairUnavailable: string;
  disclaimer: string;
}

/**
 * The conversion runs entirely in the browser off one rates table fetched on
 * the server, so changing the amount or either currency is instant — no
 * request per keystroke, and no rate that shifts underneath the visitor
 * mid-edit.
 */
export default function CurrencyConverter({
  locale,
  rates,
  dict,
}: {
  locale: Locale;
  /** Null when both rate feeds were unreachable. */
  rates: Rates | null;
  dict: ConverterDict;
}) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("SAR");
  const [to, setTo] = useState("TRY");

  const fromCurrency = findCurrency(from);
  const toCurrency = findCurrency(to);

  // An empty or half-typed box shouldn't flash "NaN" at the reader; it just
  // means there's nothing to convert yet.
  const parsedAmount = Number(amount.replace(/,/g, ""));
  const validAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

  const rate = useMemo(
    () => (rates ? rateBetween(from, to, rates) : null),
    [rates, from, to]
  );

  const nf = (value: number, decimals: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  // A rate is shown to more places than money is. "1 JPY = 0 SAR" is useless;
  // "1 JPY = 0.0251 SAR" is the number the traveller came for.
  const rateDecimals = (r: number) => (r >= 100 ? 2 : r >= 1 ? 4 : 6);

  const converted = rate === null ? null : validAmount * rate;

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const selectClass =
    "w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

  return (
    <div>
      <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-black/5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-gray-700">{dict.amount}</span>
          <input
            // Not type="number": its spinner and locale-dependent decimal
            // handling get in the way on phones, and we parse the text
            // ourselves anyway.
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-lg font-bold text-gray-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            dir="ltr"
          />
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-gray-700">{dict.from}</span>
            <select value={from} onChange={(e) => setFrom(e.target.value)} className={selectClass}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {currencyFlag(c)} {c.code} — {locale === "ar" ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={swap}
            aria-label={dict.swap}
            title={dict.swap}
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-800 ring-1 ring-brand-100 transition hover:bg-brand-100 hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L4 7m3-3l3 3M17 8v12m0 0l3-3m-3 3l-3-3" />
            </svg>
          </button>

          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-gray-700">{dict.to}</span>
            <select value={to} onChange={(e) => setTo(e.target.value)} className={selectClass}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {currencyFlag(c)} {c.code} — {locale === "ar" ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-to-br from-brand-950 to-brand-800 p-5 text-white">
          {!rates ? (
            <p className="text-sm leading-relaxed text-white/90">{dict.unavailable}</p>
          ) : rate === null || !fromCurrency || !toCurrency ? (
            <p className="text-sm leading-relaxed text-white/90">{dict.pairUnavailable}</p>
          ) : (
            <>
              <p className="text-sm text-white/70" dir="ltr">
                {nf(validAmount, fromCurrency.decimals)} {fromCurrency.code}
              </p>
              <p className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight" dir="ltr">
                {nf(converted as number, toCurrency.decimals)}{" "}
                <span className="text-xl font-bold text-white/80">{toCurrency.code}</span>
              </p>
              <div className="mt-3 space-y-0.5 text-xs text-white/70" dir="ltr">
                <p>
                  {dict.rateLine
                    .replace("{from}", fromCurrency.code)
                    .replace("{rate}", nf(rate, rateDecimals(rate)))
                    .replace("{to}", toCurrency.code)}
                </p>
                <p>
                  {dict.inverseLine
                    .replace("{to}", toCurrency.code)
                    .replace("{rate}", nf(1 / rate, rateDecimals(1 / rate)))
                    .replace("{from}", fromCurrency.code)}
                </p>
              </div>
            </>
          )}
        </div>

        <a
          href={googleRateUrl(validAmount || 1, from, to)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-brand-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          🔎 {dict.checkOnGoogle} ↗
        </a>
        <p className="mt-2 text-center text-xs leading-relaxed text-gray-500">{dict.googleHint}</p>
      </div>

      <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
        {dict.disclaimer}
      </p>
    </div>
  );
}
