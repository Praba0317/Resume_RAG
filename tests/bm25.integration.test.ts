import request from "supertest";
import { app } from "../src/app";
import { SearchService } from "../src/modules/retrieval/services/SearchService";

jest.spyOn(SearchService.prototype, "bm25Search").mockResolvedValue([]);

describe("BM25 search API validation", () => {
  it("rejects an empty query", async () => {
    const response = await request(app).post("/v1/search/bm25").send({ query: " " });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_SEARCH_QUERY");
  });

  it("rejects an invalid topK", async () => {
    const response = await request(app)
      .post("/v1/search/bm25")
      .send({ query: "RAG", topK: 0 });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_TOP_K");
  });

  it("returns the normalized BM25 response shape", async () => {
    const response = await request(app)
      .post("/v1/search/bm25")
      .send({ query: "RAG", topK: 20 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      mode: "bm25",
      query: "RAG",
      count: 0,
      results: [],
    });
  });
});
