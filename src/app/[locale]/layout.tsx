import type { Metadata } from "next";
import "../globals.css";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export async function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export async function generateMetadata(
  { params }: LayoutProps<"/[locale]">
): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  return {
    title: `${dict.siteName} — ${dict.tagline}`,
    description: dict.tagline,
    icons: {
      icon: [
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: "/favicon-192.png",
      shortcut: "/favicon.ico",
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);

  return (
    <html lang={loc} dir={dict.dir} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f7f8fb] text-[#111827]">
        <Header locale={loc} />
        <main className="flex-1">{children}</main>
        <Footer locale={loc} />
      </body>
    </html>
  );
}
