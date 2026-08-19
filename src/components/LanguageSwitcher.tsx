"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/lib/types";

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (!pathname) return;
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/") || `/${next}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-white/10 p-1 text-sm">
      <button
        onClick={() => switchTo("ar")}
        className={`px-3 py-1 rounded-full transition ${
          locale === "ar" ? "bg-white text-teal-700 font-semibold" : "text-white/80 hover:text-white"
        }`}
      >
        عربي
      </button>
      <button
        onClick={() => switchTo("en")}
        className={`px-3 py-1 rounded-full transition ${
          locale === "en" ? "bg-white text-teal-700 font-semibold" : "text-white/80 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}
