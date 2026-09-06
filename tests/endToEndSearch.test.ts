import { LLMService } from "../src/modules/retrieval/services/LLMService";
import { SearchService } from "../src/modules/retrieval/services/SearchService";
import { SearchCandidate } from "../src/modules/retrieval/types/retrieval.types";

const candidate = (resumeId: string, source: "bm25" | "vector"): SearchCandidate => ({
  resumeId,
  name: `Candidate ${resumeId}`,
  snippet: `${source} candidate snippet`,
  sources: [source],
  ...(source === "bm25" ? { bm25Score: 8 } : { vectorScore: 0.8 }),
});

describe("SearchService end-to-end search", () => {
  it("merges, reranks, limits, and optionally summarizes candidates", async () => {
    const service = new SearchService(
      {} as never,
      {} as never,
      {
        rerankCandidates: jest.fn().mockResolvedValue([
          {
            resumeId: "resume-2",
            rank: 1,
            relevanceScore: 0.95,
            reason: "Best match",
          },
          {
            resumeId: "resume-1",
            rank: 2,
            relevanceScore: 0.8,
            reason: "Good match",
          },
        ]),
        summarizeCandidateFit: jest.fn().mockResolvedValue("Grounded fit summary"),
      } as unknown as LLMService,
    );
    jest.spyOn(service, "hybridSearch").mockResolvedValue({
      bm25: [candidate("resume-1", "bm25"), candidate("resume-2", "bm25")],
      vector: [candidate("resume-1", "vector")],
      timings: { bm25Ms: 1, embeddingMs: 2, vectorMs: 3 },
    });

    const results = await service.endToEndSearch("RAG architect", {}, {
      rerankTopN: 2,
      finalTopK: 1,
      summarize: true,
      summaryStyle: "short",
      summaryMaxTokens: 150,
    });

    expect(results).toEqual([
      expect.objectContaining({
        resumeId: "resume-2",
        rank: 1,
        relevanceScore: 0.95,
        reason: "Best match",
        summary: "Grounded fit summary",
      }),
    ]);
  });

  it("returns no results without calling the reranker when retrieval is empty", async () => {
    const llmService = { rerankCandidates: jest.fn() } as unknown as LLMService;
    const service = new SearchService({} as never, {} as never, llmService);
    jest.spyOn(service, "hybridSearch").mockResolvedValue({
      bm25: [],
      vector: [],
      timings: { bm25Ms: 1, embeddingMs: 2, vectorMs: 3 },
    });

    await expect(service.endToEndSearch("unknown query")).resolves.toEqual([]);
    expect(llmService.rerankCandidates).not.toHaveBeenCalled();
  });
});
