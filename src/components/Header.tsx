import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 shadow-lg shadow-black/5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2.5 text-white font-bold text-xl">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-md ring-1 ring-black/5">
            <Image src="/logo-icon.png" alt={dict.siteName} width={36} height={30} className="h-full w-full object-contain" priority />
          </span>
          <span className="tracking-tight">{dict.siteName}</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-8 text-white/80 text-sm font-semibold">
          <Link href={`/${locale}`} className="relative py-1 transition hover:text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-accent-400 after:transition-transform hover:after:scale-x-100">
            {dict.nav.home}
          </Link>
          <Link href={`/${locale}/itinerary`} className="relative py-1 transition hover:text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-accent-400 after:transition-transform hover:after:scale-x-100">
            {dict.nav.itinerary}
          </Link>
        </nav>
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
