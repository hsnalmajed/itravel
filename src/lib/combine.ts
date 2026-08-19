import type { FlightOffer, HotelOffer, PackageCombo, TripType } from "./types";

export function buildCombos(
  tripType: TripType,
  flights: FlightOffer[],
  hotels: HotelOffer[],
  budgetTotal: number
): PackageCombo[] {
  const combos: PackageCombo[] = [];

  if (tripType === "flight") {
    for (const flight of flights.slice(0, 10)) {
      combos.push({
        flight,
        totalPrice: flight.price,
        currency: flight.currency,
        withinBudget: flight.price <= budgetTotal,
        remainingBudget: budgetTotal - flight.price,
      });
    }
  } else if (tripType === "hotel") {
    for (const hotel of hotels.slice(0, 10)) {
      combos.push({
        hotel,
        totalPrice: hotel.totalPrice,
        currency: hotel.currency,
        withinBudget: hotel.totalPrice <= budgetTotal,
        remainingBudget: budgetTotal - hotel.totalPrice,
      });
    }
  } else {
    const topFlights = flights.slice(0, 4);
    const topHotels = hotels.slice(0, 4);
    for (const flight of topFlights) {
      for (const hotel of topHotels) {
        const totalPrice = flight.price + hotel.totalPrice;
        combos.push({
          flight,
          hotel,
          totalPrice,
          currency: flight.currency,
          withinBudget: totalPrice <= budgetTotal,
          remainingBudget: budgetTotal - totalPrice,
        });
      }
    }
  }

  // Prefer combos within budget, closest to (but not over) budget first — best use of the money.
  // Combos over budget are shown too (sorted cheapest-first) so the user sees how close they are.
  const within = combos.filter((c) => c.withinBudget).sort((a, b) => a.remainingBudget - b.remainingBudget);
  const over = combos.filter((c) => !c.withinBudget).sort((a, b) => a.totalPrice - b.totalPrice);

  return [...within, ...over].slice(0, 9);
}
