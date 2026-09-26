"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import Icon, { type IconName } from "@/components/ui/Icon";
import TripPlanner from "@/components/TripPlanner";
import HotelPlanner from "@/components/HotelPlanner";
import { PLAN_EVENT, type PlanProduct } from "@/lib/planEvents";

/**
 * The planner, on the first screen.
 *
 * It opens with one question: flights or hotels. They used to be one form
 * with a "flights + hotel / flights only / hotels only" switch in the middle,
 * which meant a flight search carried hotel questions, a budget that had to
 * cover two different things, and a results page that could only do justice
 * to one of them. Two planners, chosen first, let each ask only its own
 * questions — and let each grow its own results without the other in the way.
 *
 * Nothing is chosen on a fresh visit, so the first thing anyone sees is the
 * choice itself. Arriving back from a results page's "edit search" opens the
 * planner it came from: the flight pages send `mode`, the hotel page sends
 * `hmode`.
 *
 * The panel's top margin is room for each planner's own two tabs, which sit
 * half outside it on its top edge. No overflow-hidden: the calendar and the
 * travellers counter hang outside the panel. text-start because the hero
 * centres its headline, and labels drifting to the middle of their fields
 * are unreadable.
 */

type Product = PlanProduct;

function initialProduct(sp: URLSearchParams): Product | null {
  const p = sp.get("product");
  if (p === "flights" || p === "hotels") return p;
  if (sp.get("hmode")) return "hotels";
  if (sp.get("mode")) return "flights";
  return null;
}

export default function HeroPlanner({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const sp = useSearchParams();
  const [product, setProduct] = useState<Product | null>(() =>
    initialProduct(new URLSearchParams(sp.toString()))
  );

  // The showcase's "plan your trip" tab opens this planner rather than
  // drawing a second one — see planEvents.ts.
  useEffect(() => {
    function onOpen(e: Event) {
      const p = (e as CustomEvent<PlanProduct>).detail;
      if (p !== "flights" && p !== "hotels") return;
      setProduct(p);
      document.getElementById("plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.addEventListener(PLAN_EVENT, onOpen);
    return () => window.removeEventListener(PLAN_EVENT, onOpen);
  }, []);

  const choices: { value: Product; icon: IconName; title: string; hint: string }[] = [
    { value: "flights", icon: "plane", title: dict.productSelect.flightsTitle, hint: dict.productSelect.flightsHint },
    { value: "hotels", icon: "hotel", title: dict.productSelect.hotelsTitle, hint: dict.productSelect.hotelsHint },
  ];

  return (
    <div id="plan" className="mt-10 w-full max-w-6xl scroll-mt-28 text-start">
      <div
        role="radiogroup"
        aria-label={dict.productSelect.label}
        className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-3"
      >
        {choices.map((c) => {
          const active = product === c.value;
          return (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setProduct(c.value)}
              className={`flex items-center justify-center gap-3 rounded-2xl px-4 ring-1 backdrop-blur-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 ${
                product === null ? "py-6 sm:py-8" : "py-3.5"
              } ${
                active
                  ? "bg-white text-navy-950 ring-white shadow-[0_12px_32px_-12px_rgba(4,24,47,0.6)]"
                  : "bg-navy-990/60 text-white ring-white/20 hover:bg-navy-990/75 hover:ring-white/40"
              }`}
            >
              <span
                className={`flex shrink-0 items-center justify-center rounded-full ${
                  product === null ? "h-12 w-12" : "h-9 w-9"
                } ${active ? "bg-sun-400 text-navy-950" : "bg-white/10 text-sun-400"}`}
              >
                <Icon name={c.icon} className={product === null ? "h-6 w-6" : "h-[1.125rem] w-[1.125rem]"} />
              </span>
              <span className="min-w-0 text-start">
                <span
                  className={`block font-display font-extrabold ${product === null ? "text-h3" : "text-base"}`}
                >
                  {c.title}
                </span>
                <span className={`block text-xs leading-snug ${active ? "text-navy-700" : "text-white/65"}`}>
                  {c.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {product === null && (
        <p className="mt-4 text-center text-sm font-semibold text-white/70">{dict.productSelect.chooseFirst}</p>
      )}

      {product !== null && (
        <div className="mt-12 rounded-2xl bg-navy-990/60 px-4 pb-5 ring-1 ring-white/15 backdrop-blur-xl sm:px-6 sm:pb-6">
          {product === "flights" ? (
            <TripPlanner locale={locale} tone="dark" />
          ) : (
            <HotelPlanner locale={locale} tone="dark" />
          )}
        </div>
      )}
    </div>
  );
}
