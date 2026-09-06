import { useSearchStore } from '../lib/stores/search.store'

export function ResultsLimitSelect() {
  const { topK, setTopK } = useSearchStore()
  return <label className="results-limit">Show top <select value={topK} onChange={(event) => setTopK(Number(event.target.value))}><option value={3}>3</option><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select><span>results</span></label>
}
