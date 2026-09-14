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
    title: `${dict.siteName} — ${dict.slogan}`,
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
      {/*
        No top padding on <main>. The header is fixed and transparent at rest,
        and every page opens on a hero that deliberately runs underneath it —
        padding here would put a band of background above every photograph and
        undo the whole effect. Each hero carries its own top padding instead.
      */}
      <body className="flex min-h-full flex-col bg-mist-50 text-navy-900">
        <Header locale={loc} />
        <main className="flex-1">{children}</main>
        <Footer locale={loc} />
      </body>
    </html>
  );
}
