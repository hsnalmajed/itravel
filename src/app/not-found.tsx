import Link from "next/link";
import "./globals.css";
import { getDictionary } from "@/lib/dictionaries";

/**
 * The 404 for a URL with no locale in it at all — /pricing, /admin, a stale
 * link from somewhere.
 *
 * Next renders the root not-found outside every locale layout, so there is no
 * header, no footer and no way to know which language the visitor reads. It
 * gets its own minimal document and offers both, rather than guessing and
 * being wrong half the time.
 */
export default function RootNotFound() {
  const ar = getDictionary("ar");
  const en = getDictionary("en");

  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="flex min-h-full items-center justify-center bg-navy-990 px-5 py-16">
        <main className="w-full max-w-md text-center">
          <p className="eyebrow eyebrow-light mb-3">404</p>
          <h1 className="font-display text-h2 font-extrabold text-white">{ar.notFound.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60" lang="en" dir="ltr">
            {en.notFound.title}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/ar"
              className="rounded-xl bg-sun-400 px-6 py-3.5 text-sm font-bold text-navy-950 transition hover:bg-sun-300"
            >
              {ar.notFound.home}
            </Link>
            <Link
              href="/en"
              lang="en"
              dir="ltr"
              className="rounded-xl bg-white/10 px-6 py-3.5 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              {en.notFound.home}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
