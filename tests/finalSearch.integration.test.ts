import request from "supertest";
import { app } from "../src/app";
import { SearchService } from "../src/modules/retrieval/services/SearchService";

const executeMock = jest.spyOn(SearchService.prototype, "executeEndToEndSearch");

describe("final search API", () => {
  afterEach(() => executeMock.mockReset());

  it("returns ranked results and component timings", async () => {
    executeMock.mockResolvedValue({
      results: [
        {
          resumeId: "resume-1",
          rank: 1,
          name: "Candidate Name",
          role: "Test Architect",
          skills: ["RAG"],
          sources: ["bm25", "vector"],
          relevanceScore: 0.96,
          reason: "Strong match",
          summary: "Strong fit",
        },
      ],
      timings: {
        embeddingMs: 10,
        bm25Ms: 20,
        vectorMs: 30,
        rerankMs: 40,
        summarizeMs: 50,
        totalMs: 150,
      },
    });

    const response = await request(app).post("/v1/search").send({
      query: "Senior agentic QA architect with RAG",
      filters: { minYearsExperience: 10 },
      options: {
        bm25TopK: 20,
        vectorTopK: 20,
        rerankTopN: 10,
        finalTopK: 5,
        summarize: true,
        summaryStyle: "short",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      query: "Senior agentic QA architect with RAG",
      degraded: false,
      warnings: [],
      results: [{ resumeId: "resume-1", rank: 1 }],
      timings: { embeddingMs: 10, rerankMs: 40, summarizeMs: 50 },
    });
  });

  it("rejects an empty query", async () => {
    const response = await request(app).post("/v1/search").send({ query: "" });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_SEARCH_REQUEST");
  });

  it("rejects an oversized query", async () => {
    const response = await request(app)
      .post("/v1/search")
      .send({ query: "x".repeat(4001) });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_SEARCH_REQUEST");
  });

  it("maps search service failures to a controlled response", async () => {
    executeMock.mockRejectedValue(new Error("Search unavailable"));

    const response = await request(app)
      .post("/v1/search")
      .send({ query: "QA architect" });

    expect(response.status).toBe(503);
    expect(response.body.errorCode).toBe("SEARCH_FAILED");
  });
});
