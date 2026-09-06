import { Collection } from "mongodb";
import { env } from "../src/config/env";
import { ResumeRepository } from "../src/modules/retrieval/repositories/ResumeRepository";
import { SearchService } from "../src/modules/retrieval/services/SearchService";

describe("vector search", () => {
  afterEach(() => jest.restoreAllMocks());

  it("builds an Atlas vector pipeline with the configured index and filter", async () => {
    const toArray = jest.fn().mockResolvedValue([]);
    const aggregate = jest.fn().mockReturnValue({ toArray });
    jest
      .spyOn(ResumeRepository.prototype, "getCollection")
      .mockResolvedValue({ aggregate } as unknown as Collection);

    await new ResumeRepository().searchVector(
      Array.from({ length: env.embeddingDimension }, () => 0.1),
      { minYearsExperience: 10 },
      20,
    );

    const pipeline = aggregate.mock.calls[0][0];
    expect(pipeline[0].$vectorSearch).toMatchObject({
      index: env.atlasVectorIndex,
      path: "embedding",
      limit: 20,
      filter: {
        totalExperience: { $gte: 10 },
      },
    });
    expect(pipeline[1].$project.embedding).toBe(0);
  });

  it("reuses the embedding service and normalizes vector candidates", async () => {
    const repository = {
      searchVector: jest.fn().mockResolvedValue([
        {
          _id: "resume-1",
          name: "Candidate Name",
          rawText: "RAG experience",
          searchScore: 0.88,
        },
      ]),
    } as unknown as ResumeRepository;
    const embeddingService = {
      generateResumeEmbedding: jest.fn().mockResolvedValue([0.1, 0.2]),
    };

    const results = await new SearchService(
      repository,
      embeddingService as never,
    ).vectorSearch("RAG architect", {}, { topK: 5 });

    expect(embeddingService.generateResumeEmbedding).toHaveBeenCalledWith({
      rawText: "RAG architect",
    });
    expect(repository.searchVector).toHaveBeenCalledWith([0.1, 0.2], {}, 5);
    expect(results[0]).toMatchObject({
      resumeId: "resume-1",
      vectorScore: 0.88,
      sources: ["vector"],
    });
  });
});
