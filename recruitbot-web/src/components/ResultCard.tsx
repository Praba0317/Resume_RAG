import type { SearchResult, SearchMode } from '../types/search.types'
import { useUiStore } from '../lib/stores/ui.store'
import { useSearchStore } from '../lib/stores/search.store'

interface ResultCardProps {
  result: SearchResult
}

function getScoreColor(mode: SearchMode): string {
  if (mode === 'bm25') return 'score-pill-bm25'
  if (mode === 'vector') return 'score-pill-vector'
  return 'score-pill-hybrid'
}

function scoreForMode(result: SearchResult, mode: SearchMode): number {
  if (mode === 'bm25') return result.bm25Score ?? 0
  if (mode === 'vector') return result.vectorScore ?? 0
  return result.relevanceScore ?? result.vectorScore ?? result.bm25Score ?? 0
}

export function ResultCard({ result }: ResultCardProps) {
  const { openCandidateModal } = useUiStore()
  const searchMode = useSearchStore((state) => state.searchMode)

  const score = scoreForMode(result, searchMode)
  const scoreClass = getScoreColor(searchMode)

  return (
    <button
      className="result-card"
      onClick={() => openCandidateModal(result.resumeId)}
      type="button"
    >
      <div className="result-card-header">
        <div className="result-rank-badge">#{result.rank}</div>
        <h3>{result.name}</h3>
        <span className={`score-pill ${scoreClass}`}>{score.toFixed(2)}</span>
      </div>

      {(result.role || result.company) && (
        <p className="result-subtitle">
          {result.role}
          {result.role && result.company && ' at '}
          {result.company}
        </p>
      )}

      {result.skills && result.skills.length > 0 && (
        <div className="skill-row">
          {result.skills.slice(0, 5).map((skill, idx) => (
            <span key={idx} className="skill-tag">
              {skill}
            </span>
          ))}
          {result.skills.length > 5 && (
            <span className="skill-more">+{result.skills.length - 5}</span>
          )}
        </div>
      )}

      {result.snippet && (
        <p className="result-snippet">{result.snippet.substring(0, 220)}...</p>
      )}

      {result.summary && !result.snippet && (
        <p className="result-snippet">{result.summary.substring(0, 220)}...</p>
      )}

      <div className="result-meta">
        {result.sources && (
          <span className="source-badge">
            {result.sources.map((s) => (s === 'bm25' ? 'BM25' : 'Vector')).join(', ')}
          </span>
        )}
      </div>
    </button>
  )
}
