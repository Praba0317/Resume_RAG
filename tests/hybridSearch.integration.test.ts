import request from "supertest";
import { app } from "../src/app";
import { SearchService } from "../src/modules/retrieval/services/SearchService";

jest.spyOn(SearchService.prototype, "hybridSearch").mockResolvedValue({
  bm25: [],
  vector: [],
  timings: { bm25Ms: 1, embeddingMs: 2, vectorMs: 3 },
});

describe("hybrid search API", () => {
  it("rejects an empty query", async () => {
    const response = await request(app).post("/v1/search/hybrid").send({ query: " " });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_SEARCH_QUERY");
  });

  it("returns independent BM25 and vector result lists", async () => {
    const response = await request(app)
      .post("/v1/search/hybrid")
      .send({ query: "RAG architect", topK: 20 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      mode: "hybrid-debug",
      query: "RAG architect",
      bm25: [],
      vector: [],
      timings: { bm25Ms: 1, embeddingMs: 2, vectorMs: 3 },
    });
  });
});
