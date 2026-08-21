"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/attractions`, label: dict.nav.attractions },
    { href: `/${locale}/maps`, label: dict.nav.maps },
    { href: `/${locale}/itinerary`, label: dict.nav.itinerary },
    { href: `/${locale}/currency`, label: dict.nav.currency },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.15)]">
      <div className="h-[3px] bg-gradient-to-r from-brand-700 via-accent-500 to-brand-700" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <Link href={`/${locale}`} className="flex items-center gap-2.5 text-brand-950 font-extrabold text-xl shrink-0">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 p-1.5 ring-1 ring-brand-100 shadow-sm">
            <Image src="/logo-icon.png" alt={dict.siteName} width={36} height={30} className="h-full w-full object-contain" priority />
          </span>
          <span className="tracking-tight">{dict.siteName}</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 text-gray-600 text-sm font-semibold">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 transition hover:bg-brand-50 hover:text-brand-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher locale={locale} />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="menu"
            className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition"
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1 text-sm font-semibold text-gray-700">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 transition hover:bg-brand-50 hover:text-brand-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
