import Image from "next/image";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-brand-950">
      <div className="h-1 bg-gradient-to-r from-accent-500 via-brand-400 to-accent-500" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-sm text-white/60">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 pb-6 border-b border-white/10">
          <div className="max-w-md space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1">
                <Image src="/logo-icon.png" alt={dict.siteName} width={24} height={20} className="h-full w-full object-contain" />
              </span>
              {dict.siteName}
            </div>
            <p className="leading-relaxed text-white/50">{dict.footer.disclaimer}</p>
          </div>
        </div>
        <p className="pt-6 text-white/40">
          © {year} {dict.siteName} — {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
