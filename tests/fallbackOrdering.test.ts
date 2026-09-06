import { ResumeRepository } from "../src/modules/retrieval/repositories/ResumeRepository";
import { LLMService } from "../src/modules/retrieval/services/LLMService";
import { SearchService } from "../src/modules/retrieval/services/SearchService";
import { SearchCandidate } from "../src/modules/retrieval/types/retrieval.types";

function candidate(resumeId: string, source: "bm25" | "vector"): SearchCandidate {
  return {
    resumeId,
    name: `Candidate ${resumeId}`,
    snippet: `${source} candidate`,
    sources: [source],
  };
}

describe("retrieval fallback behavior", () => {
  it("uses vector results when BM25 fails", async () => {
    const repository = {
      searchBm25: jest.fn().mockRejectedValue(new Error("BM25 unavailable")),
      searchVector: jest.fn().mockResolvedValue([
        { _id: "resume-1", rawText: "vector candidate" },
      ]),
    } as unknown as ResumeRepository;
    const embeddingService = {
      generateResumeEmbedding: jest.fn().mockResolvedValue([0.1]),
    };

    const result = await new SearchService(
      repository,
      embeddingService as never,
    ).hybridSearch("QA architect");

    expect(result.bm25).toEqual([]);
    expect(result.vector).toHaveLength(1);
    expect(result.warnings).toEqual(["BM25_SEARCH_FAILED"]);
    expect(result.degraded).toBe(true);
  });

  it("uses BM25 results when vector search fails", async () => {
    const repository = {
      searchBm25: jest.fn().mockResolvedValue([
        { _id: "resume-1", rawText: "BM25 candidate" },
      ]),
      searchVector: jest.fn().mockRejectedValue(new Error("Vector unavailable")),
    } as unknown as ResumeRepository;
    const embeddingService = {
      generateResumeEmbedding: jest.fn().mockResolvedValue([0.1]),
    };

    const result = await new SearchService(
      repository,
      embeddingService as never,
    ).hybridSearch("QA architect");

    expect(result.bm25).toHaveLength(1);
    expect(result.vector).toEqual([]);
    expect(result.warnings).toEqual(["VECTOR_SEARCH_FAILED"]);
    expect(result.degraded).toBe(true);
  });

  it("throws SEARCH_UNAVAILABLE when both retrieval paths fail", async () => {
    const repository = {
      searchBm25: jest.fn().mockRejectedValue(new Error("BM25 unavailable")),
      searchVector: jest.fn(),
    } as unknown as ResumeRepository;
    const embeddingService = {
      generateResumeEmbedding: jest
        .fn()
        .mockRejectedValue(new Error("Embedding unavailable")),
    };

    await expect(
      new SearchService(repository, embeddingService as never).hybridSearch(
        "QA architect",
      ),
    ).rejects.toMatchObject({ code: "SEARCH_UNAVAILABLE" });
  });

  it("falls back to retrieval order when reranking fails", async () => {
    const service = new SearchService(
      undefined,
      undefined,
      {
        rerankCandidates: jest.fn().mockRejectedValue(new Error("LLM unavailable")),
      } as unknown as LLMService,
    );
    jest.spyOn(service, "hybridSearch").mockResolvedValue({
      bm25: [candidate("resume-1", "bm25")],
      vector: [candidate("resume-2", "vector")],
      timings: { bm25Ms: 1, embeddingMs: 2, vectorMs: 3 },
    });

    const result = await service.executeEndToEndSearch("QA architect");

    expect(result.results.map((item) => item.resumeId)).toEqual([
      "resume-1",
      "resume-2",
    ]);
    expect(result.warnings).toEqual(["LLM_RERANK_FAILED"]);
    expect(result.degraded).toBe(true);
  });

  it("keeps ranked results when summarization fails", async () => {
    const service = new SearchService(
      undefined,
      undefined,
      {
        rerankCandidates: jest.fn().mockResolvedValue([
          {
            resumeId: "resume-1",
            rank: 1,
            relevanceScore: 0.9,
            reason: "Strong match",
          },
        ]),
        summarizeCandidateFit: jest
          .fn()
          .mockRejectedValue(new Error("LLM unavailable")),
      } as unknown as LLMService,
    );
    jest.spyOn(service, "hybridSearch").mockResolvedValue({
      bm25: [candidate("resume-1", "bm25")],
      vector: [],
      timings: { bm25Ms: 1, embeddingMs: 2, vectorMs: 3 },
    });

    const result = await service.executeEndToEndSearch("QA architect", {}, {
      summarize: true,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].summary).toBeUndefined();
    expect(result.warnings).toEqual(["SUMMARIZATION_FAILED"]);
    expect(result.degraded).toBe(true);
  });
});