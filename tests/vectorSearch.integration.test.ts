import request from "supertest";
import { app } from "../src/app";
import { SearchService } from "../src/modules/retrieval/services/SearchService";

jest.spyOn(SearchService.prototype, "vectorSearch").mockResolvedValue([]);

describe("vector search API validation", () => {
  it("rejects an empty query", async () => {
    const response = await request(app).post("/v1/search/vector").send({ query: " " });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_SEARCH_QUERY");
  });

  it("returns the normalized vector response shape", async () => {
    const response = await request(app)
      .post("/v1/search/vector")
      .send({ query: "RAG architect", topK: 20 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      mode: "vector",
      query: "RAG architect",
      count: 0,
      results: [],
    });
  });
});
