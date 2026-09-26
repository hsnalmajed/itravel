"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import { findAirport } from "@/lib/airports";

/**
 * Our notes on the widget's own flight cards.
 *
 * The widget draws every card itself, inside a shadow root, and buries the
 * things a traveller decides on: whether a leg is direct is only visible as
 * a row of airport codes, the layover length sits in a tooltip-sized label,
 * baggage is a "+481" beside the price, and "best" and "cheapest" are small
 * blue tags. This adds one row to the top of each card that says those
 * things plainly — outbound and return, direct or where it stops and for how
 * long, baggage in or not, and where the fare sits against the budget — and
 * recolours the widget's own best / cheapest tags in the site's colours.
 *
 * Everything written comes from that same card; nothing is looked up
 * elsewhere except the airport code's city name. The markers it reads
 * (checked on sfrtna.com, 26 Sep 2026):
 *
 *   card          [class*="FlightCard-module__card___"]
 *   one leg       [class*="Flight-module__cardFlight___"]
 *   airport code  [class*="airportCode"]
 *   a stop        [class*="cardFlightTravelLineTransfer"]  → "CAI 15س 15م transfer"
 *   price         [data-testid^="flight-card-price-"]
 *   baggage       [class*="cardLeftBaggageLeftPc"]          → "الأمتعة+481 ر.س" when extra
 *   tags          [class*="cardBadges"]                     → "الاختيار الأمثل", "الأرخص"
 *
 * The card is a CSS grid, so the row spans every column (grid-column 1/-1)
 * and sits across the top instead of squeezing in as a narrow column.
 *
 * If the widget renames any of these, the row for that card is simply not
 * drawn; the card itself is untouched. The row is rebuilt whenever the card's
 * contents change (filters, sorting), and never duplicated.
 */

const STYLE_ID = "sfr-card-notes-style";
const ROW_CLASS = "sfr-notes";

// Inside the shadow root our stylesheet does not reach, so the few styles the
// row needs travel with it. Colours are the site's own: navy, sun, sea, mist.
const CSS = `
.${ROW_CLASS}{grid-column:1 / -1;display:flex;flex-wrap:wrap;gap:6px;padding:12px 16px 2px;font-family:inherit}
.${ROW_CLASS} span{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:4px 10px;font-size:12.5px;font-weight:700;line-height:1.3}
.${ROW_CLASS} .direct{background:#e6f6fc;color:#0b2d5b;box-shadow:inset 0 0 0 1px #84d2f3}
.${ROW_CLASS} .stop{background:#fff4e5;color:#7a3d00;box-shadow:inset 0 0 0 1px #ffc978}
.${ROW_CLASS} .bag-in{background:#e6f6fc;color:#0b2d5b}
.${ROW_CLASS} .bag-out{background:#f1f4f8;color:#3b4a60}
.${ROW_CLASS} .fits{background:#0b2d5b;color:#fff}
.${ROW_CLASS} .over{background:#fff4e5;color:#7a3d00}
.${ROW_CLASS} .both{background:linear-gradient(90deg,#ffa630,#3bb6e4);color:#062653;font-weight:900}
[data-sfr-tag]{font-weight:800 !important;font-size:13.5px !important;padding:3px 12px !important;border-radius:999px !important}
[data-sfr-tag="best"]{background:#ffa630 !important;color:#062653 !important}
[data-sfr-tag="cheapest"]{background:#3bb6e4 !important;color:#062653 !important}
`;

function amountOf(text: string): number | null {
  const digits = text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[^\d.,]/g, "")
    .replace(/,/g, "");
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const TAG_BEST = /الأمثل|best/i;
const TAG_CHEAPEST = /الأرخص|cheapest/i;

