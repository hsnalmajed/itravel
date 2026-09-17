"use client";

import { findAirport } from "@/lib/airports";
import { currencyForCountry } from "@/lib/currencies";
import { findCountryByEnglishName } from "@/lib/countries";

/**
 * The currency a budget is written in.
 *
 * Two problems with the four-option list this replaces. It offered SAR, USD,
 * AED and EUR — which covers a Saudi traveller and leaves out every other
 * Gulf one, so a visitor from Kuwait or Qatar had to convert their own budget
 * in their head before they could type it. And it always opened on SAR, even
 * for someone departing from Kuwait City, which is a small way of telling
 * them the site was not built for them.
 *
 * The list is now the Gulf plus the two currencies people actually quote
 * international prices in, and `currencyForOrigin` below lets the forms open
 * on whichever one matches the departure airport.
 */
export const BUDGET_CURRENCIES = [
  "SAR",
  "AED",
  "KWD",
  "QAR",
  "BHD",
  "OMR",
  "EGP",
  "JOD",
  "USD",
  "EUR",
  "GBP",
] as const;

/**
 * The currency of the country someone is flying out of.
 *
 * Returns undefined rather than a default when the airport is unknown, so
 * the caller can tell "we worked it out" from "we guessed" — a form that
 * silently switches a currency the traveller already chose is worse than one
 * that never guesses at all.
 */
export function currencyForOrigin(origin: string): string | undefined {
  const airport = findAirport(origin);
  if (!airport) return undefined;
  const country = findCountryByEnglishName(airport.countryEn);
  if (!country) return undefined;
  const currency = currencyForCountry(country.code);
  if (!currency) return undefined;
  return BUDGET_CURRENCIES.includes(currency.code as (typeof BUDGET_CURRENCIES)[number])
    ? currency.code
    : undefined;
}

export default function CurrencySelect({
  value,
  onChange,
  className,
  label,
}: {
  value: string;
  onChange: (code: string) => void;
  className: string;
  /** For screen readers when the visible label sits outside this element. */
  label: string;
}) {
  return (
    <select
      className={className}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
    >
      {BUDGET_CURRENCIES.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </select>
  );
}
