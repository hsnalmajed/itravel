"use client";

import { useState } from "react";
import type { Locale } from "@/lib/types";
import type { BookingKind, CostTier } from "@/lib/countryGuides";
import { BOOKING_HINTS, COST_TIER_LABELS } from "@/lib/countryGuides";

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
}

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
  const [active, setActive] = useState<CategoryKey | null>(null);

  const allCategories: { key: CategoryKey; icon: string; heading: string; items: GuideItem[] }[] = [
    { key: "attractions", icon: "🏛️", heading: dict.attractionsHeading, items: attractions },
    { key: "activities", icon: "🎟️", heading: dict.activitiesHeading, items: activities },
    { key: "cuisine", icon: "🍽️", heading: dict.cuisineHeading, items: cuisine },
  ];
  const categories = allCategories.filter((c) => c.items.length > 0);

  if (active) {
    const category = categories.find((c) => c.key === active);
    if (!category) return null;
    return (
      <div>
        <button
          type="button"
          onClick={() => setActive(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900 transition"
        >
          {locale === "ar" ? "→" : "←"} {dict.backToCategories}
        </button>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>{category.icon}</span>
          {category.heading}
        </h2>
        {active === "cuisine" && (
          <p className="mb-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5">{dict.restaurantsNotice}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {category.items.map((item) => (
            <div key={item.key} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              {item.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photo}
                  alt={locale === "ar" ? item.nameAr : item.nameEn}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="h-28 w-full flex flex-col items-center justify-center gap-1 bg-gray-50 text-gray-400 text-xs">
                  {item.emoji && <span className="text-2xl">{item.emoji}</span>}
                  {dict.photoUnavailable}
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-gray-900">{locale === "ar" ? item.nameAr : item.nameEn}</h3>
                {item.extract && (
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed line-clamp-4">{item.extract}</p>
                )}
                {item.costTier && (
                  <p className="mt-2.5 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">{dict.cost}: </span>
                    {COST_TIER_LABELS[item.costTier][locale]}
                  </p>
                )}
                {item.booking && (
                  <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-2">
                    <span className="font-semibold text-gray-700">{dict.howToBook}: </span>
                    {BOOKING_HINTS[item.booking][locale]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {categories.map((category) => {
        const cover = category.items.find((i) => i.photo)?.photo;
        return (
          <button
            key={category.key}
            type="button"
            onClick={() => setActive(category.key)}
            className="group relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5 text-start transition hover:shadow-md hover:ring-brand-200 h-40"
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-800 to-brand-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-4 text-white">
              <span className="text-2xl leading-none mb-1">{category.icon}</span>
              <p className="font-bold">{category.heading}</p>
              <p className="text-xs text-white/80 mt-0.5">
                {dict.placesCount.replace("{count}", String(category.items.length))} · {dict.viewCategory}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
