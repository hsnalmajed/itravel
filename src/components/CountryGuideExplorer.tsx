"use client";

import { useState } from "react";
import type { Locale } from "@/lib/types";
import type { BookingKind, CostTier } from "@/lib/countryGuides";
import { BOOKING_HINTS, BOOKING_SHORT_LABELS, COST_TIER_LABELS } from "@/lib/countryGuides";

export interface GuideItem {
  key: string;
  nameAr: string;
  nameEn: string;
  emoji?: string;
  photo?: string;
  extract?: string;
  booking?: BookingKind;
  costTier?: CostTier;
}

type CategoryKey = "attractions" | "activities" | "cuisine";

// Mirrors the shape of dict.attractions — only the keys this component
// actually renders, kept loose so callers don't need a separate type import.
interface ExplorerDict {
  attractionsHeading: string;
  activitiesHeading: string;
  cuisineHeading: string;
  howToBook: string;
  cost: string;
  photoUnavailable: string;
  placesCount: string;
  backToCategories: string;
  restaurantsNotice: string;
  viewCategory: string;
  tagAttraction: string;
  tagActivity: string;
  tagCuisine: string;
  backToList: string;
}

// Styled after the TripAdvisor app's own destination page: a strip of tabs
// at the top (Things to Do / Restaurants / ...) switches between ranked,
// vertically-stacked list cards (photo + rank + name + tag + short blurb +
// a couple of compact badges) — tapping a card opens the same card as a
// full detail view with a large photo, the full description, and the
// cost/booking info spelled out, with a way back to the list. No fake star
// ratings or review counts are shown — we don't have real traveler review
// data, so we don't invent it; everything shown here is either pulled live
// from Wikipedia or is our own honestly-sourced cost/booking info.
export default function CountryGuideExplorer({
  locale,
  dict,
  attractions,
  activities,
  cuisine,
}: {
  locale: Locale;
  dict: ExplorerDict;
  attractions: GuideItem[];
  activities: GuideItem[];
  cuisine: GuideItem[];
}) {
  const allCategories: { key: CategoryKey; icon: string; heading: string; tag: string; items: GuideItem[] }[] = [
    { key: "attractions", icon: "🏛️", heading: dict.attractionsHeading, tag: dict.tagAttraction, items: attractions },
    { key: "activities", icon: "🎟️", heading: dict.activitiesHeading, tag: dict.tagActivity, items: activities },
    { key: "cuisine", icon: "🍽️", heading: dict.cuisineHeading, tag: dict.tagCuisine, items: cuisine },
  ];
  const categories = allCategories.filter((c) => c.items.length > 0);

  const [activeTab, setActiveTab] = useState<CategoryKey | null>(categories[0]?.key ?? null);
  const [selected, setSelected] = useState<GuideItem | null>(null);

  if (categories.length === 0) return null;
  const category = categories.find((c) => c.key === activeTab) ?? categories[0];
  const back = locale === "ar" ? "→" : "←";

  return (
    <div>
      {/* Tab strip — same idea as TripAdvisor's "Things to Do / Restaurants / Hotels" nav */}
      <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => {
              setActiveTab(cat.key);
              setSelected(null);
            }}
            className={`shrink-0 -mb-px whitespace-nowrap border-b-2 px-3.5 sm:px-4 py-2.5 text-sm font-bold transition ${
              cat.key === category.key
                ? "border-accent-600 text-accent-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="me-1.5">{cat.icon}</span>
            {cat.heading}
            <span className="ms-1.5 text-xs font-normal text-gray-400">({cat.items.length})</span>
          </button>
        ))}
      </div>

      {selected ? (
        <div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900 transition"
          >
            {back} {dict.backToList}
          </button>

          <div className="relative h-56 sm:h-72 overflow-hidden rounded-2xl mb-5">
            {selected.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.photo}
                alt={locale === "ar" ? selected.nameAr : selected.nameEn}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-800 to-brand-950 text-white/70">
                {selected.emoji && <span className="text-4xl">{selected.emoji}</span>}
                <span className="text-xs">{dict.photoUnavailable}</span>
              </div>
            )}
          </div>

          <span className="inline-block text-xs font-semibold text-brand-700 bg-brand-50 rounded-full px-2.5 py-1">
            {category.tag}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2">
            {locale === "ar" ? selected.nameAr : selected.nameEn}
          </h2>
          <p className="text-xs font-bold text-gray-400 mt-1">
            #{category.items.findIndex((i) => i.key === selected.key) + 1}{" "}
            {locale === "ar" ? `من ${category.items.length}` : `of ${category.items.length}`}
          </p>

          {selected.extract && (
            <p className="mt-3.5 text-gray-600 leading-relaxed">{selected.extract}</p>
          )}

          {selected.costTier && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-accent-50 ring-1 ring-accent-100 px-4 py-3.5">
              <span className="text-sm font-semibold text-accent-900">{dict.cost}</span>
              <span className="text-sm font-bold text-accent-800">{COST_TIER_LABELS[selected.costTier][locale]}</span>
            </div>
          )}

          {selected.booking && (
            <div className="mt-3 rounded-xl bg-brand-50 ring-1 ring-brand-100 px-4 py-3.5">
              <p className="text-sm font-semibold text-brand-900 mb-1">{dict.howToBook}</p>
              <p className="text-sm text-brand-800 leading-relaxed">{BOOKING_HINTS[selected.booking][locale]}</p>
            </div>
          )}

          {category.key === "cuisine" && (
            <p className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">{dict.restaurantsNotice}</p>
          )}
        </div>
      ) : (
        <div>
          {category.key === "cuisine" && (
            <p className="mb-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">{dict.restaurantsNotice}</p>
          )}
          <div className="flex flex-col gap-3">
            {category.items.map((item, i) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelected(item)}
                className="flex items-stretch overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 text-start transition hover:shadow-md hover:ring-brand-200"
              >
                <div className="relative w-28 sm:w-36 min-h-28 shrink-0">
                  {item.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photo}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-2xl text-gray-300">
                      {item.emoji ?? "📍"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 p-3.5 sm:p-4">
                  <p className="text-xs font-bold text-gray-400">
                    #{i + 1} {locale === "ar" ? `من ${category.items.length}` : `of ${category.items.length}`}
                  </p>
                  <h3 className="font-bold text-gray-900 truncate">
                    {locale === "ar" ? item.nameAr : item.nameEn}
                  </h3>
                  <span className="inline-block mt-1 text-[11px] font-semibold text-brand-700 bg-brand-50 rounded-full px-2 py-0.5">
                    {category.tag}
                  </span>
                  {item.extract && (
                    <p className="mt-1.5 text-sm text-gray-500 leading-snug line-clamp-2">{item.extract}</p>
                  )}
                  {(item.costTier || item.booking) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.costTier && (
                        <span className="text-[11px] font-semibold text-accent-800 bg-accent-50 rounded-full px-2 py-0.5">
                          {COST_TIER_LABELS[item.costTier][locale]}
                        </span>
                      )}
                      {item.booking && (
                        <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
                          {BOOKING_SHORT_LABELS[item.booking][locale]}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
