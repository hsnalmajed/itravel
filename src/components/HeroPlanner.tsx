"use client";

import type { Locale } from "@/lib/types";
import TripPlanner from "@/components/TripPlanner";

/**
 * The planner's frame, on the first screen.
 *
 * This used to hold two tabs over two separate forms. The tabs are gone:
 * the two forms were the same form apart from one answer, and that answer
 * now lives inside the planner, at the destination question where it
 * belongs (see TripPlanner). What is left here is the panel itself — the
 * translucent slab the form sits on, and the #plan anchor that "edit
 * search" links land on.
 *
 * No overflow-hidden: the calendar and the travellers counter are meant to
 * hang outside the panel, and clipping them was how the calendar lost half
 * its second month. text-start, because the hero centres its headline and a
 * form whose labels drift to the middle of their fields is unreadable.
 */
export default function HeroPlanner({ locale }: { locale: Locale }) {
  return (
    <div
      id="plan"
      className="mt-7 w-full max-w-4xl scroll-mt-24 rounded-2xl bg-navy-990/55 p-4 text-start ring-1 ring-white/15 backdrop-blur-xl sm:p-5"
    >
      <TripPlanner locale={locale} tone="dark" />
    </div>
  );
}
