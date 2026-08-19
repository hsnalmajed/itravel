// A curated set of popular destinations for Saudi/Gulf travelers, used by the
// "discover a destination within my budget" search mode. Each entry has a
// real IATA city/airport code so it plugs directly into searchFlights/searchHotels.
export interface Destination {
  code: string;
  nameAr: string;
  nameEn: string;
  emoji: string;
}

export const DESTINATIONS: Destination[] = [
  { code: "IST", nameAr: "إسطنبول", nameEn: "Istanbul", emoji: "🕌" },
  { code: "DXB", nameAr: "دبي", nameEn: "Dubai", emoji: "🏙️" },
  { code: "CAI", nameAr: "القاهرة", nameEn: "Cairo", emoji: "🐫" },
  { code: "DOH", nameAr: "الدوحة", nameEn: "Doha", emoji: "🏗️" },
  { code: "KWI", nameAr: "الكويت", nameEn: "Kuwait City", emoji: "🌆" },
  { code: "BAH", nameAr: "المنامة", nameEn: "Manama", emoji: "🌉" },
  { code: "MCT", nameAr: "مسقط", nameEn: "Muscat", emoji: "⛵" },
  { code: "KUL", nameAr: "كوالالمبور", nameEn: "Kuala Lumpur", emoji: "🌴" },
  { code: "BKK", nameAr: "بانكوك", nameEn: "Bangkok", emoji: "🛕" },
  { code: "LON", nameAr: "لندن", nameEn: "London", emoji: "🇬🇧" },
  { code: "PAR", nameAr: "باريس", nameEn: "Paris", emoji: "🗼" },
  { code: "BCN", nameAr: "برشلونة", nameEn: "Barcelona", emoji: "⚽" },
  { code: "GYD", nameAr: "باكو", nameEn: "Baku", emoji: "🔥" },
  { code: "TBS", nameAr: "تبليسي", nameEn: "Tbilisi", emoji: "⛰️" },
];
