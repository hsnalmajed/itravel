/**
 * Roughly where each covered country sits, for placing a pin on a world map.
 *
 * These are **visual anchors, not data**. At the zoom where forty-odd
 * countries fit on one screen a pin is several hundred kilometres wide, so
 * being a degree out is invisible — and nothing on the site reads a distance,
 * a route or a bearing from these numbers. They exist so the maps index can
 * open on a map instead of a list.
 *
 * Deliberately a static table. The alternative was resolving each country's
 * position from Wikipedia at request time, which is forty-one extra
 * subrequests on a Cloudflare Worker — the exact budget that has silently
 * broken this site twice before.
 *
 * A country with no entry here simply gets no pin; it still appears in the
 * grid underneath. That is the right failure: a missing pin is a smaller
 * problem than a pin in the wrong sea.
 */
export const COUNTRY_CENTROIDS: Record<string, { lat: number; lon: number }> = {
  // Middle East & Gulf
  SA: { lat: 24.0, lon: 45.0 },
  AE: { lat: 24.0, lon: 54.0 },
  QA: { lat: 25.3, lon: 51.2 },
  KW: { lat: 29.3, lon: 47.5 },
  BH: { lat: 26.0, lon: 50.5 },
  OM: { lat: 21.0, lon: 57.0 },
  JO: { lat: 31.2, lon: 36.5 },
  LB: { lat: 33.9, lon: 35.9 },
  TR: { lat: 39.0, lon: 35.0 },

  // Asia
  AZ: { lat: 40.4, lon: 47.6 },
  GE: { lat: 42.3, lon: 43.4 },
  IN: { lat: 22.0, lon: 79.0 },
  LK: { lat: 7.9, lon: 80.8 },
  MV: { lat: 3.2, lon: 73.2 },
  TH: { lat: 15.0, lon: 101.0 },
  MY: { lat: 4.2, lon: 102.0 },
  SG: { lat: 1.35, lon: 103.8 },
  ID: { lat: -2.5, lon: 118.0 },
  VN: { lat: 16.0, lon: 106.0 },
  CN: { lat: 35.0, lon: 104.0 },
  JP: { lat: 36.2, lon: 138.2 },
  KR: { lat: 36.5, lon: 127.8 },

  // Africa
  EG: { lat: 26.8, lon: 30.8 },
  MA: { lat: 31.8, lon: -6.5 },
  TN: { lat: 34.0, lon: 9.5 },
  KE: { lat: 0.2, lon: 37.9 },
  ZA: { lat: -29.0, lon: 24.7 },

  // Europe
  GB: { lat: 54.0, lon: -2.5 },
  FR: { lat: 46.6, lon: 2.4 },
  ES: { lat: 40.2, lon: -3.7 },
  PT: { lat: 39.5, lon: -8.0 },
  IT: { lat: 42.8, lon: 12.6 },
  GR: { lat: 39.0, lon: 22.0 },
  DE: { lat: 51.2, lon: 10.4 },
  NL: { lat: 52.2, lon: 5.3 },
  AT: { lat: 47.6, lon: 14.1 },
  CH: { lat: 46.8, lon: 8.2 },

  // Americas & Oceania
  US: { lat: 39.8, lon: -98.6 },
  MX: { lat: 23.6, lon: -102.5 },
  BR: { lat: -14.2, lon: -51.9 },
  AU: { lat: -25.3, lon: 133.8 },
};