export default function FlightCardNotes({
  locale,
  budget,
  currency,
}: {
  locale: Locale;
  budget: number;
  currency: string;
}) {
  useEffect(() => {
    const t = getDictionary(locale).results;
    const city = (code: string) => {
      const a = findAirport(code);
      return a ? (locale === "ar" ? a.cityAr : a.cityEn) : code;
    };
    const money = (n: number) =>
      `${Math.round(n).toLocaleString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US")} ${currency}`;
    // Only compare fares in the budget's own currency; see FlightBudgetBar.
    const sameCurrency = (text: string) =>
      currency === "SAR" ? /ر\.س|SAR/.test(text) : text.includes(currency);

    function chip(cls: string, text: string) {
      const s = document.createElement("span");
      s.className = cls;
      s.textContent = text;
      return s;
    }

    function notesFor(card: Element): HTMLElement[] | null {
      const legs = [...card.querySelectorAll('[class*="Flight-module__cardFlight___"]')];
      if (legs.length === 0) return null;
      const out: HTMLElement[] = [];

      // The widget's own tags, in our colours — and said once when both.
      const tags = [...card.querySelectorAll('[class*="cardBadges"]')];
      let best = false;
      let cheapest = false;
      for (const tag of tags) {
        const text = tag.textContent || "";
        if (TAG_BEST.test(text)) {
          best = true;
          tag.setAttribute("data-sfr-tag", "best");
        } else if (TAG_CHEAPEST.test(text)) {
          cheapest = true;
          tag.setAttribute("data-sfr-tag", "cheapest");
        }
      }
      if (best && cheapest) out.push(chip("both", t.cardBoth));

      legs.forEach((leg, i) => {
        const label = legs.length === 2 ? (i === 0 ? t.cardOutbound : t.cardReturn) : t.cardLeg;
        const stops = [...leg.querySelectorAll('[class*="cardFlightTravelLineTransfer"]')];
        if (stops.length === 0) {
          out.push(chip("direct", `✈ ${label}: ${t.cardDirect}`));
          return;
        }
        const where = stops
          .map((s) => {
            const code = s.querySelector('[class*="airportCode"]')?.textContent?.trim() || "";
            // "CAI 15س 15م transfer" → "15س 15م"
            const wait = (s.textContent || "")
              .replace(code, "")
              .replace(/transfer/i, "")
              .replace(/\s+/g, " ")
              .trim();
            return wait ? `${city(code)} (${wait})` : city(code);
          })
          .join("، ");
        const count = stops.length === 1 ? t.cardOneStop : t.cardStops.replace("{count}", String(stops.length));
        out.push(chip("stop", `↺ ${label}: ${count} — ${where}`));
      });

      const bag = card.querySelector('[class*="cardLeftBaggageLeftPc"]')?.textContent || "";
      if (bag.includes("+")) out.push(chip("bag-out", `🧳 ${t.cardBagExtra}`));
      else if (/تشمل الأمتعة|baggage included/i.test(card.textContent || "")) out.push(chip("bag-in", `🧳 ${t.cardBagIn}`));

      const priceText = card.querySelector('[data-testid^="flight-card-price-"]')?.textContent || "";
      const price = amountOf(priceText);
      if (budget > 0 && price !== null && sameCurrency(priceText)) {
        out.push(
          price <= budget
            ? chip("fits", t.cardFits.replace("{amount}", money(budget - price)))
            : chip("over", t.cardOver.replace("{amount}", money(price - budget)))
        );
      }
      return out;
    }

    function pass() {
      const root = document.getElementById("tpwl-tickets")?.shadowRoot;
      if (!root) return;
      if (!root.getElementById(STYLE_ID)) {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        root.appendChild(style);
      }
      root.querySelectorAll('[class*="FlightCard-module__card___"]').forEach((card) => {
        const existing = card.querySelector(`:scope > .${ROW_CLASS}`);
        const notes = notesFor(card);
        if (!notes) {
          existing?.remove();
          return;
        }
        const key = notes.map((n) => n.textContent).join("|");
        if (existing && existing.getAttribute("data-key") === key) return;
        const row = document.createElement("div");
        row.className = ROW_CLASS;
        row.setAttribute("data-key", key);
        notes.forEach((n) => row.appendChild(n));
        if (existing) existing.replaceWith(row);
        else card.prepend(row);
      });
    }

    pass();
    const id = window.setInterval(pass, 1000);
    return () => window.clearInterval(id);
  }, [locale, budget, currency]);

  return null;
}
