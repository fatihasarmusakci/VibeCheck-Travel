import { useEffect, useMemo, useState } from 'react'

import type { SurfaceType, VibecheckDataBundle } from './features/vibecheck/types'
import { vibecheckService } from './services/vibecheck-provider'
import HotelAnalysisCard from './components/HotelAnalysisCard'

function App() {
  const [sessionStart] = useState(() => Date.now())
  const [bundle, setBundle] = useState<VibecheckDataBundle | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [step, setStep] = useState(1)
  const [persona, setPersona] = useState('Quiet Seeker')
  const [activeHotelId, setActiveHotelId] = useState('')
  const [surface, setSurface] = useState<SurfaceType>('decision')
  const [selectedLayers, setSelectedLayers] = useState<string[]>(['quiet', 'metro'])
  const [gameGuess, setGameGuess] = useState<'real' | 'manipulated' | null>(null)
  const [timeToActionSeconds, setTimeToActionSeconds] = useState<number | null>(null)
  const [eventLog, setEventLog] = useState<string[]>([])

  useEffect(() => {
    const loadBundle = async () => {
      try {
        const response = await vibecheckService.getBundle()
        setBundle(response)
        setPersona(response.personas[0])
        setActiveHotelId(response.hotels[0]?.id ?? '')
      } catch {
        setErrorMessage('Data could not be loaded. Check API source and try again.')
      }
    }
    void loadBundle()
  }, [])

  const activeHotel = useMemo(() => {
    if (!bundle || bundle.hotels.length === 0) {
      return null
    }
    return bundle.hotels.find((hotel) => hotel.id === activeHotelId) ?? bundle.hotels[0]
  }, [activeHotelId, bundle])

  const toggleLayer = (layerId: string) => {
    setSelectedLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((layer) => layer !== layerId)
        : [...prev, layerId],
    )
  }

  const logEvent = (eventName: string) => {
    setEventLog((prev) => [eventName, ...prev].slice(0, 6))
  }

  const handleBookingClick = () => {
    const seconds = Math.round((Date.now() - sessionStart) / 1000)
    setTimeToActionSeconds(seconds)
    logEvent('cta_clicked')
  }

  if (errorMessage) {
    return (
      <main className="app-shell">
        <section className="panel">
          <h2>VibeCheck</h2>
          <p>{errorMessage}</p>
        </section>
      </main>
    )
  }

  if (!bundle || !activeHotel) {
    return (
      <main className="app-shell">
        <section className="panel">
          <h2>VibeCheck</h2>
          <p className="muted">Loading prototype data source...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="hero-card">
        <p className="eyebrow">VibeCheck Travel - London Pilot</p>
        <h1>Truth-first hotel decision prototype</h1>
        <p className="subtitle">
          Official content, user reality, and lifestyle fit in one mobile-first flow.
        </p>
      </header>

      <section className="panel">
        <h2>1) Persona Engine (3-step onboarding)</h2>
        <div className="step-row" role="tablist" aria-label="Onboarding steps">
          {[1, 2, 3].map((item) => (
            <button
              key={item}
              type="button"
              className={`chip ${step === item ? 'chip-active' : ''}`}
              onClick={() => setStep(item)}
            >
              Step {item}
            </button>
          ))}
        </div>
        <div className="grid two-col">
          <article className="card">
            <p className="muted">Step {step} question</p>
            <p>
              {step === 1 && 'Your ideal stay: quiet recharge or social exploration?'}
              {step === 2 && 'Priority score: sleep quality, social buzz, or productivity?'}
              {step === 3 && 'What should be non-negotiable in your booking decision?'}
            </p>
          </article>
          <article className="card">
            <p className="muted">Persona output</p>
            <div className="step-row">
              {bundle.personas.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${persona === item ? 'chip-active' : ''}`}
                  onClick={() => {
                    setPersona(item)
                    logEvent('onboarding_completed')
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <p className="status">
              Active persona: <strong>{persona}</strong>
            </p>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2>2) Decision Surface</h2>
        <div className="step-row">
          <button
            type="button"
            className={`chip ${surface === 'decision' ? 'chip-active' : ''}`}
            onClick={() => setSurface('decision')}
          >
            Truth Dashboard + TL;DR
          </button>
          <button
            type="button"
            className={`chip ${surface === 'retention' ? 'chip-active' : ''}`}
            onClick={() => setSurface('retention')}
          >
            Daily Hooks
          </button>
        </div>

        {surface === 'decision' ? (
          <>
            <div className="hotel-switch" role="tablist" aria-label="Hotel options">
              {bundle.hotels.map((hotel) => (
                <button
                  key={hotel.id}
                  type="button"
                  className={`hotel-tab ${activeHotelId === hotel.id ? 'hotel-tab-active' : ''}`}
                  onClick={() => {
                    setActiveHotelId(hotel.id)
                    logEvent('truth_dashboard_viewed')
                  }}
                >
                  {hotel.name}
                </button>
              ))}
            </div>

            <article className="card">
              <h3>Truth Dashboard (50/50 compare)</h3>
              <div className="photo-compare" aria-label="Official and user photo comparison">
                <div className="photo-box">
                  <p className="photo-title">{activeHotel.officialPhotoLabel}</p>
                  <p className="photo-date">Published: {activeHotel.officialDate}</p>
                </div>
                <div className="photo-box">
                  <p className="photo-title">{activeHotel.userPhotoLabel}</p>
                  <p className="photo-date">Uploaded: {activeHotel.userDate}</p>
                </div>
              </div>
              <p className="muted">
                Date gap is visible to increase trust before booking decision.
              </p>
            </article>

            <div className="grid two-col">
              <article className="card">
                <h3>AI TL;DR summary</h3>
                <p>{activeHotel.summary}</p>
                <p className="muted">Source: 24 recent reviews analyzed (prototype mock).</p>
              </article>
              <article className="card">
                <h3>Semantic Scorer + Honesty Filter</h3>
                <p>Smart Score: {activeHotel.smartScore}/10</p>
                <p>Wi-Fi {activeHotel.wifiScore}/10 | Sleep {activeHotel.sleepScore}/10 | Social {activeHotel.socialScore}/10</p>
                <p className="muted">Red flags: {activeHotel.flags.join(', ')}</p>
              </article>
            </div>

            <HotelAnalysisCard reviews={activeHotel.reviews || []} />

            <article className="card">
              <h3>Interactive Vibe-Map</h3>
              <div className="step-row">
                {bundle.mapLayers.map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    className={`chip ${selectedLayers.includes(layer.id) ? 'chip-active' : ''}`}
                    onClick={() => {
                      toggleLayer(layer.id)
                      logEvent('vibemap_filter_used')
                    }}
                  >
                    {layer.emoji} {layer.label}
                  </button>
                ))}
              </div>
              <p className="muted">
                Active layers: {selectedLayers.length > 0 ? selectedLayers.join(', ') : 'none'}
              </p>
              <button type="button" className="cta-button" onClick={handleBookingClick}>
                Go to booking site
              </button>
              {timeToActionSeconds !== null ? (
                <p className="status">Measured Time to Action: {timeToActionSeconds}s</p>
              ) : null}
            </article>
          </>
        ) : (
          <div className="grid">
            <article className="card">
              <h3>Vibe-Check Game</h3>
              <p>Guess if this room photo is real or manipulated.</p>
              <div className="step-row">
                <button
                  type="button"
                  className={`chip ${gameGuess === 'real' ? 'chip-active' : ''}`}
                  onClick={() => {
                    setGameGuess('real')
                    logEvent('game_played')
                  }}
                >
                  Real
                </button>
                <button
                  type="button"
                  className={`chip ${gameGuess === 'manipulated' ? 'chip-active' : ''}`}
                  onClick={() => {
                    setGameGuess('manipulated')
                    logEvent('game_played')
                  }}
                >
                  Manipulated
                </button>
              </div>
              <p className="status">
                {gameGuess ? `Your guess: ${gameGuess}` : 'Pick one to submit daily training signal.'}
              </p>
            </article>

            <article className="card">
              <h3>Daily City Insight</h3>
              <p>
                {bundle.insight.city} insight: {bundle.insight.message}
              </p>
              <button
                type="button"
                className="cta-button secondary-button"
                onClick={() => logEvent('daily_insight_opened')}
              >
                Open insight card
              </button>
            </article>

            <article className="card">
              <h3>Staycation Mode</h3>
              <p>Rate nearby hotels for co-working comfort and weekend brunch quality.</p>
              <div className="step-row">
                <span className="badge">Co-working: {bundle.staycation.coworking}</span>
                <span className="badge">Brunch: {bundle.staycation.brunch}</span>
                <span className="badge">Wi-Fi reliability: {bundle.staycation.wifiReliability}</span>
              </div>
            </article>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>3) Prototype Analytics Snapshot</h2>
        <div className="card">
          <p className="muted">
            Recent events: {eventLog.length > 0 ? eventLog.join(' -> ') : 'no events yet'}
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
