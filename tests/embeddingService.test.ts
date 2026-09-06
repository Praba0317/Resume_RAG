import { EmbeddingService } from "../src/modules/ingestion/services/EmbeddingService";
import { env } from "../src/config/env";

describe("EmbeddingService", () => {
  const originalApiKey = env.mistralApiKey;
  const originalDimension = env.embeddingDimension;

  afterEach(() => {
    env.mistralApiKey = originalApiKey;
    env.embeddingDimension = originalDimension;
    jest.restoreAllMocks();
  });

  it("validates and returns a Mistral embedding vector", async () => {
    const vector = Array.from({ length: 1024 }, (_, index) => index / 1024);
    env.mistralApiKey = "test-key";
    env.embeddingDimension = 1024;

    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [{ embedding: vector }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const embedding = await new EmbeddingService().generateResumeEmbedding({
      name: "Candidate Name",
      role: "Test Architect",
      skills: ["RAG"],
      rawText: "Resume text",
    });

    expect(embedding).toHaveLength(1024);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mistral.ai/v1/embeddings",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Candidate Name"),
      }),
    );
  });

  it("rejects vectors with the wrong dimension", async () => {
    env.mistralApiKey = "test-key";
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: [{ embedding: [0.1] }] }), {
        status: 200,
      }),
    );

    await expect(
      new EmbeddingService().generateResumeEmbedding({ rawText: "Resume text" }),
    ).rejects.toThrow("invalid embedding vector");
  });
});
