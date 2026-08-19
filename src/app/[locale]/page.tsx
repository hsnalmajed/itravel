import { Suspense } from "react";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import SearchModeSwitcher from "@/components/SearchModeSwitcher";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 pt-16 pb-32 sm:pt-24 sm:pb-40">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_0%,theme(colors.accent.400),transparent_30%)]" />

        {/* Decorative wireframe globe — echoes the logo's globe mark */}
        <div
          className="pointer-events-none absolute left-1/2 top-[58%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 sm:top-[62%] sm:h-[820px] sm:w-[820px]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 200 200" fill="none" className="h-full w-full opacity-[0.16] sm:opacity-[0.18]">
            <circle cx="100" cy="100" r="95" stroke="white" strokeWidth="1" />
            <line x1="5" y1="100" x2="195" y2="100" stroke="white" strokeWidth="0.75" />
            <line x1="100" y1="5" x2="100" y2="195" stroke="white" strokeWidth="0.75" />
            <ellipse cx="100" cy="100" rx="78" ry="95" stroke="white" strokeWidth="0.75" />
            <ellipse cx="100" cy="100" rx="45" ry="95" stroke="white" strokeWidth="0.75" />
            <ellipse cx="100" cy="100" rx="95" ry="72" stroke="white" strokeWidth="0.75" />
            <ellipse cx="100" cy="100" rx="95" ry="40" stroke="white" strokeWidth="0.75" />
            <circle cx="60" cy="55" r="2.4" fill="#78cea8" />
            <circle cx="138" cy="72" r="2.4" fill="#78cea8" />
            <circle cx="112" cy="138" r="2.4" fill="#78cea8" />
            <circle cx="68" cy="122" r="1.8" fill="#78cea8" opacity="0.75" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-accent-300 ring-1 ring-white/15 backdrop-blur-sm">
            ✈️ {dict.hero.badge}
          </span>
          <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            {dict.hero.title}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
            {dict.hero.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-sm text-white/85">
            {[dict.hero.trust1, dict.hero.trust2, dict.hero.trust3].map((t) => (
              <span key={t} className="inline-flex items-center gap-2">
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-500/90 text-white text-[10px]">
                  ✓
                </span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative -mt-24 sm:-mt-28 px-4 sm:px-6 pb-16">
        <Suspense fallback={null}>
          <SearchModeSwitcher locale={loc} />
        </Suspense>
      </section>

      {/* How it works — three steps, connected by a line on larger screens,
          so the product reads as a guided flow rather than a bare form. */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-700">{dict.home.stepsEyebrow}</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">{dict.home.stepsTitle}</h2>
        </div>
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
          <div
            className="hidden sm:block absolute top-6 start-[16.5%] end-[16.5%] h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent"
            aria-hidden="true"
          />
          {[
            { n: 1, title: dict.home.step1Title, body: dict.home.step1Body },
            { n: 2, title: dict.home.step2Title, body: dict.home.step2Body },
            { n: 3, title: dict.home.step3Title, body: dict.home.step3Body },
          ].map((s) => (
            <div key={s.n} className="relative text-center sm:text-start">
              <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 text-white font-extrabold shadow-lg shadow-brand-900/20 ring-4 ring-brand-50">
                {s.n}
              </span>
              <h3 className="mt-4 font-bold text-gray-900">{s.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-700">{dict.home.featuresEyebrow}</span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">{dict.home.featuresTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "💰",
                title: loc === "ar" ? "حسب ميزانيتك بالضبط" : "Exactly your budget",
                body:
                  loc === "ar"
                    ? "أدخل ميزانيتك الإجمالية وسنطابق لك أفضل تركيبة طيران وفندق تقع ضمنها."
                    : "Enter your total budget and we match the best flight + hotel combo that fits.",
              },
              {
                icon: "🔎",
                title: loc === "ar" ? "مصادر موثوقة" : "Trusted sources",
                body:
                  loc === "ar"
                    ? "مقارنة عبر مصادر موثوقة محلياً ودولياً مثل Booking.com وWego وسكاي سكانر والمسافر وflynas."
                    : "Compare across trusted local & global sources like Booking.com, Wego, Skyscanner, Almosafer, and flynas.",
              },
              {
                icon: "🗺️",
                title: loc === "ar" ? "خطة سياحية بالذكاء الاصطناعي" : "AI-crafted itinerary",
                body:
                  loc === "ar"
                    ? "خطة يومية جاهزة حسب مدة رحلتك واهتماماتك، مبنية على الذكاء الاصطناعي ومصادر موثوقة."
                    : "A day-by-day plan based on your trip length and interests, powered by AI and trusted sources.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-brand-100"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-2xl ring-1 ring-accent-100 transition group-hover:bg-accent-100">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-bold text-gray-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
