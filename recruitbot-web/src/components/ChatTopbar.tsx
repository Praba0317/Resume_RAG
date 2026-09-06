import { Search, Sparkles } from 'lucide-react'
import { useSearchStore } from '../lib/stores/search.store'

const modeDetails = { vector: 'Semantic similarity', bm25: 'Keyword precision', hybrid: 'Combined retrieval' }

export function ChatTopbar() {
  const searchMode = useSearchStore((state) => state.searchMode)
  return <header className="chat-topbar"><div className="topbar-identity"><span className="mini-mark">R</span><div><strong>RecruitBot</strong><small>{modeDetails[searchMode]}</small></div></div><span className={`mode-badge ${searchMode}`}><span className="topbar-mode-icon">{searchMode === 'vector' ? <Sparkles size={12} /> : <Search size={12} />}</span>{searchMode === 'bm25' ? 'BM25' : searchMode === 'vector' ? 'Vector' : 'Hybrid'}</span></header>
}
