import { useSearchStore } from '../lib/stores/search.store'

export function HybridWeightPanel() {
  const { bm25Weight, vectorWeight, setWeights } = useSearchStore()
  return <section className="weight-panel" aria-labelledby="weight-title"><div className="weight-heading"><span id="weight-title">Search weights</span><b>{bm25Weight + vectorWeight}% total</b></div><label>BM25 <output>{bm25Weight}%</output><input type="range" min="0" max="100" value={bm25Weight} onChange={(event) => setWeights(Number(event.target.value), 100 - Number(event.target.value))} /></label><label>Vector <output>{vectorWeight}%</output><input type="range" min="0" max="100" value={vectorWeight} onChange={(event) => setWeights(100 - Number(event.target.value), Number(event.target.value))} /></label><div className="preset-row"><button type="button" onClick={() => setWeights(50, 50)}>50 / 50</button><button type="button" onClick={() => setWeights(70, 30)}>70 / 30</button><button type="button" onClick={() => setWeights(30, 70)}>30 / 70</button></div></section>
}
