// Turning a section name into a hero a page can render.
//
// Every inner page wants the same three things from its photograph — the URL
// to show, a 4K rendering for the screens that can use one, and the credit
// line the licence requires — and none of them wants to know that any of that
// came from Wikimedia. So the lookup lives here and each page asks for its
// picture by the name of the page.
//
// The return type is deliberately shaped to spread straight into PageHero.

import { fetchCommonsImage } from "@/lib/commonsImage";
import { SECTION_HEROES, type HeroSection, type SectionHero } from "@/lib/heroPhotos";
import { getDictionary } from "@/lib/dictionaries";
import type { Locale } from "@/lib/types";

/**
 * The hero for one section, ready to hand to PageHero.
 *
 * Returns an empty object rather than throwing when Commons can't be reached:
 * a page with no background still reads perfectly — PageHero falls back to its
 * navy gradient — and a travel site that 500s because a photograph was slow is
 * a worse outcome than a plain banner.
 */
export async function sectionHero(
  section: HeroSection,
  locale: Locale
): Promise<SectionHero> {
  const pick = SECTION_HEROES[section];
  const image = await fetchCommonsImage(pick.file);
  if (!image) return {};

  const dict = getDictionary(locale);

  return {
    photo: image.url,
    // Only offered when a genuinely larger rendering exists — see
    // commonsImage.ts for why an invented 3840w candidate makes things worse.
    photoSrcSet: image.url4k ? `${image.url} 1920w, ${image.url4k} 3840w` : undefined,
    photoCredit: {
      text: dict.hero.photoCredit
        .replace("{place}", locale === "ar" ? pick.placeAr : pick.placeEn)
        .replace("{artist}", image.artist ?? "Wikimedia Commons")
        .replace("{license}", image.license ?? ""),
      href: image.descriptionUrl,
    },
  };
}
