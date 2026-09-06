import { RequestHandler } from "express";
import { RetrievalValidationService } from "../services/RetrievalValidationService";
import { SearchService } from "../services/SearchService";
import { LLMService } from "../services/LLMService";
import { env } from "../../../config/env";

const retrievalValidationService = new RetrievalValidationService();
const searchService = new SearchService();
const llmService = new LLMService();
const MAX_QUERY_LENGTH = 4000;
const MAX_CANDIDATES = 100;
const MAX_SNIPPET_LENGTH = 12000;

function parseSearchRequest(body: any): {
  query: string;
  topK: number;
  minYearsExperience?: number;
} | null {
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const topK = body?.topK ?? 20;
  const minYearsExperience = body?.filters?.minYearsExperience;
  if (
    !query ||
    query.length > MAX_QUERY_LENGTH ||
    !Number.isInteger(topK) ||
    topK < 1 ||
    topK > 100 ||
    (minYearsExperience !== undefined &&
      (!Number.isFinite(minYearsExperience) || minYearsExperience < 0))
  ) {
    return null;
  }
  return { query, topK, minYearsExperience };
}

export const bm25Search: RequestHandler = async (req, res) => {
  const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
  const topK = req.body?.topK ?? 20;
  const minYearsExperience = req.body?.filters?.minYearsExperience;

  if (!query) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_SEARCH_QUERY",
      message: "Search query is required",
    });
    return;
  }

  if (!Number.isInteger(topK) || topK < 1 || topK > 100) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_TOP_K",
      message: "topK must be an integer between 1 and 100",
    });
    return;
  }

  if (
    minYearsExperience !== undefined &&
    (!Number.isFinite(minYearsExperience) || minYearsExperience < 0)
  ) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_SEARCH_FILTERS",
      message: "minYearsExperience must be a non-negative number",
    });
    return;
  }

  try {
    const results = await searchService.bm25Search(
      query,
      minYearsExperience === undefined ? {} : { minYearsExperience },
      { topK },
    );
    res.status(200).json({
      mode: "bm25",
      query,
      count: results.length,
      results: results.map((result) => ({
        ...result,
        score: result.bm25Score,
        matchedSkills: (result.skills ?? []).filter((skill) =>
          query.toLowerCase().includes(skill.toLowerCase()),
        ),
      })),
    });
  } catch (_error) {
    res.status(503).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "BM25_SEARCH_FAILED",
      message: "BM25 search failed",
    });
  }
};

export const vectorSearch: RequestHandler = async (req, res) => {
  const parsed = parseSearchRequest(req.body);
  if (!parsed) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_SEARCH_QUERY",
      message: "Valid query, topK, and filters are required",
    });
    return;
  }

  try {
    const results = await searchService.vectorSearch(
      parsed.query,
      parsed.minYearsExperience === undefined
        ? {}
        : { minYearsExperience: parsed.minYearsExperience },
      { topK: parsed.topK },
    );
    res.status(200).json({
      mode: "vector",
      query: parsed.query,
      count: results.length,
      results: results.map((result) => ({
        ...result,
        vectorScore: result.vectorScore,
      })),
    });
  } catch (_error) {
    res.status(503).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "VECTOR_SEARCH_FAILED",
      message: "Vector search failed",
    });
  }
};

export const hybridSearch: RequestHandler = async (req, res) => {
  const parsed = parseSearchRequest(req.body);
  if (!parsed) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_SEARCH_QUERY",
      message: "Valid query, topK, and filters are required",
    });
    return;
  }

  try {
    const result = await searchService.hybridSearch(
      parsed.query,
      parsed.minYearsExperience === undefined
        ? {}
        : { minYearsExperience: parsed.minYearsExperience },
      { topK: parsed.topK },
    );
    res.status(200).json({
      mode: "hybrid-debug",
      query: parsed.query,
      bm25: result.bm25,
      vector: result.vector,
      timings: result.timings,
    });
  } catch (_error) {
    res.status(503).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "HYBRID_SEARCH_FAILED",
      message: "Hybrid search failed",
    });
  }
};

