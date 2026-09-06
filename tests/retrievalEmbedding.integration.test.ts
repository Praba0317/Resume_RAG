import request from "supertest";
import { app } from "../src/app";
import { EmbeddingService } from "../src/modules/ingestion/services/EmbeddingService";
import { env } from "../src/config/env";

jest.spyOn(EmbeddingService.prototype, "generateResumeEmbedding").mockResolvedValue(
  Array.from({ length: 1024 }, () => 0.01),
);

describe("query embedding API", () => {
  it("generates a query embedding with the configured model", async () => {
    const response = await request(app).post("/v1/embeddings").send({
      model: "mistral-embed",
      input: "senior agentic QA architect with RAG, DeepEval and MCP experience",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      model: env.mistralEmbedModel,
      dimension: 1024,
    });
    expect(response.body.embedding).toHaveLength(1024);
  });

  it("rejects an empty query", async () => {
    const response = await request(app).post("/v1/embeddings").send({ input: " " });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_EMBEDDING_INPUT");
  });

  it("rejects an unsupported model", async () => {
    const response = await request(app).post("/v1/embeddings").send({
      model: "other-model",
      input: "QA architect",
    });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("UNSUPPORTED_EMBEDDING_MODEL");
  });

  it("rejects an oversized query", async () => {
    const response = await request(app)
      .post("/v1/embeddings")
      .send({ input: "x".repeat(4001) });

    expect(response.status).toBe(413);
    expect(response.body.errorCode).toBe("EMBEDDING_INPUT_TOO_LARGE");
  });
});
