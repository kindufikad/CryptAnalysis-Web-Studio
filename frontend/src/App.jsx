import { useState } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = 'http://127.0.0.1:8000/api/crack/'

const methods = [
  { value: 'caesar', label: 'Caesar Cipher Brute-force' },
  { value: 'substitution', label: 'Substitution Frequency Analysis' },
]
const HISTORY_KEY = 'analysisHistory'

function formatAnalysisReport(session) {
  const { result: analysisResult } = session
  const method = methods.find((item) => item.value === session.algorithm)?.label ?? session.algorithm
  const frequencies = Object.entries(analysisResult.letter_frequencies ?? {})
    .map(([letter, count]) => `${letter.toUpperCase()}: ${count}`)
    .join(', ')
  const candidates = (analysisResult.candidates ?? [])
    .map((candidate) => `Shift ${String(candidate.shift).padStart(2, '0')}: ${candidate.plaintext}`)

  return [
    'CryptAnalysis Web Studio - Analysis Report',
    `Created: ${new Date(session.createdAt).toLocaleString()}`,
    `Method: ${method}`,
    `Ciphertext: ${session.ciphertext}`,
    `Detected shift: ${analysisResult.shift ?? 'N/A'}`,
    `Confidence: ${analysisResult.confidence ?? (analysisResult.estimated ? 'Estimated' : 'N/A')}`,
    '',
    'Plaintext:',
    analysisResult.likely_plaintext ?? analysisResult.plaintext,
    '',
    `Letter frequencies: ${frequencies || 'Not available'}`,
    '',
    'Shift candidates:',
    ...(candidates.length ? candidates : ['No shift candidates returned.']),
  ].join('\n')
}

function App() {
  const [ciphertext, setCiphertext] = useState('')
  const [algorithm, setAlgorithm] = useState('caesar')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
      return Array.isArray(savedHistory) ? savedHistory : []
    } catch {
      return []
    }
  })
  const [activeSession, setActiveSession] = useState(null)
  const [copyStatus, setCopyStatus] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    return savedTheme === null ? true : savedTheme === 'dark'
  })

  function toggleTheme() {
    const nextIsDarkMode = !isDarkMode
    localStorage.setItem('theme', nextIsDarkMode ? 'dark' : 'light')
    setIsDarkMode(nextIsDarkMode)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!ciphertext.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError('')
    setResult(null)

    try {
      const response = await axios.post(API_URL, { ciphertext, algorithm })
      setResult(response.data)
      const session = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ciphertext,
        algorithm,
        result: response.data,
        createdAt: new Date().toISOString(),
      }
      const updatedHistory = [session, ...analysisHistory].slice(0, 10)
      setActiveSession(session)
      setAnalysisHistory(updatedHistory)
      setCopyStatus('')
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory))
      } catch {
        setError('Analysis succeeded, but this session could not be saved in browser history.')
      }
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

  function loadSession(session) {
    setCiphertext(session.ciphertext)
    setAlgorithm(session.algorithm)
    setResult(session.result)
    setActiveSession(session)
    setError('')
    setCopyStatus('')
  }

  function clearHistory() {
    setAnalysisHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  async function copyResults() {
    if (!activeSession) return

    try {
      await navigator.clipboard.writeText(formatAnalysisReport(activeSession))
      setCopyStatus('Results copied')
    } catch {
      setCopyStatus('Clipboard unavailable')
    }
  }

  function exportReport() {
    if (!activeSession) return

    const report = new Blob([formatAnalysisReport(activeSession)], { type: 'text/plain;charset=utf-8' })
    const reportUrl = URL.createObjectURL(report)
    const link = document.createElement('a')
    link.href = reportUrl
    link.download = `cryptanalysis-${activeSession.algorithm}-${activeSession.createdAt.slice(0, 10)}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(reportUrl), 1000)
  }

  const frequencies = result?.letter_frequencies
    ? Object.entries(result.letter_frequencies)
    : []
  const frequencyTotal = frequencies.reduce((total, [, count]) => total + count, 0)

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
            onClick={toggleTheme}
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
                <svg className="select-caret" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 6 4 4 4-4" />
                </svg>
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

                <div className="result-actions">
                  <button className="result-action" type="button" onClick={copyResults}>
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <rect x="7" y="6" width="9" height="11" rx="1.5" />
                      <path d="M13 6V4.5A1.5 1.5 0 0 0 11.5 3h-7A1.5 1.5 0 0 0 3 4.5v9A1.5 1.5 0 0 0 4.5 15H7" />
                    </svg>
                    Copy results
                  </button>
                  <button className="result-action" type="button" onClick={exportReport}>
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M10 2.5v9m0 0 3.5-3.5M10 11.5 6.5 8M3.5 13v3A1.5 1.5 0 0 0 5 17.5h10a1.5 1.5 0 0 0 1.5-1.5v-3" />
                    </svg>
                    Export report
                  </button>
                  <span className="copy-status" aria-live="polite">{copyStatus}</span>
                </div>

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
                      <h3>Letter frequency distribution</h3>
                      <span>{frequencyTotal} TOTAL LETTERS</span>
                    </div>
                    <div className="frequency-list">
                      {frequencies.map(([letter, count]) => (
                        <div className="frequency-row" key={letter}>
                          <span className="frequency-letter">{letter.toUpperCase()}</span>
                          <span className="frequency-track">
                            <span style={{ width: `${frequencyTotal ? (count / frequencyTotal) * 100 : 0}%` }} />
                          </span>
                            <span className="frequency-count">
                              {frequencyTotal ? Math.round((count / frequencyTotal) * 100) : 0}% <small>({count})</small>
                            </span>
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

        <details className="history-panel">
          <summary className="history-summary">
            <span className="history-heading">
              <span className="history-mark" aria-hidden="true">↺</span>
              <span>Analysis history</span>
            </span>
            <span className="history-count">{analysisHistory.length} / 10 SESSIONS</span>
          </summary>
          {analysisHistory.length ? (
            <div className="history-content">
              <button className="history-clear" type="button" onClick={clearHistory}>
                Clear history
              </button>
              <ul className="history-list">
                {analysisHistory.map((session) => (
                  <li key={session.id}>
                    <button className="history-entry" type="button" onClick={() => loadSession(session)}>
                      <span className="history-entry-top">
                        <span>{methods.find((item) => item.value === session.algorithm)?.label ?? session.algorithm}</span>
                        <time dateTime={session.createdAt}>{new Date(session.createdAt).toLocaleString()}</time>
                      </span>
                      <strong>{session.result.likely_plaintext ?? session.result.plaintext}</strong>
                      <span className="history-ciphertext">{session.ciphertext}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="history-empty">Completed analyses will be saved here on this device.</p>
          )}
        </details>

        <footer className="workspace-footer">
          <span>CLASSICAL METHODS <i>•</i> LIVE ANALYSIS</span>
          <span>SESSION 001 <b> / </b> CRYPTANALYSIS LAB</span>
        </footer>
      </main>
    </div>
  )
}

export default App
