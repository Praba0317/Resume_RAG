import { ResumeRepository } from "../repositories/ResumeRepository";
import {
  SearchCandidate,
  SearchFilters,
  HybridSearchResult,
  SearchOptions,
} from "../types/retrieval.types";
import { mapResumeToCandidate } from "../utils/candidateMapper";
import { EmbeddingService } from "../../ingestion/services/EmbeddingService";
import { deduplicateCandidates } from "../utils/deduplicate";
import { LLMService, RerankedCandidate } from "./LLMService";
import {
  EndToEndSearchOptions,
  EndToEndSearchExecution,
  EndToEndSearchResult,
  SearchWarning,
} from "../types/retrieval.types";

export class SearchService {
  constructor(
    private readonly resumeRepository = new ResumeRepository(),
    private readonly embeddingService = new EmbeddingService(),
    private readonly llmService = new LLMService(),
  ) {}

  async bm25Search(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {},
  ): Promise<SearchCandidate[]> {
    const resumes = await this.resumeRepository.searchBm25(
      query,
      filters,
      options.topK ?? 20,
    );
    return resumes.map((resume) =>
      mapResumeToCandidate(resume, "bm25", Number(resume.searchScore ?? 0)),
    );
  }

  async vectorSearch(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {},
  ): Promise<SearchCandidate[]> {
    const queryVector = await this.embeddingService.generateResumeEmbedding({
      rawText: query,
    });
    const resumes = await this.resumeRepository.searchVector(
      queryVector,
      filters,
      options.topK ?? 20,
    );
    return resumes.map((resume) =>
      mapResumeToCandidate(resume, "vector", Number(resume.searchScore ?? 0)),
    );
  }

  async hybridSearch(
    query: string,
    filters: SearchFilters = {},
    options: SearchOptions = {},
  ): Promise<HybridSearchResult> {
    const topK = options.topK ?? 20;
    const bm25StartedAt = Date.now();
    const bm25Promise = this.bm25Search(query, filters, { topK }).then((results) => ({
      results,
      elapsedMs: Date.now() - bm25StartedAt,
    }));
    const embeddingStartedAt = Date.now();
    const embeddingPromise = this.embeddingService.generateResumeEmbedding({
      rawText: query,
    });
    const [bm25, embedding] = await Promise.allSettled([bm25Promise, embeddingPromise]);
    const embeddingMs = Date.now() - embeddingStartedAt;

    const warnings: SearchWarning[] = [];
    const bm25Results = bm25.status === "fulfilled" ? bm25.value : { results: [], elapsedMs: 0 };
    if (bm25.status === "rejected") {
      warnings.push("BM25_SEARCH_FAILED");
    }

    let vector: SearchCandidate[] = [];
    let vectorMs = 0;
    if (embedding.status === "fulfilled") {
      const vectorStartedAt = Date.now();
      try {
        const resumes = await this.resumeRepository.searchVector(
          embedding.value,
          filters,
          topK,
        );
        vector = resumes.map((resume) =>
          mapResumeToCandidate(resume, "vector", Number(resume.searchScore ?? 0)),
        );
      } catch (_error) {
        warnings.push("VECTOR_SEARCH_FAILED");
      }
      vectorMs = Date.now() - vectorStartedAt;
    } else {
      warnings.push("VECTOR_SEARCH_FAILED");
    }

    if (bm25Results.results.length === 0 && vector.length === 0 && warnings.length === 2) {
      const error = new Error("No retrieval strategy is currently available");
      (error as Error & { code?: string }).code = "SEARCH_UNAVAILABLE";
      throw error;
    }

    return {
      bm25: bm25Results.results,
      vector,
      degraded: warnings.length > 0,
      warnings,
      timings: {
        bm25Ms: bm25Results.elapsedMs,
        embeddingMs,
        vectorMs,
      },
    };
  }

  mergeCandidates(
    bm25Candidates: SearchCandidate[],
    vectorCandidates: SearchCandidate[],
  ): SearchCandidate[] {
    return deduplicateCandidates([...bm25Candidates, ...vectorCandidates]);
  }

  async endToEndSearch(
    query: string,
    filters: SearchFilters = {},
    options: EndToEndSearchOptions = {},
  ): Promise<EndToEndSearchResult[]> {
    const execution = await this.executeEndToEndSearch(query, filters, options);
    return execution.results;
  }

  async executeEndToEndSearch(
    query: string,
    filters: SearchFilters = {},
    options: EndToEndSearchOptions = {},
  ): Promise<EndToEndSearchExecution> {
    const totalStartedAt = Date.now();
    const hybrid = await this.hybridSearch(query, filters, {
      topK: Math.max(options.bm25TopK ?? 20, options.vectorTopK ?? 20),
    });
    const mergedCandidates = this.mergeCandidates(hybrid.bm25, hybrid.vector);
    if (mergedCandidates.length === 0) {
      return {
        results: [],
        degraded: hybrid.degraded ?? false,
        warnings: hybrid.warnings ?? [],
        timings: {
          ...hybrid.timings,
          rerankMs: 0,
          summarizeMs: 0,
          totalMs: Date.now() - totalStartedAt,
        },
      };
    }

    const rerankStartedAt = Date.now();
    const rerankTopN = Math.min(
      options.rerankTopN ?? 10,
      mergedCandidates.length,
    );
    let reranked: RerankedCandidate[];
    let degraded = hybrid.degraded ?? false;
    const warnings: SearchWarning[] = [...(hybrid.warnings ?? [])];
    try {
      reranked = await this.llmService.rerankCandidates(
        query,
        mergedCandidates.slice(0, rerankTopN),
        rerankTopN,
      );
    } catch (_error) {
      degraded = true;
      warnings.push("LLM_RERANK_FAILED");
      reranked = mergedCandidates.slice(0, rerankTopN).map((candidate, index) => ({
        resumeId: candidate.resumeId,
        rank: index + 1,
        relevanceScore: 0,
        reason: "Fallback ordering based on retrieval results",
      }));
    }
    const rerankMs = Date.now() - rerankStartedAt;
    const candidatesById = new Map(
      mergedCandidates.map((candidate) => [candidate.resumeId, candidate]),
    );
    const finalTopK = options.finalTopK ?? reranked.length;
    const results: EndToEndSearchResult[] = reranked
      .slice(0, finalTopK)
      .map((ranked: RerankedCandidate) => {
        const candidate = candidatesById.get(ranked.resumeId);
        if (!candidate) {
          throw new Error("Reranker returned an unknown candidate");
        }
        return {
          ...candidate,
          rank: ranked.rank,
          relevanceScore: ranked.relevanceScore,
          reason: ranked.reason,
        };
      });

    let summarizeMs = 0;
    if (options.summarize) {
      const summarizeStartedAt = Date.now();
      const summaryStyle = options.summaryStyle ?? "short";
      const summaryMaxTokens = options.summaryMaxTokens ?? 150;
      await Promise.all(
        results.map(async (result) => {
          try {
            result.summary = await this.llmService.summarizeCandidateFit(
              query,
              result,
              { style: summaryStyle, maxTokens: summaryMaxTokens },
            );
          } catch (_error) {
            degraded = true;
            if (!warnings.includes("SUMMARIZATION_FAILED")) {
              warnings.push("SUMMARIZATION_FAILED");
            }
          }
        }),
      );
      summarizeMs = Date.now() - summarizeStartedAt;
    }

    return {
      results,
      degraded,
      warnings,
      timings: {
        ...hybrid.timings,
        rerankMs,
        summarizeMs,
        totalMs: Date.now() - totalStartedAt,
      },
    };
  }
}
