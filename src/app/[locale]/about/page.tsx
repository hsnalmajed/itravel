import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import LegalPage from "@/components/LegalPage";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);
  return pageMetadata({
    locale: loc,
    path: "/about",
    title: dict.legal.aboutTitle,
    description: dict.legal.aboutLead,
  });
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);
  const t = dict.legal;

  return (
    <LegalPage
      locale={loc}
      title={t.aboutTitle}
      lead={t.aboutLead}
      sections={[
        { heading: t.aboutWhatTitle, body: t.aboutWhatBody },
        // How the money works goes high, not in the small print. On a
        // comparison site the honest answer to "what's in it for you" is the
        // reason to believe the ordering of the results.
        { heading: t.aboutMoneyTitle, body: t.aboutMoneyBody },
        { heading: t.aboutSourcesTitle, body: t.aboutSourcesBody },
        { heading: t.aboutLimitsTitle, body: t.aboutLimitsBody },
      ]}
    />
  );
}
