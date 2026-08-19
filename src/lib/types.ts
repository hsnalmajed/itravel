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
