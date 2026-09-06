import { create } from 'zustand'
import type { SearchMode, SearchResult } from '../../types/search.types'

interface SearchState {
  searchMode: SearchMode
  bm25Weight: number
  vectorWeight: number
  topK: number
  results: SearchResult[]
  lastQuery: string
  setSearchMode: (mode: SearchMode) => void
  setWeights: (bm25: number, vector: number) => void
  setTopK: (topK: number) => void
  setResults: (results: SearchResult[], query: string) => void
  clearResults: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  searchMode: 'vector',
  bm25Weight: 50,
  vectorWeight: 50,
  topK: 5,
  results: [],
  lastQuery: '',
  setSearchMode: (searchMode) => set({ searchMode }),
  setWeights: (bm25Weight, vectorWeight) => set({ bm25Weight, vectorWeight }),
  setTopK: (topK) => set({ topK }),
  setResults: (results, lastQuery) => set({ results, lastQuery }),
  clearResults: () => set({ results: [], lastQuery: '' }),
}))
