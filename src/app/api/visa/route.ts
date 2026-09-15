import { NextRequest, NextResponse } from "next/server";
import { findCountry } from "@/lib/countries";
import { fetchVisaRequirements, VISA_SOURCE_URL, type VisaCategory } from "@/lib/visa";
import { documentsFor, isSchengen } from "@/lib/visaDocuments";
import { directVisaUrl, officialVisaUrl } from "@/lib/visaProviders";

/**
 * Entry requirements for one destination, for pages that render on the client.
 *
 * The visa pages themselves are server components and call
 * `fetchVisaRequirements` directly. The results page can't: it is a client
 * component driven by query parameters, and the destination isn't known until
 * the search runs. Rather than turn that whole page into a server component
 * for one strip of information, it asks here.
 *
 * Everything this returns already exists on /visa/[code]; this is the same
 * answer in JSON, and the caller links through to that page for the full
 * version. When the source can't be read we return `available: false` rather
 * than an empty checklist, because "no documents listed" reads as "nothing
 * needed", which is the one wrong answer that costs someone a flight.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const code = (sp.get("code") || "").toUpperCase();
  const locale = sp.get("locale") === "en" ? "en" : "ar";

  const country = findCountry(code);
  if (!country) {
    return NextResponse.json({ error: "unknown_country" }, { status: 404 });
  }

  const data = await fetchVisaRequirements();
  const entry = data?.byCountry.get(country.code);
  const category: VisaCategory = entry?.category ?? "unknown";

  return NextResponse.json({
    available: Boolean(entry),
    code: country.code,
    name: locale === "ar" ? country.nameAr : country.nameEn,
    category,
    // Verbatim source wording — never paraphrased, per the note in visa.ts.
    status: entry?.status ?? "",
    stay: entry?.stay ?? "",
    schengen: isSchengen(country.code),
    documents: documentsFor(country.code, category).map((d) => ({
      title: locale === "ar" ? d.titleAr : d.titleEn,
      detail: locale === "ar" ? d.detailAr : d.detailEn,
    })),
    officialUrl: officialVisaUrl(country.code) ?? null,
    directUrl: directVisaUrl(country.code, locale) ?? null,
    sourceUrl: VISA_SOURCE_URL,
  });
}
