import { useState } from 'react'
import type { HotelAnalysisResponse } from '../types/hotelAnalysis'
import { hotelAnalysisService } from '../services/hotelAnalysisService'
import './HotelAnalysisCard.css'

interface HotelAnalysisCardProps {
  reviews: string[]
}

export default function HotelAnalysisCard({ reviews }: HotelAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<HotelAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (reviews.length === 0) {
      setError('Analiz için en az bir yorum gerekli')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const result = await hotelAnalysisService.analyzeReviews({ reviews })
      setAnalysis(result)
    } catch (err) {
      setError('Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreLabel = (score: number) => {
    if (score >= 5) return 'Mükemmel'
    if (score >= 4) return 'Çok İyi'
    if (score >= 3) return 'İyi'
    if (score >= 2) return 'Orta'
    return 'Kötü'
  }

  const getStarRating = (score: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      if (i <= score) {
        stars.push('⭐')
      } else if (i - 0.5 <= score) {
        stars.push('✨')
      } else {
        stars.push('☆')
      }
    }
    return stars.join('')
  }

  return (
    <div className="hotel-analysis-card">
      <div className="card-header">
        <h3>Yapay Zeka Analizi</h3>
        {!analysis && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="analyze-button"
          >
            {loading ? 'Analiz ediliyor...' : 'Analiz Et'}
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}

      {analysis && (
        <div className="analysis-results">
          {/* Skorlar Grid */}
          <div className="scores-grid">
            {/* Temizlik Skoru */}
            <div className="score-card score-card-green">
              <div className="score-header">
                <span className="score-label">🧹 Temizlik</span>
                <span className="score-value">{analysis.cleaning_score}/5</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill progress-fill-green"
                  style={{ width: `${(analysis.cleaning_score / 5) * 100}%` }}
                ></div>
              </div>
              <p className="score-text">{getScoreLabel(analysis.cleaning_score)}</p>
              <p className="score-text" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                {getStarRating(analysis.cleaning_score)}
              </p>
            </div>

            {/* Sessizlik Skoru */}
            <div className="score-card score-card-purple">
              <div className="score-header">
                <span className="score-label">🤫 Sessizlik</span>
                <span className="score-value">{analysis.quietness_score}/5</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill progress-fill-purple"
                  style={{ width: `${(analysis.quietness_score / 5) * 100}%` }}
                ></div>
              </div>
              <p className="score-text">{getScoreLabel(analysis.quietness_score)}</p>
              <p className="score-text" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                {getStarRating(analysis.quietness_score)}
              </p>
            </div>

            {/* Çocuk Parkı */}
            <div className="score-card score-card-orange">
              <div className="score-header">
                <span className="score-label">🎠 Çocuk Parkı</span>
                <span className="score-value" style={{ fontSize: '1.5rem' }}>
                  {analysis.has_playground ? '✓' : '✗'}
                </span>
              </div>
              <div className={`playground-indicator ${analysis.has_playground ? 'has-playground' : 'no-playground'}`}>
                <span className="icon">{analysis.has_playground ? '✅' : '❌'}</span>
                <span>{analysis.has_playground ? 'Oyun Alanı Var' : 'Bilgi Bulunamadı'}</span>
              </div>
            </div>
          </div>

          {/* Pros ve Cons */}
          <div className="pros-cons-grid">
            {/* Olumlu Özellikler */}
            <div className="pros-cons-card pros-card">
              <h4>
                <span className="bullet">💚</span> Olumlu Özellikler
              </h4>
              <ul className="feature-list">
                {analysis.pros.map((pro, index) => (
                  <li key={index}>
                    <span className="bullet">✓</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Olumsuz Özellikler */}
            <div className="pros-cons-card cons-card">
              <h4>
                <span className="bullet">💔</span> Olumsuz Özellikler
              </h4>
              <ul className="feature-list">
                {analysis.cons.map((con, index) => (
                  <li key={index}>
                    <span className="bullet">!</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Yeniden Analiz Butonu */}
          <div className="reanalyze-section">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="reanalyze-button"
            >
              🔄 Yeniden Analiz Et
            </button>
          </div>
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <p className="empty-text">Otel yorumlarını yapay zeka ile analiz edin</p>
          <p className="empty-subtext">Temizlik, sessizlik, çocuk parkı ve özellik analizi</p>
        </div>
      )}
    </div>
  )
}
