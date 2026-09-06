import { Search } from 'lucide-react'
import type { SearchResult, SearchMode } from '../types/search.types'
import { ResultCard } from './ResultCard'

interface ResultsListProps {
  results: SearchResult[]
  searchMode: SearchMode
  query: string
  durationMs?: number
  degraded?: boolean
  warnings?: string[]
}

export function ResultsList({ results, searchMode, query, durationMs, degraded, warnings }: ResultsListProps) {
  if (results.length === 0) {
    return (
      <div className="empty-results">
        <Search size={48} />
        <p>No results found for "{query}"</p>
        <p className="empty-results-hint">Try adjusting your search terms or filters</p>
      </div>
    )
  }

  return (
    <div className="results-list">
      <div className="result-summary">
        <span className="result-count">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </span>
        <span className="result-mode-badge">{searchMode.toUpperCase()}</span>
        {durationMs && <span className="result-duration">{durationMs}ms</span>}
      </div>

      {degraded && warnings && warnings.length > 0 && (
        <div className="degraded-search-warning">
          <p>⚠️ Search performance degraded. Some results may be incomplete.</p>
          <ul>
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="result-card-list">
        {results.map((result) => (
          <ResultCard key={result.resumeId} result={result} />
        ))}
      </div>
    </div>
  )
}
