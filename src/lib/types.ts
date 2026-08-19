export type Locale = "ar" | "en";

export type TripType = "flight" | "hotel" | "both";

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

export interface DiscoverParams {
  origin: string;
  budgetTotal: number;
  currency: string;
  departDate: string; // YYYY-MM-DD
  nights: number;
  adults: number;
  directFlightsOnly: boolean;
  minHotelStars: number;
  multiDestination: boolean;
}

export interface DestinationSuggestion {
  destinationCode: string;
  destinationNameAr: string;
  destinationNameEn: string;
  emoji: string;
  flight: FlightOffer;
  hotel: HotelOffer;
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
