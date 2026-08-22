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
 */
export default function VisaWarning({
  dict,
  sourceUrl,
}: {
  dict: {
    warningTitle: string;
    warningBody: string;
    checkIata: string;
    checkMofa: string;
    viewSource: string;
  };
  /** Wikipedia article the figures came from; omitted when none loaded. */
  sourceUrl?: string;
}) {
  const linkClass =
    "inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-amber-900 ring-1 ring-amber-300 transition hover:-translate-y-0.5 hover:shadow-sm";

  return (
    <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-300">
      <p className="flex items-center gap-2 font-bold text-amber-900">
        <span aria-hidden="true">⚠️</span>
        {dict.warningTitle}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-amber-800">{dict.warningBody}</p>

      <div className="mt-3 flex flex-wrap gap-2">
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
