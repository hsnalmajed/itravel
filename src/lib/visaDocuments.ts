// What to actually put in the folder before you apply.
//
// Direct's country pages carry a documents list, and that list is the most
// useful thing on them — so this site needs one too. What it must not be is
// a copy of theirs: their checklists are their own commercial work, and
// republishing them here would be taking someone else's content.
//
// So these are written from the published, stable rules instead. The Schengen
// set comes from the EU Visa Code, which fixes it across all 29 member states
// — the same passport validity, the same €30,000 insurance minimum, the same
// photo spec, whichever consulate you go to. The other four sets are the
// ordinary shape of their category.
//
// And they are framed as *typical*, never as the list. Consulates add their
// own requirements, change them, and ask for more from some applicants than
// others. The only list that governs is the one the embassy publishes, and
// every page that shows these links straight to it. A checklist that reads as
// definitive when it isn't would send someone to an appointment missing a
// document — which costs them the appointment and often the trip.

import type { VisaCategory } from "@/lib/visa";

export interface DocumentItem {
  titleAr: string;
  titleEn: string;
  detailAr?: string;
  detailEn?: string;
}

/**
 * The 29 states applying the Schengen Visa Code.
 *
 * Listed explicitly rather than inferred from "is in Europe": Ireland runs
 * its own visa, and Bulgaria, Romania, Croatia and Switzerland are in
 * Schengen while sitting outside other European groupings people confuse it
 * with. Getting this set wrong would hand someone the wrong checklist.
 */
export const SCHENGEN_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IS", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT",
  "RO", "SK", "SI", "ES", "SE", "CH",
]);

const SCHENGEN_DOCUMENTS: DocumentItem[] = [
  {
    titleAr: "جواز السفر الأصلي",
    titleEn: "Original passport",
    detailAr: "ساري لمدة 3 أشهر على الأقل بعد تاريخ العودة، وفيه صفحتان فارغتان، وصادر خلال آخر 10 سنوات.",
    detailEn: "Valid for at least 3 months beyond your return date, with two blank pages, issued within the last 10 years.",
  },
  {
    titleAr: "صورتان شخصيتان",
    titleEn: "Two passport photos",
    detailAr: "مقاس 3.5 × 4.5 سم، خلفية بيضاء، حديثتان (خلال 6 أشهر)، الوجه واضح بدون نظارة.",
    detailEn: "35 × 45 mm, white background, taken within the last 6 months, face clear and unobstructed.",
  },
  {
    titleAr: "تأمين طبي للسفر",
    titleEn: "Travel medical insurance",
    detailAr: "تغطية لا تقل عن 30,000 يورو داخل دول شنغن، وتشمل الإعادة الطبية للوطن. هذا شرط نظامي موحّد.",
    detailEn: "Minimum €30,000 of cover valid across the Schengen area, including medical repatriation. This is a fixed legal requirement.",
  },
  {
    titleAr: "إثبات السكن",
    titleEn: "Proof of accommodation",
    detailAr: "حجز فندقي مؤكد يغطي كامل مدة الإقامة، أو دعوة موثّقة من مُضيف.",
    detailEn: "Confirmed hotel booking covering the whole stay, or a certified invitation from a host.",
  },
  {
    titleAr: "حجز تذاكر الطيران ذهاباً وعودة",
    titleEn: "Return flight reservation",
    detailAr: "حجز مبدئي يكفي عادة — لا يُنصح بشراء التذكرة قبل صدور التأشيرة.",
    detailEn: "A reservation is usually enough — buying the ticket before the visa is issued is not advisable.",
  },
  {
    titleAr: "كشف حساب بنكي",
    titleEn: "Bank statement",
    detailAr: "آخر 3 إلى 6 أشهر، مختوم من البنك، يوضّح رصيداً يكفي مدة الرحلة.",
    detailEn: "The last 3–6 months, stamped by the bank, showing funds sufficient for the trip.",
  },
  {
    titleAr: "تعريف بالراتب أو إثبات العمل",
    titleEn: "Employment or salary letter",
    detailAr: "مختوم من جهة العمل. للطلاب: خطاب من الجهة التعليمية. لأصحاب الأعمال: السجل التجاري.",
    detailEn: "Stamped by your employer. Students: a letter from their institution. Business owners: their commercial registration.",
  },
  {
    titleAr: "نموذج الطلب والرسوم والبصمة",
    titleEn: "Application form, fee and biometrics",
    detailAr: "يُعبّأ النموذج ويُحجز موعد لإعطاء البصمة في مركز التأشيرات، وتُدفع الرسوم عند الموعد.",
    detailEn: "Complete the form, book a biometrics appointment at the visa centre, and pay the fee at the appointment.",
  },
];

