import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";

const PARTNER_NAMES = ["Booking.com", "Almosafer", "Wego", "Skyscanner", "flynas", "flyadeal"];

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();

  const navLinks = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/attractions`, label: dict.nav.attractions },
    { href: `/${locale}/itinerary`, label: dict.nav.itinerary },
  ];

  return (
    <footer className="mt-16 bg-gradient-to-b from-brand-950 to-[#050e1c]">
      <div className="h-[3px] bg-gradient-to-r from-brand-700 via-accent-500 to-brand-700" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 text-sm text-white/60">
        <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_0.8fr_1fr] gap-10 pb-8 border-b border-white/10">
          <div className="max-w-md space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm">
                <Image src="/logo-icon.png" alt={dict.siteName} width={26} height={22} className="h-full w-full object-contain" />
              </span>
              {dict.siteName}
            </div>
            <p className="leading-relaxed text-white/50">{dict.footer.disclaimer}</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">{dict.footer.linksHeading}</p>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/60 transition hover:text-accent-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">{dict.footer.partnersHeading}</p>
            <div className="flex flex-wrap gap-1.5">
              {PARTNER_NAMES.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-white/60 ring-1 ring-white/10"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
        <p className="pt-6 text-white/40">
          © {year} {dict.siteName} — {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
