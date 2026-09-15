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