export const rerankCandidates: RequestHandler = async (req, res) => {
  const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
  const candidates = req.body?.candidates;
  const topK = req.body?.topK ?? 10;

  if (
    !query ||
    query.length > MAX_QUERY_LENGTH ||
    !Array.isArray(candidates) ||
    candidates.length === 0 ||
    candidates.length > MAX_CANDIDATES ||
    !candidates.every(
      (candidate: any) =>
        candidate &&
        typeof candidate.resumeId === "string" &&
        candidate.resumeId.trim() &&
        typeof candidate.snippet === "string" &&
        candidate.snippet.trim() &&
        candidate.snippet.length <= MAX_SNIPPET_LENGTH,
    ) ||
    !Number.isInteger(topK) ||
    topK < 1 ||
    topK > 100
  ) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_RERANK_REQUEST",
      message: "Valid query, candidates, and topK are required",
    });
    return;
  }

  try {
    const results = await llmService.rerankCandidates(query, candidates, topK);
    res.status(200).json({
      results,
      model: env.groqModel,
    });
  } catch (_error) {
    res.status(502).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "RERANK_FAILED",
      message: "Candidate re-ranking failed",
    });
  }
};

export const summarizeCandidate: RequestHandler = async (req, res) => {
  const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
  const candidate = req.body?.candidate;
  const style = req.body?.style ?? "short";
  const maxTokens = req.body?.maxTokens ?? 150;

  if (
    !query ||
    query.length > MAX_QUERY_LENGTH ||
    !candidate ||
    typeof candidate !== "object" ||
    typeof candidate.resumeId !== "string" ||
    !candidate.resumeId.trim() ||
    typeof candidate.snippet !== "string" ||
    !candidate.snippet.trim() ||
    (style !== "short" && style !== "detailed") ||
    !Number.isInteger(maxTokens) ||
    maxTokens < 1 ||
    maxTokens > 2000
  ) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_SUMMARY_REQUEST",
      message: "Valid query, candidate, style, and maxTokens are required",
    });
    return;
  }

  try {
    const summary = await llmService.summarizeCandidateFit(query, candidate, {
      style,
      maxTokens,
    });
    res.status(200).json({
      resumeId: candidate.resumeId,
      summary,
      model: env.groqModel,
    });
  } catch (_error) {
    res.status(502).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "SUMMARY_FAILED",
      message: "Candidate summarization failed",
    });
  }
};

export const finalSearch: RequestHandler = async (req, res) => {
  const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
  const filters = req.body?.filters ?? {};
  const options = req.body?.options ?? {};
  const values = {
    bm25TopK: options.bm25TopK ?? 20,
    vectorTopK: options.vectorTopK ?? 20,
    rerankTopN: options.rerankTopN ?? 10,
    finalTopK: options.finalTopK ?? 5,
    summarize: options.summarize ?? false,
    summaryStyle: options.summaryStyle ?? "short",
    summaryMaxTokens: options.summaryMaxTokens ?? 150,
  };

  const validTopK = (value: unknown): value is number =>
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 100;
  if (
    !query ||
    query.length > 4000 ||
    !validTopK(values.bm25TopK) ||
    !validTopK(values.vectorTopK) ||
    !validTopK(values.rerankTopN) ||
    !validTopK(values.finalTopK) ||
    typeof values.summarize !== "boolean" ||
    !Number.isInteger(values.summaryMaxTokens) ||
    values.summaryMaxTokens < 1 ||
    values.summaryMaxTokens > 2000 ||
    (values.summaryStyle !== "short" && values.summaryStyle !== "detailed") ||
    (filters.minYearsExperience !== undefined &&
      (!Number.isFinite(filters.minYearsExperience) || filters.minYearsExperience < 0))
  ) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_SEARCH_REQUEST",
      message: "Valid query, filters, and options are required",
    });
    return;
  }

  try {
    const execution = await searchService.executeEndToEndSearch(
      query,
      filters,
      values,
    );
    res.locals.retrievalLog = {
      componentTimings: execution.timings,
      warnings: execution.warnings ?? [],
    };
    res.status(200).json({
      query,
      results: execution.results,
      degraded: execution.degraded ?? false,
      warnings: execution.warnings ?? [],
      timings: execution.timings,
    });
  } catch (_error) {
    if ((_error as { code?: string })?.code === "SEARCH_UNAVAILABLE") {
      res.locals.retrievalLog = { errorCode: "SEARCH_UNAVAILABLE" };
      res.status(503).json({
        success: false,
        requestId: res.locals.requestId,
        errorCode: "SEARCH_UNAVAILABLE",
        message: "No retrieval strategy is currently available",
      });
      return;
    }
    res.locals.retrievalLog = { errorCode: "SEARCH_FAILED" };
    res.status(503).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "SEARCH_FAILED",
      message: "Search failed",
    });
  }
};

export const readiness: RequestHandler = async (_req, res) => {
  try {
    const result = await retrievalValidationService.checkReadiness();
    res.status(result.ready ? 200 : 503).json(result);
  } catch (_error) {
    res.status(503).json({
      ready: false,
      reason: "Retrieval database validation failed",
    });
  }
};
