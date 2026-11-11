import { useState } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'http://127.0.0.1:8000/api/crack/'

const methods = [
  { value: 'caesar', label: 'Caesar Cipher Brute-force' },
  { value: 'substitution', label: 'Substitution Frequency Analysis' },
]

function App() {
  const [ciphertext, setCiphertext] = useState('')
  const [algorithm, setAlgorithm] = useState('caesar')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!ciphertext.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError('')
    setResult(null)

    try {
      const response = await axios.post(API_URL, { ciphertext, algorithm })
      setResult(response.data)
    } catch (requestError) {
      const detail = requestError.response?.data?.detail
      setError(
        detail ||
          (requestError.response
            ? 'The analysis request could not be completed.'
            : 'Could not reach the Django API. Check that the backend is running.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const frequencies = result?.letter_frequencies
    ? Object.entries(result.letter_frequencies)
    : []
  const highestFrequency = Math.max(1, ...frequencies.map(([, count]) => count))

  return (
    <div className="app-shell" data-theme={isDarkMode ? 'dark' : 'light'}>
      <header className="topbar">
        <a className="brand" href="#workspace" aria-label="CryptAnalysis Web Studio home">
          <span className="brand-mark" aria-hidden="true">CA</span>
          <span className="brand-name">CryptAnalysis <span>Web Studio</span></span>
        </a>
        <div className="topbar-actions">
          <div className="security-visual" aria-hidden="true">
            <span className="visual-code code-left">0101<br />1010</span>
            <span className="visual-code code-right">1100<br />0110</span>
            <svg className="visual-lock" viewBox="0 0 48 56">
              <path d="M12 23v-8a12 12 0 0 1 24 0v8" />
              <rect x="6" y="22" width="36" height="29" rx="4" />
              <circle cx="24" cy="34" r="2.5" />
              <path d="M24 37v6" />
            </svg>
            <svg className="visual-key" viewBox="0 0 40 40">
              <circle cx="12" cy="20" r="7" />
              <path d="M19 20h15m-5 0v5m-5-5v4" />
            </svg>
            <span className="visual-spark spark-one" />
            <span className="visual-spark spark-two" />
          </div>
          <button
            className="theme-toggle"
            type="button"
            aria-label="Toggle color theme"
            aria-pressed={isDarkMode}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            onClick={() => setIsDarkMode((currentMode) => !currentMode)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {isDarkMode ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                </>
              ) : (
                <path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
              )}
            </svg>
          </button>
        </div>
      </header>

      <main id="workspace" className="workspace">
        <section className="workspace-heading">
          <h1>CryptAnalysis <em>Web Studio</em></h1>
        </section>

        <div className="analysis-grid">
          <section className="input-panel" aria-labelledby="input-title">
            <div className="panel-heading">
              <span className="panel-index">01</span>
              <h2 id="input-title">Ciphertext</h2>
              <span className="panel-tag">INPUT</span>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="ciphertext">Source text</label>
              <textarea
                id="ciphertext"
                name="ciphertext"
                value={ciphertext}
                onChange={(event) => setCiphertext(event.target.value)}
                placeholder="Paste encrypted text..."
                rows={9}
                required
              />
              <div className="input-footnote">
                <span>Preserves spacing and punctuation</span>
                <span>{ciphertext.length} chars</span>
              </div>

              <label className="field-label method-label" htmlFor="algorithm">Analysis method</label>
              <div className="select-wrap">
                <select
                  id="algorithm"
                  name="algorithm"
                  value={algorithm}
                  onChange={(event) => setAlgorithm(event.target.value)}
                >
                  {methods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
                <span className="select-caret" aria-hidden="true">⌄</span>
              </div>

              <button className="submit-button" type="submit" disabled={!ciphertext.trim() || isSubmitting}>
                <span>{isSubmitting ? 'Analyzing...' : 'Run analysis'}</span>
                <span className="button-arrow" aria-hidden="true">↗</span>
              </button>
            </form>
          </section>

          <section className="output-panel" aria-labelledby="output-title" aria-live="polite">
            <div className="panel-heading output-heading">
              <span className="panel-index">02</span>
              <h2 id="output-title">Analysis result</h2>
              <span className="output-indicator"><span /> OUTPUT</span>
            </div>

            {isSubmitting ? (
              <div className="empty-output loading-output">
                <span className="loader-mark" aria-hidden="true" />
                <p>Working through the cipher</p>
              </div>
            ) : error ? (
              <div className="error-output" role="alert">
                <span className="error-code">REQUEST FAILED</span>
                <p>{error}</p>
              </div>
            ) : result ? (
              <div className="result-content">
                <div className="result-meta">
                  <span>
                    {algorithm === 'caesar'
                      ? result.confidence === 'low'
                        ? 'BEST CANDIDATE'
                        : 'CRACKED PLAINTEXT'
                      : 'FREQUENCY ESTIMATE'}
                  </span>
                  {typeof result.shift === 'number' && (
                    <span className="shift-pill">SHIFT KEY {String(result.shift).padStart(2, '0')}</span>
                  )}
                  {result.confidence === 'low' && <span className="estimate-pill">LOW CONFIDENCE</span>}
                  {result.estimated && <span className="estimate-pill">ESTIMATE</span>}
                </div>
                <pre className="plaintext-output">{result.likely_plaintext ?? result.plaintext}</pre>

                {Array.isArray(result.candidates) && result.candidates.length > 0 && (
                  <details className="candidate-details">
                    <summary>
                      <span>All Caesar candidates</span>
                      <span>{result.candidates.length} SHIFTS</span>
                    </summary>
                    <ol className="candidate-list">
                      {result.candidates.map((candidate) => (
                        <li
                          className={candidate.shift === result.shift ? 'best-candidate' : ''}
                          key={candidate.shift}
                        >
                          <span className="candidate-shift">
                            SHIFT {String(candidate.shift).padStart(2, '0')}
                          </span>
                          <code>{candidate.plaintext}</code>
                          {candidate.shift === result.shift && (
                            <span className="candidate-best-label">LIKELY</span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </details>
                )}

                {frequencies.length > 0 && (
                  <div className="frequency-section">
                    <div className="frequency-title">
                      <h3>Letter frequency</h3>
                      <span>{frequencies.length} LETTERS</span>
                    </div>
                    <div className="frequency-list">
                      {frequencies.map(([letter, count]) => (
                        <div className="frequency-row" key={letter}>
                          <span className="frequency-letter">{letter.toUpperCase()}</span>
                          <span className="frequency-track">
                            <span style={{ width: `${(count / highestFrequency) * 100}%` }} />
                          </span>
                          <span className="frequency-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-output">
                <span className="empty-glyph" aria-hidden="true">∴</span>
                <p>Awaiting ciphertext</p>
                <span>RESULTS WILL APPEAR HERE</span>
              </div>
            )}
          </section>
        </div>

        <footer className="workspace-footer">
          <span>CLASSICAL METHODS <i>•</i> LIVE ANALYSIS</span>
          <span>SESSION 001 <b> / </b> CRYPTANALYSIS LAB</span>
        </footer>
      </main>
    </div>
  )
}

export default App
