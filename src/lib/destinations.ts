import type { DestinationCategory } from "./types";

// A curated set of popular destinations for Saudi/Gulf travelers, used by the
// "discover a destination within my budget" search mode. Each entry has a
// real IATA city/airport code so it plugs directly into searchFlights/searchHotels,
// plus a loose taste taxonomy (categories) used to filter suggestions when the
// user tells us what kind of trip they're after.
export interface Destination {
  code: string;
  nameAr: string;
  nameEn: string;
  emoji: string;
  categories: DestinationCategory[];
}

export const DESTINATIONS: Destination[] = [
  { code: "IST", nameAr: "إسطنبول", nameEn: "Istanbul", emoji: "🕌", categories: ["culture", "city"] },
  { code: "DXB", nameAr: "دبي", nameEn: "Dubai", emoji: "🏙️", categories: ["city", "adventure", "beach", "family"] },
  { code: "CAI", nameAr: "القاهرة", nameEn: "Cairo", emoji: "🐫", categories: ["culture", "adventure"] },
  { code: "DOH", nameAr: "الدوحة", nameEn: "Doha", emoji: "🏗️", categories: ["city", "family", "beach"] },
  { code: "KWI", nameAr: "الكويت", nameEn: "Kuwait City", emoji: "🌆", categories: ["city"] },
  { code: "BAH", nameAr: "المنامة", nameEn: "Manama", emoji: "🌉", categories: ["city", "family", "beach"] },
  { code: "MCT", nameAr: "مسقط", nameEn: "Muscat", emoji: "⛵", categories: ["nature", "adventure"] },
  { code: "KUL", nameAr: "كوالالمبور", nameEn: "Kuala Lumpur", emoji: "🌴", categories: ["city", "nature", "family"] },
  { code: "BKK", nameAr: "بانكوك", nameEn: "Bangkok", emoji: "🛕", categories: ["city", "culture", "adventure"] },
  { code: "LON", nameAr: "لندن", nameEn: "London", emoji: "🇬🇧", categories: ["city", "culture"] },
  { code: "PAR", nameAr: "باريس", nameEn: "Paris", emoji: "🗼", categories: ["city", "culture", "family"] },
  { code: "BCN", nameAr: "برشلونة", nameEn: "Barcelona", emoji: "⚽", categories: ["beach", "city", "culture"] },
  { code: "GYD", nameAr: "باكو", nameEn: "Baku", emoji: "🔥", categories: ["nature", "city"] },
  { code: "TBS", nameAr: "تبليسي", nameEn: "Tbilisi", emoji: "⛰️", categories: ["nature", "culture"] },
];
