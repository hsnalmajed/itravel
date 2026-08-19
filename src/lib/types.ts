export type Locale = "ar" | "en";

export type TripType = "flight" | "hotel" | "both";

// "shared" = one shared/double bed, "single" = separate/twin beds — affects
// which room type gets searched, so it matters for result accuracy.
export type BedType = "shared" | "single";

// Passenger composition, matching how flight/hotel sites break down
// travelers: adults (13+), children (ages 1-12, one age per child so fares
// can be priced correctly), and infants (under 1, usually free/near-free).
export interface TravelerCounts {
  adults: number;
  childrenAges: number[];
  infants: number;
}

export interface SearchParams {
  tripType: TripType;
  origin: string; // IATA code or city name
  destination: string; // IATA code or city name
  departDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  adults: number;
  budgetTotal: number;
  currency: string; // e.g. SAR, USD
  directFlightsOnly: boolean;
  minHotelStars: number; // 0-5, 0 = any
  // Optional filters: undefined/false = no filter applied (results of both
  // kinds are shown, with the info still displayed on each option).
  baggageIncluded?: boolean;
  breakfastIncluded?: boolean;
  childrenAges?: number[];
  infants?: number;
  bedType?: BedType; // undefined = no preference
}

export interface FlightOffer {
  id: string;
  airline: string;
  airlineCode: string;
  origin: string;
  destination: string;
  departTime: string;
  arriveTime: string;
  durationMinutes: number;
  stops: number;
  price: number;
  currency: string;
  isMock: boolean;
  bookingHint: string;
  // City (IATA code) of the first layover, and how long it lasts — null when
  // the flight is direct (stops === 0).
  layoverCity: string | null;
  layoverDurationMinutes: number | null;
  baggageIncluded: boolean;
}

export interface HotelOffer {
  id: string;
  name: string;
  stars: number;
  city: string;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  nights: number;
  rating?: number;
  address?: string;
  isMock: boolean;
  bookingHint: string;
  distanceFromCenterKm: number;
  breakfastIncluded: boolean;
  bedType: BedType;
}

export interface PackageCombo {
  flight?: FlightOffer;
  hotel?: HotelOffer;
  totalPrice: number;
  currency: string;
  withinBudget: boolean;
  remainingBudget: number;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
  mealsSuggestion?: string;
  estimatedCost?: string;
}

export interface ItineraryResult {
  destination: string;
  days: number;
  summary: string;
  plan: ItineraryDay[];
  tips: string[];
  isMock: boolean;
}

// A loose taste-based taxonomy for the "suggest a destination" flow — lets
// the user steer suggestions toward what they actually enjoy rather than
// just budget-fit. Each destination in destinations.ts carries 1-3 of these.
export type DestinationCategory = "beach" | "nature" | "adventure" | "city" | "culture" | "family";

export interface DiscoverParams {
  origin: string;
  tripType: TripType;
  budgetTotal: number;
  currency: string;
  departDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD — nights are derived from depart/return
  nights: number;
  adults: number;
  directFlightsOnly: boolean;
  minHotelStars: number;
  multiDestination: boolean;
  baggageIncluded?: boolean;
  breakfastIncluded?: boolean;
  childrenAges?: number[];
  infants?: number;
  bedType?: BedType;
  preferenceCategory?: DestinationCategory;
}

export interface DestinationSuggestion {
  destinationCode: string;
  destinationNameAr: string;
  destinationNameEn: string;
  emoji: string;
  // Optional because "discover" can be scoped to flights-only or
  // hotels-only, in which case only one side of the trip is priced.
  flight?: FlightOffer;
  hotel?: HotelOffer;
  nights: number;
  totalPrice: number;
  currency: string;
  withinBudget: boolean;
  remainingBudget: number;
}

export interface DestinationPairSuggestion {
  legs: [DestinationSuggestion, DestinationSuggestion];
  totalPrice: number;
  currency: string;
  withinBudget: boolean;
  remainingBudget: number;
}

// --- Multi-city ("تعدد وجهات") trip planning ---
// A user-specified sequence of destinations, each with a number of nights,
// starting and ending at the same origin city — e.g. Riyadh -> Istanbul (3
// nights) -> Paris (4 nights) -> Barcelona (2 nights) -> Riyadh.

export type FlightRoute = "roundtrip" | "oneway" | "multicity";

export interface MultiCityLegInput {
  destination: string; // city name or IATA code
  nights: number;
}

export interface MultiCitySearchParams {
  origin: string;
  legs: MultiCityLegInput[];
  departDate: string; // YYYY-MM-DD, first leg's departure date
  adults: number;
  budgetTotal: number;
  currency: string;
  directFlightsOnly: boolean;
  minHotelStars: number;
  baggageIncluded?: boolean;
  breakfastIncluded?: boolean;
  childrenAges?: number[];
  infants?: number;
  bedType?: BedType;
}

export interface MultiCityLegResult {
  destination: string;
  destinationIata: string;
  nights: number;
  departDate: string; // date of the flight arriving into this leg
  flight: FlightOffer | null;
  hotel: HotelOffer | null;
}

export interface MultiCityAdvice {
  // Budget that would make this exact itinerary fit, rounded up.
  suggestedBudget: number;
  // Roughly how many total nights to cut across the trip to fit the current budget.
  suggestedNightsToReduce: number;
  // Whether dropping one destination is a reasonable suggestion (3+ legs only).
  canRemoveDestination: boolean;
}

export interface MultiCityTripResult {
  origin: string;
  legs: MultiCityLegResult[];
  returnFlight: FlightOffer | null;
  totalFlightsPrice: number;
  totalHotelsPrice: number;
  totalPrice: number;
  currency: string;
  budgetTotal: number;
  withinBudget: boolean;
  remainingBudget: number;
  advice: MultiCityAdvice | null;
  isMock: boolean;
}
