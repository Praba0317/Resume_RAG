export type SearchMode = 'vector' | 'bm25' | 'hybrid'

export interface SearchRequest {
  query: string
  topK: number
  mode: SearchMode
  filters?: { minYearsExperience?: number }
  weights?: { bm25: number; vector: number }
}

export interface SearchResult {
  resumeId: string
  name?: string
  role?: string
  company?: string
  skills?: string[]
  snippet?: string
  sources: ('bm25' | 'vector')[]
  bm25Score?: number
  vectorScore?: number
  rank?: number
  relevanceScore?: number
  reason?: string
  summary?: string
}

export interface SearchResponse {
  query: string
  results: SearchResult[]
  degraded: boolean
  warnings: string[]
  timings: { totalMs: number; embeddingMs?: number; bm25Ms?: number; vectorMs?: number; rerankMs?: number; summarizeMs?: number }
}
