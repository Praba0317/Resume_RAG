import { MessageSquare, Search, Sparkles } from 'lucide-react'
import type { SearchMode } from '../types/search.types'

const modes: { value: SearchMode; label: string; detail: string; icon: typeof Sparkles }[] = [
  { value: 'vector', label: 'Vector', detail: 'Semantic similarity', icon: Sparkles },
  { value: 'bm25', label: 'BM25', detail: 'Keyword precision', icon: Search },
  { value: 'hybrid', label: 'Hybrid', detail: 'Best of both paths', icon: MessageSquare },
]

interface SearchModeNavProps {
  activeMode: SearchMode
  onChange: (mode: SearchMode) => void
}

export function SearchModeNav({ activeMode, onChange }: SearchModeNavProps) {
  return <nav className="mode-list" aria-label="Search mode">{modes.map(({ value, label, detail, icon: Icon }) => <button className={`mode-button ${activeMode === value ? 'active' : ''}`} key={value} type="button" onClick={() => onChange(value)} aria-pressed={activeMode === value}><Icon size={17} strokeWidth={1.8} /><span><b>{label}</b><small>{detail}</small></span>{activeMode === value && <em>Active</em>}</button>)}</nav>
}
