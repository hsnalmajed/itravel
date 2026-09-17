import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";
import LegalPage from "@/components/LegalPage";
import { pageMetadata } from "@/lib/seo";

/**
 * The address people write to.
 *
 * Deliberately an environment variable with no default. Publishing a
 * personal inbox on a public page is the owner's decision to make, not
 * this file's — so until NEXT_PUBLIC_CONTACT_EMAIL is set the page says
 * plainly that contact isn't open yet rather than printing an address
 * nobody chose to publish.
 */
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);
  return pageMetadata({
    locale: loc,
    path: "/contact",
    title: dict.legal.contactTitle,
    description: dict.legal.contactLead,
  });
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  const loc = (locale === "en" ? "en" : "ar") as Locale;
  const dict = getDictionary(loc);
  const t = dict.legal;

  return (
    <LegalPage locale={loc} title={t.contactTitle} lead={t.contactLead} sections={[]}>
      {CONTACT_EMAIL ? (
        <div className="card mb-8 px-5 py-5">
          <p className="eyebrow mb-2">{t.contactEmailLabel}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            dir="ltr"
            className="font-display text-h3 font-extrabold text-navy-900 underline decoration-sun-400 decoration-2 underline-offset-4 transition hover:text-sun-700"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="mt-3 text-sm text-navy-500">{t.contactResponse}</p>
        </div>
      ) : (
        <div className="card mb-8 px-5 py-6">
          <p className="text-sm text-navy-600">{t.contactSoon}</p>
        </div>
      )}
    </LegalPage>
  );
}
