import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import Logo from "@/components/ui/Logo";

const PARTNER_NAMES = ["Booking.com", "Almosafer", "Wego", "Skyscanner", "flynas", "flyadeal"];

/**
 * The footer closes the page the way the hero opened it — navy, an orange
 * rule, display type — so a visitor who scrolls the whole way lands
 * somewhere that clearly belongs to the same site.
 *
 * The disclaimer is given real weight rather than being buried in grey. On a
 * metasearch site the honest line ("we compare, they book") is not fine
 * print; it is the reason to trust the prices above it.
 */
export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();

  const explore = [
    { href: `/${locale}/attractions`, label: dict.nav.attractions },
    { href: `/${locale}/maps`, label: dict.nav.maps },
    { href: `/${locale}/seasons`, label: dict.nav.seasons },
  ];
  const tools = [
    { href: `/${locale}/itinerary`, label: dict.nav.itinerary },
    { href: `/${locale}/visa`, label: dict.nav.visa },
    { href: `/${locale}/currency`, label: dict.nav.currency },
  ];

  return (
    <footer className="mt-20 bg-navy-990">
      <div className="h-px bg-gradient-to-r from-transparent via-sun-400/60 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-14 text-sm sm:px-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 border-b border-white/10 pb-10 sm:grid-cols-[1.5fr_0.7fr_0.7fr_1fr]">
          <div className="col-span-2 max-w-sm space-y-4 sm:col-span-1">
            <span className="inline-flex rounded-xl bg-white px-3 py-2 shadow-sm">
              <Logo variant="full" alt={dict.siteName} className="h-11 w-auto" />
            </span>
            <p className="leading-relaxed text-white/45">{dict.footer.disclaimer}</p>
          </div>

          <div>
            <p className="mb-3.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sun-400/85">
              {dict.footer.exploreHeading}
            </p>
            <ul className="space-y-2.5">
              {explore.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/60 transition hover:text-sun-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sun-400/85">
              {dict.footer.toolsHeading}
            </p>
            <ul className="space-y-2.5">
              {tools.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/60 transition hover:text-sun-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sun-400/85">
              {dict.footer.partnersHeading}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PARTNER_NAMES.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.72rem] font-medium text-white/55 ring-1 ring-white/10"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-7 text-white/35">
          <p>
            © {year} {dict.siteName} — {dict.footer.rights}
          </p>
          <p className="font-display font-bold text-sun-400/70">{dict.slogan}</p>
        </div>
      </div>
    </footer>
  );
}
