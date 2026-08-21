"use client";

import { useMemo, useState } from "react";
import { PIN_STYLES, type PinCategory } from "@/lib/pinStyles";
import Photo from "@/components/Photo";

export interface PlaceListItem {
  key: string;
  name: string;
  description?: string;
  photo?: string;
  category: PinCategory;
  wikiUrl: string;
  /** Name and description are English because no article exists in Arabic. */
  englishOnly: boolean;
}

interface ExplorerDict {
  attractionsHeading: string;
  activitiesHeading: string;
  cuisineHeading: string;
  otherHeading: string;
  placesCount: string;
  emptyCategory: string;
  englishOnly: string;
  readMoreWiki: string;
  loadMore: string;
  searchPlaceholder: string;
}

// How many cards to show before the visitor asks for more. A city can carry
// a couple of hundred places, and rendering all of them at once means a very
// long page of images on a phone for no reason.
const PAGE = 24;

const TAB_ORDER: PinCategory[] = ["historic", "activity", "food", "place"];

// The three sections the site has always had — sights, things to do, places
// to eat — plus the honest fourth: documented places that Wikipedia's own
// description didn't put in any of them. They'd otherwise be dropped, and
// they're often the most interesting finds in a city.
export default function CityPlacesExplorer({
  places,
  dict,
}: {
  // Names and descriptions arrive already resolved to the reader's language,
  // so this component never needs to know which language that is.
  places: PlaceListItem[];
  dict: ExplorerDict;
}) {
  const labels: Record<PinCategory, string> = {
    historic: dict.attractionsHeading,
    activity: dict.activitiesHeading,
    food: dict.cuisineHeading,
    place: dict.otherHeading,
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of places) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [places]);

  const tabs = TAB_ORDER.filter((t) => (counts[t] ?? 0) > 0);
  const [active, setActive] = useState<PinCategory>(tabs[0] ?? "historic");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places
      .filter((p) => p.category === active)
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
      );
  }, [places, active, query]);

  function pick(tab: PinCategory) {
    setActive(tab);
    // A fresh tab starts at the top of its own list rather than inheriting
    // however far the visitor had scrolled the previous one.
    setShown(PAGE);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab === active;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => pick(tab)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                isActive
                  ? "bg-brand-800 text-white shadow-sm"
                  : "bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-brand-300"
              }`}
            >
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                style={{ backgroundColor: PIN_STYLES[tab].color }}
                aria-hidden="true"
              >
                {PIN_STYLES[tab].glyph}
              </span>
              {labels[tab]}
              <span className={isActive ? "text-white/70" : "text-gray-400"}>({counts[tab]})</span>
            </button>
          );
        })}
      </div>

      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShown(PAGE);
        }}
        placeholder={dict.searchPlaceholder}
        className="mb-5 w-full max-w-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder:text-gray-400"
      />

      {visible.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          {dict.emptyCategory}
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.slice(0, shown).map((p) => (
              <article
                key={p.key}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Photo
                  src={p.photo}
                  className="h-40 w-full object-cover"
                  fallback={
                    <div
                      className="flex h-40 w-full items-center justify-center text-4xl"
                      style={{ backgroundColor: `${PIN_STYLES[p.category].color}14` }}
                      aria-hidden="true"
                    >
                      {PIN_STYLES[p.category].glyph}
                    </div>
                  }
                />

                <div className="flex flex-1 flex-col p-4">
                  <h3
                    className="font-bold leading-snug text-gray-900"
                    // An English name inside an Arabic page needs its own
                    // direction, or trailing punctuation jumps to the wrong end.
                    dir={p.englishOnly ? "ltr" : undefined}
                  >
                    {p.name}
                  </h3>

                  {p.description && (
                    <p
                      className="mt-1.5 text-sm leading-relaxed text-gray-600"
                      dir={p.englishOnly ? "ltr" : undefined}
                    >
                      {p.description}
                    </p>
                  )}

                  {p.englishOnly && (
                    <p className="mt-2 text-[11px] leading-snug text-amber-700">{dict.englishOnly}</p>
                  )}

                  <a
                    href={p.wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:underline"
                  >
                    {dict.readMoreWiki}
                  </a>
                </div>
              </article>
            ))}
          </div>

          {shown < visible.length && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="mx-auto mt-6 block rounded-full bg-white px-6 py-3 text-sm font-bold text-brand-800 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {dict.loadMore} ({visible.length - shown})
            </button>
          )}
        </>
      )}

      <p className="sr-only" aria-live="polite">
        {dict.placesCount.replace("{count}", String(visible.length))}
      </p>
    </div>
  );
}
