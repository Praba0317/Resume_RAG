import { ResumeRepository } from "../src/modules/retrieval/repositories/ResumeRepository";
import { SearchService } from "../src/modules/retrieval/services/SearchService";

describe("SearchService hybrid search", () => {
  it("runs BM25 and vector retrieval with separate scores and timings", async () => {
    const repository = {
      searchBm25: jest.fn().mockResolvedValue([
        { _id: "bm25-id", name: "Lexical Candidate", searchScore: 8.4 },
      ]),
      searchVector: jest.fn().mockResolvedValue([
        { _id: "vector-id", name: "Semantic Candidate", searchScore: 0.88 },
      ]),
    } as unknown as ResumeRepository;
    const embeddingService = {
      generateResumeEmbedding: jest.fn().mockResolvedValue([0.1, 0.2]),
    };

    const result = await new SearchService(
      repository,
      embeddingService as never,
    ).hybridSearch("RAG architect", { minYearsExperience: 10 }, { topK: 5 });

    expect(result.bm25[0]).toMatchObject({
      resumeId: "bm25-id",
      bm25Score: 8.4,
      sources: ["bm25"],
    });
    expect(result.vector[0]).toMatchObject({
      resumeId: "vector-id",
      vectorScore: 0.88,
      sources: ["vector"],
    });
    expect(embeddingService.generateResumeEmbedding).toHaveBeenCalledWith({
      rawText: "RAG architect",
    });
    expect(repository.searchVector).toHaveBeenCalledWith(
      [0.1, 0.2],
      { minYearsExperience: 10 },
      5,
    );
    expect(result.timings).toEqual({
      bm25Ms: expect.any(Number),
      embeddingMs: expect.any(Number),
      vectorMs: expect.any(Number),
    });
  });

  it("keeps BM25 and vector calls independent", async () => {
    const calls: string[] = [];
    const repository = {
      searchBm25: jest.fn().mockImplementation(async () => {
        calls.push("bm25-start");
        await Promise.resolve();
        calls.push("bm25-end");
        return [];
      }),
      searchVector: jest.fn().mockResolvedValue([]),
    } as unknown as ResumeRepository;
    const embeddingService = {
      generateResumeEmbedding: jest.fn().mockImplementation(async () => {
        calls.push("embedding-start");
        await Promise.resolve();
        calls.push("embedding-end");
        return [0.1];
      }),
    };

    await new SearchService(repository, embeddingService as never).hybridSearch("query");

    expect(calls.indexOf("bm25-start")).toBeLessThan(calls.indexOf("embedding-end"));
  });
});