const EMBASSY_DOCUMENTS: DocumentItem[] = [
  {
    titleAr: "جواز السفر الأصلي",
    titleEn: "Original passport",
    detailAr: "ساري 6 أشهر على الأقل من تاريخ السفر، وفيه صفحات فارغة للختم.",
    detailEn: "Valid at least 6 months from your travel date, with blank pages for stamps.",
  },
  {
    titleAr: "صور شخصية حديثة",
    titleEn: "Recent passport photos",
    detailAr: "المقاس والخلفية يختلفان من دولة لأخرى — راجع مواصفات السفارة قبل التصوير.",
    detailEn: "Size and background vary by country — check the embassy's spec before having them taken.",
  },
  {
    titleAr: "نموذج طلب التأشيرة",
    titleEn: "Visa application form",
    detailAr: "يُعبّأ من موقع السفارة أو مركز التأشيرات المعتمد.",
    detailEn: "Completed on the embassy's site or at its authorised visa centre.",
  },
  {
    titleAr: "إثبات السكن وتذاكر الطيران",
    titleEn: "Accommodation and flights",
    detailAr: "حجز فندقي وحجز طيران ذهاباً وعودة يغطيان مدة الزيارة.",
    detailEn: "Hotel and return flight reservations covering the visit.",
  },
  {
    titleAr: "إثبات القدرة المالية",
    titleEn: "Proof of funds",
    detailAr: "كشف حساب بنكي مختوم، وتعريف بالراتب من جهة العمل.",
    detailEn: "A stamped bank statement and a salary letter from your employer.",
  },
];

const EVISA_DOCUMENTS: DocumentItem[] = [
  {
    titleAr: "جواز سفر ساري",
    titleEn: "Valid passport",
    detailAr: "6 أشهر على الأقل من تاريخ الدخول. تحتاج رقم الجواز وتاريخي الإصدار والانتهاء أثناء التعبئة.",
    detailEn: "At least 6 months from your entry date. You'll need the number and both dates while filling the form.",
  },
  {
    titleAr: "صورة رقمية من الجواز وصورة شخصية",
    titleEn: "Digital passport scan and photo",
    detailAr: "بصيغة JPG أو PDF غالباً، بحجم محدّد في الموقع.",
    detailEn: "Usually JPG or PDF, within the size limit the portal states.",
  },
  {
    titleAr: "بطاقة ائتمان وبريد إلكتروني",
    titleEn: "Payment card and email",
    detailAr: "الرسوم تُدفع إلكترونياً، والموافقة تصل على البريد — تأكّد من صحته.",
    detailEn: "The fee is paid online and the approval arrives by email — make sure the address is right.",
  },
  {
    titleAr: "تفاصيل الرحلة",
    titleEn: "Trip details",
    detailAr: "تاريخ الوصول وعنوان الإقامة، وأحياناً رقم رحلة الطيران.",
    detailEn: "Arrival date and your accommodation address, sometimes the flight number.",
  },
  {
    titleAr: "اطبع الموافقة قبل السفر",
    titleEn: "Print the approval before travelling",
    detailAr: "كثير من شركات الطيران تطلب نسخة مطبوعة عند إنهاء إجراءات السفر.",
    detailEn: "Many airlines ask for a printed copy at check-in.",
  },
];

