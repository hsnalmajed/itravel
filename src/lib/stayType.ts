// What kind of place the party is sleeping in.
//
// The search forms used to offer six choices — single, twin, double, triple,
// suite, apartment — which is the vocabulary a hotel's revenue manager uses,
// not the one a traveller does. Someone booking for five people does not want
// to work out whether that is "triple" or "suite"; they want to know whether
// they are getting a room or an apartment.
//
// So the question the customer answers is the short one, and the party size
// answers the rest. Four people fit in a family room; six do not, and there is
// no honest way to show them one. When the party is too big for a room the
// choice collapses to an apartment on its own and the form says why, rather
// than letting someone pick something that cannot be booked.
//
// The concrete RoomType is still what leaves in the URL, because that is what
// the hotel API and the offer data speak. This module is the translation.

import type { RoomType, TravelerCounts } from "@/lib/types";

export type StayType = "room" | "apartment";

/**
 * The most people one hotel room is normally sold for.
 *
 * Four is the practical ceiling almost everywhere: two adults and two
 * children in a family room. Past that, properties sell two rooms or an
 * apartment, so offering "a room" for five would be offering something that
 * does not exist.
 */
export const MAX_GUESTS_PER_ROOM = 4;

/**
 * How many people the room has to sleep.
 *
 * Infants are left out on purpose — they share a bed with a parent and hotels
 * do not count them against occupancy, so counting them here would push a
 * family of two adults, two children and a baby into an apartment they never
 * needed.
 */
export function occupancy(travelers: TravelerCounts): number {
  return travelers.adults + (travelers.childrenAges?.length ?? 0);
}

/** Can this party actually be sold a single room? */
export function roomFitsParty(guests: number): boolean {
  return guests <= MAX_GUESTS_PER_ROOM;
}

/**
 * How many people each concrete room type sleeps.
 *
 * The inverse of resolveRoomType, and the thing that was missing: the form
 * knew a party of five needs an apartment, but nothing downstream ever
 * checked that the room in an offer could hold the people in the search. A
 * traveller searching for two adults was shown "single · one bed".
 *
 * These are deliberately the conservative numbers a hotel would honour, not
 * the most a bed could physically take.
 */
export function roomCapacity(roomType: string | null | undefined): number {
  switch (roomType) {
    case "single":
      return 1;
    case "twin":
    case "double":
      return 2;
    case "triple":
      return 3;
    case "suite":
      return 4;
    case "apartment":
      return 6;
    default:
      // No stated room type constrains nothing — an unknown room is not a
      // reason to hide an offer.
      return Number.POSITIVE_INFINITY;
  }
}

/**
 * The concrete room type to search for.
 *
 * "" means the traveller expressed no preference and the search should not
 * narrow on it at all — which is different from picking a room and getting the
 * smallest one.
 */
export function resolveRoomType(stay: StayType | "", guests: number): RoomType | "" {
  if (stay === "apartment") return "apartment";
  if (stay !== "room") return "";
  if (guests <= 1) return "single";
  if (guests === 2) return "double";
  // Three and four both mean a family-sized room; the industry word for it is
  // "triple" even when the fourth bed is a sofa bed.
  return "triple";
}

/**
 * Read a stay type back out of a concrete room type.
 *
 * Needed because "edit search" round-trips through the URL: the form sent a
 * RoomType, and when the traveller comes back to change something the two
 * buttons have to show what they chose last time.
 */
export function stayTypeFromRoomType(roomType: string | null | undefined): StayType | "" {
  if (!roomType) return "";
  return roomType === "apartment" ? "apartment" : "room";
}
