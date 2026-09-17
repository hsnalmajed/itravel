const IATA_URL = "https://www.iatatravelcentre.com/";
const MOFA_URL = "https://www.mofa.gov.sa/";

/**
 * The part of this feature that matters most.
 *
 * Everything else on this site can be a little out of date without hurting
 * anyone. Visa rules can't: a traveller who trusts a stale "no visa needed"
 * finds out at the gate. So this sits next to every single visa figure the
 * site shows — the country card and the full table both — and it links to the
 * two places that actually decide: the IATA database airlines check against,
 * and the Saudi foreign ministry.
 *
 * It is deliberately not collapsible and not styled to be ignorable.
 *
 * It is also, now, the *only* notice on the page. The visa page used to open
 * with three stacked full-width bars — a blue scope note, this amber warning,
 * and a heading — before a single country appeared, and three warnings in a
 * row is how a page teaches people to skip warnings. The scope note is a
 * clause of the same sentence, so it is a clause of the same block: one
 * notice, read once, taken seriously.
 */
export default function VisaWarning({
  dict,
  scope,
  checkedAt,
  sourceUrl,
}: {
  dict: {
    warningTitle: string;
    warningBody: string;
    checkIata: string;
    checkMofa: string;
    viewSource: string;
    checkedAt: string;
  };
  /** Who these figures apply to — folded in rather than given its own bar. */
  scope?: string;
  /** ISO date the source table was read, printed so staleness is visible. */
  checkedAt?: string;
  /** Wikipedia article the figures came from; omitted when none loaded. */
  sourceUrl?: string;
}) {
  const linkClass =
    "inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-amber-900 ring-1 ring-amber-300 transition hover:-translate-y-0.5 hover:shadow-sm";

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-300 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200/70 text-lg ring-1 ring-amber-300"
        aria-hidden="true"
      >
        ⚠️
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-amber-900">{dict.warningTitle}</p>
        <p className="mt-1 text-sm text-amber-800">
          {dict.warningBody}
          {scope && <span className="text-amber-700"> {scope}</span>}
        </p>
        {/* "From Wikipedia" is only half the disclosure; whether that reading
            was this morning or last spring is the other half. */}
        {checkedAt && (
          <p className="mt-1.5 text-2xs font-semibold text-amber-700">
            {dict.checkedAt.replace("{date}", checkedAt)}
          </p>
        )}
      </div>

      {/* The sources sit beside the warning rather than under it. On a wide
          screen that turns a four-line block into a two-line one, and the
          links stay where the eye already is. */}
      <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
        <a href={IATA_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {dict.checkIata} ↗
        </a>
        <a href={MOFA_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {dict.checkMofa} ↗
        </a>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {dict.viewSource} ↗
          </a>
        )}
      </div>
    </div>
  );
}
