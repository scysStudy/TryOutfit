export type ClothingCategory = "tops" | "bottoms" | "dresses";

export interface PersonImage {
  id: string;
  url: string;
  timestamp: number;
}

export interface ClothingImage {
  id: string;
  url: string;
  category: ClothingCategory | null;
  timestamp: number;
}

export interface TryOnResult {
  id: string;
  personImageId: string;
  clothingImageId: string;
  resultUrl: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  personImage: PersonImage;
  clothingImage: ClothingImage;
  result: TryOnResult;
}

export interface UserCredits {
  remaining: number;
  total: number;
  isSubscribed: boolean;
}

export interface GameState {
  personImage: PersonImage | null;
  clothingImage: ClothingImage | null;
  currentResult: TryOnResult | null;
  history: HistoryItem[];
  credits: UserCredits;
  isGenerating: boolean;
  error: string | null;
}

export type GameAction =
  | { type: "SET_PERSON_IMAGE"; payload: PersonImage }
  | { type: "SET_CLOTHING_IMAGE"; payload: ClothingImage }
  | { type: "SET_RESULT"; payload: TryOnResult }
  | { type: "ADD_TO_HISTORY"; payload: HistoryItem }
  | { type: "REMOVE_FROM_HISTORY"; payload: string }
  | { type: "CLEAR_CURRENT"; }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "UPDATE_CREDITS"; payload: Partial<UserCredits> }
  | { type: "CLEAR_ALL" };

export interface ApiError {
  code: string;
  message: string;
  type: "AuthenticationError" | "RateLimitError" | "TimeoutError" | "ServerError" | "UnknownError";
  statusCode?: number;
}

export interface TryOnApiResponse {
  url: string;
  size: string;
}

export interface TryOnRequest {
  personImageUrl: string;
  clothingImageUrl: string;
  category: ClothingCategory;
}
