// Sorts a discovered place into the pin it should wear on the map, using
// Wikipedia's own one-line description of it ("Mosque and former church in
// Istanbul, Turkey", "Restaurant in Istanbul, Turkey").
//
// This is a keyword match, not a taxonomy: it reads what Wikipedia already
// says a place is rather than us deciding. Anything it can't place
// confidently stays in the neutral `place` bucket instead of being pushed
// into a category it might not belong to.

export type PlaceCategory = "historic" | "food" | "activity" | "place";

// Order matters: a "museum café" is a café to a hungry traveller, so food is
// tested first, then activities, then the historic/landmark catch-all.
const FOOD =
  /\b(restaurant|restaurants|caf[eé]|cafeteria|coffee\s*house|coffeehouse|coffee\s*shop|bakery|patisserie|p[aâ]tisserie|confectioner|ice\s*cream|steakhouse|pizzeria|bistro|brasserie|tavern|taverna|pub|bar|eatery|diner|food\s*hall|kebab|winery|brewery)\b/i;

const ACTIVITY =
  /\b(park|gardens?|zoo|aquarium|stadium|arena|theatre|theater|cinema|opera\s*house|concert\s*hall|amusement|theme\s*park|water\s*park|funfair|beach|marina|harbou?r|pier|market|bazaar|s[uú]k|souq|shopping|mall|department\s*store|spa|hammam|hamam|bathhouse|bath\s*house|turkish\s*bath|thermal|onsen|ski|golf|racecourse|racetrack|cable\s*car|funicular)\b/i;

const HISTORIC =
  /\b(museum|mosque|masjid|church|cathedral|basilica|chapel|monastery|synagogue|temple|shrine|palace|castle|fortress|citadel|fort|tower|monument|memorial|mausoleum|tomb|necropolis|archaeological|ruins?|historic|historical|ancient|roman|byzantine|ottoman|medieval|gate|city\s*walls?|aqueduct|cistern|obelisk|statue|sculpture|lighthouse|caravanserai|madrasa|library|art\s*gallery|gallery)\b/i;

export function categorisePlace(description: string | undefined): PlaceCategory {
  if (!description) return "place";
  if (FOOD.test(description)) return "food";
  if (ACTIVITY.test(description)) return "activity";
  if (HISTORIC.test(description)) return "historic";
  return "place";
}
