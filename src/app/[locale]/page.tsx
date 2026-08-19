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
            <circle cx="60" cy="55" r="2.4" fill="#8fda8b" />
            <circle cx="138" cy="72" r="2.4" fill="#8fda8b" />
            <circle cx="112" cy="138" r="2.4" fill="#8fda8b" />
            <circle cx="68" cy="122" r="1.8" fill="#8fda8b" opacity="0.75" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-accent-300 ring-1 ring-white/15 backdrop-blur-sm">
            ✈️ {dict.hero.badge}
          </span>
          <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {dict.hero.title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            {dict.hero.subtitle}
          </p>
        </div>
      </section>

      <section className="relative -mt-24 sm:-mt-28 px-4 sm:px-6 pb-16">
        <SearchModeSwitcher locale={loc} />
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20 grid grid-cols-1 sm:grid-cols-3 gap-6">
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
          <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 font-bold text-gray-900">{f.title}</h3>
            <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
