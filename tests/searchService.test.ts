import { ResumeRepository } from "../src/modules/retrieval/repositories/ResumeRepository";
import { SearchService } from "../src/modules/retrieval/services/SearchService";

describe("SearchService BM25", () => {
  it("normalizes Atlas Search results with BM25 scores", async () => {
    const repository = {
      searchBm25: jest.fn().mockResolvedValue([
        {
          _id: "resume-1",
          name: "Candidate Name",
          skills: ["RAG"],
          rawText: "RAG experience",
          searchScore: 8.41,
        },
      ]),
    } as unknown as ResumeRepository;

    const results = await new SearchService(repository).bm25Search("RAG", {}, { topK: 20 });

    expect(results).toEqual([
      expect.objectContaining({
        resumeId: "resume-1",
        bm25Score: 8.41,
        sources: ["bm25"],
      }),
    ]);
    expect(repository.searchBm25).toHaveBeenCalledWith("RAG", {}, 20);
  });
});
