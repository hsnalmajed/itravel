import Photo from "@/components/Photo";

/**
 * The one hero every inner page wears.
 *
 * Before this existed each page invented its own banner — a flat navy bar
 * here, a gradient there — which is the single biggest reason the site read
 * as a set of unrelated screens. Now the shape is fixed: a real photograph
 * of the place, the navy scrim, an eyebrow, the title, and an optional row
 * of facts. Only the picture and the words change.
 *
 * `photo` is optional on purpose. Wikipedia is the source for most of these
 * images and it goes down; when it does the hero falls back to a navy
 * gradient with the same proportions, so the page loses its picture without
 * losing its composition.
 */
export default function PageHero({
  photo,
  eyebrow,
  title,
  subtitle,
  facts,
  children,
  size = "md",
  align = "start",
}: {
  photo?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  facts?: { label: string; value: string }[];
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  align?: "start" | "center";
}) {
  const heights = {
    sm: "min-h-[16rem] sm:min-h-[18rem]",
    md: "min-h-[20rem] sm:min-h-[24rem]",
    lg: "min-h-[25rem] sm:min-h-[31rem]",
  } as const;

  return (
    <section className={`relative isolate flex ${heights[size]} items-end overflow-hidden bg-navy-990`}>
      <Photo
        src={photo}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        fallback={
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_70%_0%,var(--navy-700),var(--navy-990))]" />
        }
      />
      <div className="scrim absolute inset-0 -z-10" />

      <div
        className={`mx-auto w-full max-w-6xl px-4 pb-8 pt-24 sm:px-6 sm:pb-11 ${
          align === "center" ? "text-center" : ""
        }`}
      >
        {eyebrow && (
          <p className="mb-2.5 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-sun-300">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-extrabold leading-[1.15] text-white drop-shadow-[0_2px_12px_rgba(4,24,47,0.5)] sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p
            className={`mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base ${
              align === "center" ? "mx-auto" : ""
            }`}
          >
            {subtitle}
          </p>
        )}

        {facts && facts.length > 0 && (
          <div
            className={`mt-6 flex flex-wrap gap-x-8 gap-y-4 ${
              align === "center" ? "justify-center" : ""
            }`}
          >
            {facts.map((f) => (
              <div key={f.label}>
                <p className="font-display text-2xl font-extrabold leading-none text-sun-400 sm:text-3xl">
                  {f.value}
                </p>
                <p className="mt-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-white/55">
                  {f.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
