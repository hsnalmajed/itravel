import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-sm text-gray-500 space-y-3">
        <p className="max-w-3xl leading-relaxed">{dict.footer.disclaimer}</p>
        <p>
          © {year} {dict.siteName} — {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