const ON_ARRIVAL_DOCUMENTS: DocumentItem[] = [
  {
    titleAr: "جواز سفر ساري",
    titleEn: "Valid passport",
    detailAr: "6 أشهر على الأقل من تاريخ الوصول عادةً.",
    detailEn: "Usually at least 6 months from your arrival date.",
  },
  {
    titleAr: "رسوم التأشيرة نقداً",
    titleEn: "The visa fee in cash",
    detailAr: "كثير من المنافذ لا تقبل البطاقات — احمل المبلغ بعملة مقبولة (الدولار أو اليورو غالباً).",
    detailEn: "Many border posts don't take cards — carry the amount in an accepted currency, usually dollars or euros.",
  },
  {
    titleAr: "تذكرة العودة وعنوان السكن",
    titleEn: "Return ticket and accommodation address",
    detailAr: "يُطلبان كثيراً عند المنفذ، وأحياناً قبل الصعود للطائرة.",
    detailEn: "Often asked for at the border, and sometimes before boarding.",
  },
  {
    titleAr: "صور شخصية احتياطية",
    titleEn: "Spare passport photos",
    detailAr: "بعض المنافذ تطلب صورة مع النموذج — صورتان في المحفظة تختصران وقتاً.",
    detailEn: "Some posts want a photo with the form — two in your wallet saves time.",
  },
];

const VISA_FREE_DOCUMENTS: DocumentItem[] = [
  {
    titleAr: "جواز سفر ساري",
    titleEn: "Valid passport",
    detailAr: "6 أشهر على الأقل من تاريخ الدخول — وهو الشرط الذي يُرفض بسببه أكثر المسافرين رغم عدم حاجتهم لتأشيرة.",
    detailEn: "At least 6 months from entry — the requirement that turns away more visa-free travellers than any other.",
  },
  {
    titleAr: "تذكرة عودة أو مغادرة",
    titleEn: "Onward or return ticket",
    detailAr: "شركة الطيران قد تطلبها قبل الصعود، وضابط الجوازات قد يطلبها عند الوصول.",
    detailEn: "The airline may ask before boarding, and the border officer may ask on arrival.",
  },
  {
    titleAr: "عنوان الإقامة",
    titleEn: "Accommodation address",
    detailAr: "احتفظ بحجز الفندق على جوالك — يُسأل عنه في بطاقة الوصول عادةً.",
    detailEn: "Keep the hotel booking on your phone — the arrival card usually asks for it.",
  },
  {
    titleAr: "إثبات مالي بسيط",
    titleEn: "Some proof of funds",
    detailAr: "بطاقة بنكية أو مبلغ نقدي يكفي مدة الزيارة. الإعفاء من التأشيرة لا يمنع ضابط الجوازات من السؤال.",
    detailEn: "A bank card or enough cash for the visit. Visa-free entry doesn't stop an officer asking.",
  },
];

/**
 * The checklist that fits this destination.
 *
 * Schengen is checked before the category, because a Schengen application is
 * a specific legal procedure — the insurance minimum and the passport rule
 * are set in law — and lumping it under "visa required" would lose exactly
 * the details that get applications rejected.
 */
export function documentsFor(countryCode: string, category: VisaCategory): DocumentItem[] {
  if (SCHENGEN_COUNTRIES.has(countryCode) && (category === "required" || category === "eta")) {
    return SCHENGEN_DOCUMENTS;
  }
  switch (category) {
    case "required":
      return EMBASSY_DOCUMENTS;
    case "eta":
      return EVISA_DOCUMENTS;
    case "arrival":
      return ON_ARRIVAL_DOCUMENTS;
    case "free":
      return VISA_FREE_DOCUMENTS;
    default:
      return VISA_FREE_DOCUMENTS;
  }
}

export function isSchengen(countryCode: string): boolean {
  return SCHENGEN_COUNTRIES.has(countryCode);
}
