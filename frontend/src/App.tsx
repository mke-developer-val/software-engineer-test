import { useState } from 'react'
import ReactJson from 'react-json-view'
import './App.css'

interface HeadingNode {
  tag: string;
  content: string;
  children: HeadingNode[];
}

interface AnalysisResult {
  'semantic-structure': HeadingNode[];
  'skipped-levels': [HeadingNode, HeadingNode][];
  'incongruent-headings': HeadingNode[];
}

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  // Get API URL from environment variable (set during build)
  const apiUrl = import.meta.env.VITE_API_URL || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    if (!apiUrl) {
      setError('API URL not configured. Please redeploy the application.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze URL')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setUrl('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="app">
      <header>
        <h1>Heading Checker</h1>
        <p className="subtitle">
          Analyze the semantic structure of headings in web pages
        </p>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="url">Web Page URL to Analyze:</label>
            <input
              type="url"
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="button-group">
            <button type="submit" disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
            <button type="button" onClick={handleClear} disabled={loading}>
              Clear
            </button>
          </div>
        </form>

        {error && (
          <div className="error">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="results">
            <h2>Analysis Results</h2>
            <div className="json-viewer">
              <ReactJson
                src={result}
                theme="monokai"
                collapsed={1}
                displayDataTypes={false}
                displayObjectSize={true}
                enableClipboard={true}
                indentWidth={2}
                name={false}
              />
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>
          Analyzes heading hierarchy (h1-h6), detects skipped levels, and identifies
          incongruent DOM structures.
        </p>
      </footer>
    </div>
  )
}

export default App
