import type { HotelAnalysisRequest, HotelAnalysisResponse } from '../types/hotelAnalysis'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const hotelAnalysisService = {
  async analyzeReviews(request: HotelAnalysisRequest): Promise<HotelAnalysisResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotels/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Hotel analysis API error:', error)
      throw error
    }
  },
}
