import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-sky shadow-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2 text-white font-bold text-xl">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
            <Image src="/logo-icon.png" alt={dict.siteName} width={36} height={30} className="h-full w-full object-contain" priority />
          </span>
          {dict.siteName}
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-white/90 text-sm font-medium">
          <Link href={`/${locale}`} className="hover:text-white transition">
            {dict.nav.home}
          </Link>
          <Link href={`/${locale}/itinerary`} className="hover:text-white transition">
            {dict.nav.itinerary}
          </Link>
        </nav>
        <LanguageSwitcher locale={locale} />
      </div>
    </header>
  );
}
