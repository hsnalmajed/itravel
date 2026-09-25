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
 */

const WIDGET_SRC = "https://tpwgt.com/wl_web/main.js?wl_id=22604";

export default function FlightMetasearch({
  locale,
  heading,
  note,
}: {
  locale: Locale;
  heading: string;
  note: string;
}) {
  useEffect(() => {
    if (document.getElementById("tpwl-main")) return;
    const script = document.createElement("script");
    script.id = "tpwl-main";
    script.async = true;
    script.type = "module";
    script.src = WIDGET_SRC;
    document.head.appendChild(script);
  }, []);

  return (
    <section className="mt-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      <h2 className="mb-1 font-display text-h3 font-extrabold text-navy-900">{heading}</h2>
      <p className="mb-4 text-sm text-navy-500">{note}</p>
      {/* The widget fills these two. Keep the ids exactly as they are: the
          script looks them up by name and silently does nothing otherwise. */}
      <div id="tpwl-search" />
      <div id="tpwl-tickets" className="mt-4" />
    </section>
  );
}
