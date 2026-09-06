export type SearchSource = "bm25" | "vector";

export type SearchWarning =
  | "BM25_SEARCH_FAILED"
  | "VECTOR_SEARCH_FAILED"
  | "LLM_RERANK_FAILED"
  | "SUMMARIZATION_FAILED";

export interface SearchFilters {
  minYearsExperience?: number;
}

export interface SearchCandidate {
  resumeId: string;
  name?: string;
  role?: string;
  company?: string;
  skills?: string[];
  snippet?: string;
  bm25Score?: number;
  vectorScore?: number;
  sources: SearchSource[];
}

export interface SearchOptions {
  topK?: number;
}

export interface EndToEndSearchOptions {
  bm25TopK?: number;
  vectorTopK?: number;
  rerankTopN?: number;
  finalTopK?: number;
  summarize?: boolean;
  summaryStyle?: "short" | "detailed";
  summaryMaxTokens?: number;
}

export interface EndToEndSearchResult extends SearchCandidate {
  rank: number;
  relevanceScore?: number;
  reason?: string;
  summary?: string;
}

export interface EndToEndSearchExecution {
  results: EndToEndSearchResult[];
  degraded?: boolean;
  warnings?: SearchWarning[];
  timings: {
    embeddingMs: number;
    bm25Ms: number;
    vectorMs: number;
    rerankMs: number;
    summarizeMs: number;
    totalMs: number;
  };
}

export interface HybridSearchResult {
  bm25: SearchCandidate[];
  vector: SearchCandidate[];
  degraded?: boolean;
  warnings?: SearchWarning[];
  timings: {
    bm25Ms: number;
    embeddingMs: number;
    vectorMs: number;
  };
}

export interface Bm25SearchResult extends SearchCandidate {
  matchedSkills: string[];
}
