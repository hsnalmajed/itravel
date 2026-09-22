"use client";

import type { Locale } from "@/lib/types";
import TripPlanner from "@/components/TripPlanner";

/**
 * The planner's frame, on the first screen.
 *
 * The translucent slab the form sits on, and the #plan anchor that "edit
 * search" links land on. Wide enough for the search to be one row — origin,
 * destination, dates, travellers, budget — because a row is read in one
 * glance and a grid of two is read twice.
 *
 * The top margin is room for the two tabs, which sit half outside the panel
 * on its top edge (see TripPlanner). No overflow-hidden: the calendar and the
 * travellers counter are meant to hang outside the panel. text-start because
 * the hero centres its headline, and labels drifting to the middle of their
 * fields are unreadable.
 */
export default function HeroPlanner({ locale }: { locale: Locale }) {
  return (
    <div
      id="plan"
      className="mt-12 w-full max-w-6xl scroll-mt-28 rounded-2xl bg-navy-990/60 px-4 pb-5 text-start ring-1 ring-white/15 backdrop-blur-xl sm:px-6 sm:pb-6"
    >
      <TripPlanner locale={locale} tone="dark" />
    </div>
  );
}
