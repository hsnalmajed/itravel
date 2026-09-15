// The photographs the homepage opens on.
//
// A travel site's first screen is its promise, so these are chosen against a
// short, strict brief rather than picked for being pretty:
//
//   · somewhere else. Seven places on five continents, because the site's
//     whole proposition is "tell us your budget and we'll tell you where" —
//     opening on one country every day would narrow that to one answer.
//   · no people in the frame. A hero with a stranger in it is a photograph of
//     that stranger, and it dates the moment they do.
//   · alive. Turquoise water, a lit ridge, a sky doing something. A correct
//     but grey landscape makes a site feel like a brochure nobody opened.
//   · sharp enough for a 4K display — every one of these is at least 5,500
//     pixels wide at source, and the page serves the 4K rendering to screens
//     that can use it.
//
// Every one is a Wikimedia Commons *featured picture* or of that standard,
// which means it has already been reviewed by people who care about focus,
// exposure and artefacts far more than a stock-photo buyer does. They are
// also freely licensed, and each one names its photographer on the page —
// that is the condition these licences carry.
//
// The hero rotates by date. That is deliberate over a random pick per view:
// the page is cached, a random choice would be frozen by the cache anyway,
// and a hero that changes overnight gives a returning visitor something new
// without anything flickering while they read.

export interface HeroPhoto {
  /** Exact file name on Wikimedia Commons. */
  file: string;
  /** Where it is, for the credit line. */
  placeAr: string;
  placeEn: string;
}

export const HERO_PHOTOS: HeroPhoto[] = [
  {
    file: "Matterhorn reflection in the Riffelsee at sunrise.jpg",
    placeAr: "جبل الماترهورن، سويسرا",
    placeEn: "The Matterhorn, Switzerland",
  },
  {
    file: "1 lake louise pano 2019.jpg",
    placeAr: "بحيرة لويز، كندا",
    placeEn: "Lake Louise, Canada",
  },
  {
    file: "Чинки плато Устюрт. Урочище Бозжыра.jpg",
    placeAr: "وادي بوزجيرا، كازاخستان",
    placeEn: "Bozzhyra, Kazakhstan",
  },
  {
    file: "Cirrus front over Austnesfjorden, Austvågøya, Lofoten, Norway, 2015 April.jpg",
    placeAr: "جزر لوفوتن، النرويج",
    placeEn: "Lofoten, Norway",
  },
  {
    file: "Teide von Nordosten (Zuschnitt 1).jpg",
    placeAr: "بركان تيدي، جزر الكناري",
    placeEn: "Mount Teide, Canary Islands",
  },
  {
    file: "Golden Hour at Emerald Bay.jpg",
    placeAr: "خليج إميرالد، الولايات المتحدة",
    placeEn: "Emerald Bay, United States",
  },
  {
    file: "Amanecer en el lago Titicaca, Puno, Perú, 2015-08-01, DD 01.JPG",
    placeAr: "بحيرة تيتيكاكا، بيرو",
    placeEn: "Lake Titicaca, Peru",
  },
];

/**
 * Today's photograph.
 *
 * Keyed on the date in UTC so every visitor sees the same one on the same
 * day, whatever their timezone and whatever edge cached the page.
 */
export function heroPhotoForToday(date = new Date()): HeroPhoto {
  const daysSinceEpoch = Math.floor(date.getTime() / 86_400_000);
  return HERO_PHOTOS[daysSinceEpoch % HERO_PHOTOS.length];
}

/**
 * A resolved hero, shaped to spread straight into <PageHero>.
 *
 * Declared here rather than beside the lookup that fills it because client
 * components need the type and must not pull in the lookup: sectionHero.ts
 * reaches out to Wikimedia, and importing it from a component would drag that
 * into the browser bundle.
 */
export interface SectionHero {
  photo?: string;
  photoSrcSet?: string;
  photoCredit?: { text: string; href: string };
}

/** The pages that open on a photograph of their own. */
export type HeroSection =
  | "attractions"
  | "maps"
  | "seasons"
  | "visa"
  | "currency"
  | "itinerary";

/**
 * One photograph per section, and never the same one twice.
 *
 * The inner pages used to borrow whichever country photo happened to be first
 * in their own list. That gave four of them the same picture on the same day,
 * and all of them a 330-pixel thumbnail — a size meant for a card in a grid,
 * stretched across a full-width banner, which is why they looked soft. These
 * are chosen files at full resolution instead.
 *
 * They are held to the same brief as the homepage rotation above — somewhere
 * else, nobody in the frame, alive, and at least 5,500 pixels wide at source —
 * with one more condition on top: each has to argue for the page it opens.
 * A page about *when* to travel opens on a season you can see; a page about
 * routes opens on a road; a page about maps opens on the view from the top of
 * the climb. The picture is the page's first sentence, so it should say the
 * same thing the heading does.
 */
export const SECTION_HEROES: Record<HeroSection, HeroPhoto> = {
  // Places worth going to see — water you can read the bottom of.
  attractions: {
    file: "Kuang Si Falls and its emerald water pools in Luang Prabang province Laos.jpg",
    placeAr: "شلالات كوانغ سي، لاوس",
    placeEn: "Kuang Si Falls, Laos",
  },
  // The view you get for having climbed — which is what a map is for.
  maps: {
    file: "Moro Rock Trail Sequoia July 2017 panorama.jpg",
    placeAr: "صخرة مورو، الولايات المتحدة",
    placeEn: "Moro Rock, United States",
  },
  // A month you can see. Autumn reading as autumn is the whole argument of a
  // page that answers "when".
  seasons: {
    file: "TR Yedigöller asv2021-10 img16.jpg",
    placeAr: "بحيرات يدي غولر، تركيا",
    placeEn: "Yedigöller, Türkiye",
  },
  // A border you can see: the far side of a high pass.
  visa: {
    file: "Massis del Casamanya (2).jpg",
    placeAr: "قمة كازامانيا، أندورا",
    placeEn: "Casamanya, Andorra",
  },
  // Somewhere your money is a different number — and quiet enough to think
  // about it in.
  currency: {
    file: "Búlandshöfði, Vesturland, Islandia, 2014-08-14, DD 085.JPG",
    placeAr: "بولاندسهوفدي، آيسلندا",
    placeEn: "Búlandshöfði, Iceland",
  },
  // A road that goes somewhere, bend by bend. A plan drawn in landscape.
  itinerary: {
    file: "Trollstigen HochPanno.jpg",
    placeAr: "طريق ترولستيجن، النرويج",
    placeEn: "Trollstigen, Norway",
  },
};
