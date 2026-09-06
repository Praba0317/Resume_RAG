import { SearchService } from "../src/modules/retrieval/services/SearchService";
import { SearchCandidate } from "../src/modules/retrieval/types/retrieval.types";

const candidate = (overrides: Partial<SearchCandidate>): SearchCandidate => ({
  resumeId: "resume-1",
  sources: ["bm25"],
  ...overrides,
});

describe("SearchService candidate merge", () => {
  it("deduplicates by resumeId and preserves both search sources and scores", () => {
    const merged = new SearchService().mergeCandidates(
      [
        candidate({
          name: "Candidate Name",
          skills: ["RAG"],
          bm25Score: 8.4,
        }),
      ],
      [
        candidate({
          role: "Test Architect",
          skills: ["DeepEval"],
          vectorScore: 0.88,
          sources: ["vector"],
        }),
      ],
    );

    expect(merged).toEqual([
      {
        resumeId: "resume-1",
        name: "Candidate Name",
        role: "Test Architect",
        skills: ["RAG", "DeepEval"],
        bm25Score: 8.4,
        vectorScore: 0.88,
        sources: ["bm25", "vector"],
      },
    ]);
  });

  it("keeps distinct candidates in their original order", () => {
    const merged = new SearchService().mergeCandidates(
      [candidate({ resumeId: "a" }), candidate({ resumeId: "b" })],
      [candidate({ resumeId: "c", sources: ["vector"] })],
    );

    expect(merged.map((item) => item.resumeId)).toEqual(["a", "b", "c"]);
  });
});
