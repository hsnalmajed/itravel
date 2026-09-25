"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/types";

/**
 * Real flight results, inside our own page.
 *
 * Travelpayouts' live Search API is gated behind 50,000 monthly users, which
 * a new site does not have and cannot get without something worth visiting.
 * Their White Label widget is the way out of that circle: the same live
 * search Aviasales runs — every airline and agency it covers, for the exact
 * dates asked — rendered into these two containers on our own domain, in our
 * own colours, with the booking click credited to us.
 *
 * So the site keeps the part that is ours (a budget, a destination, a plan)
 * and stops pretending to be a search engine it cannot yet be. When the
 * traffic clears their threshold we swap this for the API and draw the
 * results ourselves; nothing the traveller sees has to change.
 *
 * The script is loaded once, on the pages that actually show flights — it is
 * a third-party module and has no business on a page about visas.
 *
 * Why this block is on the homepage as well as the results page: when someone
 * searches in the widget, the widget itself decides where the answer goes,
 * and what it does is open the site's own root. There is no setting for that
 * address — the White Label has no "results page" field — so the only way the
 * tickets land somewhere of ours rather than nowhere is for the root to carry
 * the same two containers. Hence `tone`: the results page is white, the
 * homepage is navy, and the widget's own cards are white either way.
 */

const WIDGET_SRC = "https://tpwgt.com/wl_web/main.js?wl_id=22604";

export default function FlightMetasearch({
  locale,
  heading,
  note,
  tone = "light",
  prefill,
}: {
  locale: Locale;
  heading: string;
  note: string;
  /** "dark" puts the block on a navy background and boxes it in white. */
  tone?: "light" | "dark";
  /** The trip, as flightSearchCode writes it — e.g. "RUH1611IST23112". */
  prefill?: string | null;
}) {
  useEffect(() => {
    // The widget takes its starting trip from this one parameter, and reads
    // it when its script runs — so it goes on the address before the script
    // is added, never after. With it there the traveller's own dates are
    // already searched when the page opens; without it they would be asked
    // for the trip a second time, which is the thing this site exists not to
    // do.
    if (prefill) {
      const url = new URL(window.location.href);
      if (url.searchParams.get("flightSearch") !== prefill) {
        url.searchParams.set("flightSearch", prefill);
        window.history.replaceState(null, "", url.toString());
      }
    }
    if (document.getElementById("tpwl-main")) return;
    const script = document.createElement("script");
    script.id = "tpwl-main";
    script.async = true;
    script.type = "module";
    script.src = WIDGET_SRC;
    document.head.appendChild(script);
  }, [prefill]);

  const dark = tone === "dark";
  return (
    <section className={dark ? "" : "mt-8"} dir={locale === "ar" ? "rtl" : "ltr"}>
      <h2
        className={`mb-1 font-display text-h3 font-extrabold ${dark ? "text-white" : "text-navy-900"}`}
      >
        {heading}
      </h2>
      <p className={`mb-4 text-sm ${dark ? "text-white/70" : "text-navy-500"}`}>{note}</p>
      {/* The widget fills these two. Keep the ids exactly as they are: the
          script looks them up by name and silently does nothing otherwise. */}
      <div className={dark ? "rounded-3xl bg-white p-3 shadow-sun sm:p-4" : ""}>
        <div id="tpwl-search" />
        <div id="tpwl-tickets" className="mt-4 empty:mt-0" />
      </div>
    </section>
  );
}
