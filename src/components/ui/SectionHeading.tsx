/**
 * A section heading with the sunset-orange hairline under it.
 *
 * The hairline is the cheapest possible piece of brand: it costs three
 * pixels, appears above every meaningful block on every page, and is the
 * reason the visa page and the maps page look like they were made by the
 * same hand. It is the same orange as the sun in the logo.
 */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "start",
  tone = "dark",
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
  tone?: "dark" | "light";
  action?: React.ReactNode;
}) {
  const centered = align === "center";
  const onDark = tone === "light";

  return (
    <div
      className={`mb-6 flex flex-col gap-4 sm:mb-8 ${
        centered ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"
      }`}
    >
      <div className={centered ? "" : "min-w-0"}>
        {eyebrow && (
          <p
            className={`mb-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] ${
              onDark ? "text-sun-300" : "text-sun-700"
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={`rule-sun ${centered ? "rule-sun-center" : ""} font-display text-2xl font-extrabold leading-tight sm:text-3xl ${
            onDark ? "text-white" : "text-navy-900"
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={`mt-3 max-w-2xl text-sm leading-relaxed sm:text-[0.95rem] ${
              onDark ? "text-white/65" : "text-navy-600"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
