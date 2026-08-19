import Image from "next/image";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";

export default function Footer({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-sm text-gray-500 space-y-3">
        <div className="flex items-center gap-2 text-brand-navy font-bold">
          <Image src="/logo-icon.png" alt={dict.siteName} width={24} height={20} className="h-6 w-auto object-contain" />
          {dict.siteName}
        </div>
        <p className="max-w-3xl leading-relaxed">{dict.footer.disclaimer}</p>
        <p>
          © {year} {dict.siteName} — {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
