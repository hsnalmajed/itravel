import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import SearchModeSwitcher from "@/components/SearchModeSwitcher";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-blue to-brand-sky pt-14 pb-32 sm:pt-20 sm:pb-40">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_0%,white,transparent_30%)]" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center text-white">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {dict.hero.title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
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
