export interface HotelAnalysisRequest {
  reviews: string[];
}

export interface HotelAnalysisResponse {
  cleaning_score: number;
  has_playground: boolean;
  quietness_score: number;
  pros: string[];
  cons: string[];
}
