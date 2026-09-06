import { CheckCircle2, Database, LoaderCircle, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { IngestionResponse } from '../lib/api/ingestion.api'
import { getRetrievalReadiness, type RetrievalReadiness } from '../lib/api/readiness.api'

interface IngestionResultScreenProps {
  fileName: string
  result: IngestionResponse
  onReset: () => void
}

export function IngestionResultScreen({ fileName, result, onReset }: IngestionResultScreenProps) {
  const [readiness, setReadiness] = useState<RetrievalReadiness | null>(null)
  const [readinessFailed, setReadinessFailed] = useState(false)

  useEffect(() => {
    let active = true
    getRetrievalReadiness().then((value) => {
      if (active) setReadiness(value)
    }).catch(() => {
      if (active) setReadinessFailed(true)
    })
    return () => { active = false }
  }, [])

  const ready = readiness?.ready === true
  return (
    <div className="ingestion-result" role="status" aria-live="polite">
      <div className="result-success-icon"><CheckCircle2 size={25} /></div>
      <span className="eyebrow">Ingestion complete</span>
      <h3>{fileName}</h3>
      <p className="result-intro">This resume is now available in your private candidate collection.</p>
      <div className="result-metrics">
        <div>{readiness ? <Database size={15} /> : readinessFailed ? <TriangleAlert size={15} /> : <LoaderCircle size={15} className="spin" />}<span><b>{ready ? 'Vector search ready' : readinessFailed ? 'Readiness check unavailable' : 'Checking vector readiness...'}</b><small>{ready ? `${readiness.resumesWithEmbedding} resume embedding(s) · ${result.data.embeddingDimension ?? 1024} dimensions` : readinessFailed ? 'Check the backend connection and retry.' : 'Verifying the stored collection'}</small></span></div>
        <div><Sparkles size={15} /><span><b>{result.data.skillsCount} skills detected</b><small>Profile enriched</small></span></div>
        <div><CheckCircle2 size={15} /><span><b>Stored safely</b><small>{result.timings.totalMs} ms processing</small></span></div>
      </div>
      <div className="result-actions"><button type="button" className="result-primary" onClick={onReset}>Search this collection</button><button type="button" className="result-secondary" onClick={onReset}><RotateCcw size={14} /> Add another</button></div>
    </div>
  )
}
