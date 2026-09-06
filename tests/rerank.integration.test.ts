import request from "supertest";
import { app } from "../src/app";
import { env } from "../src/config/env";
import { LLMService } from "../src/modules/retrieval/services/LLMService";

const rerankMock = jest.spyOn(LLMService.prototype, "rerankCandidates");

describe("candidate reranking API", () => {
  afterEach(() => rerankMock.mockReset());

  it("reranks supplied candidates and returns the configured model", async () => {
    rerankMock.mockResolvedValue([
      {
        resumeId: "resume-1",
        rank: 1,
        relevanceScore: 0.96,
        reason: "Strong match",
      },
    ]);

    const response = await request(app).post("/v1/search/rerank").send({
      query: "Need a senior QA architect experienced in RAG, DeepEval and MCP",
      candidates: [
        {
          resumeId: "resume-1",
          snippet: "Test Architect with 13+ years, RAG, DeepEval and MCP experience",
        },
      ],
      topK: 10,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      results: [
        {
          resumeId: "resume-1",
          rank: 1,
          relevanceScore: 0.96,
          reason: "Strong match",
        },
      ],
      model: env.groqModel,
    });
  });

  it("rejects candidates without resume IDs or snippets", async () => {
    const response = await request(app).post("/v1/search/rerank").send({
      query: "QA architect",
      candidates: [{ resumeId: "resume-1" }],
      topK: 1,
    });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_RERANK_REQUEST");
  });

  it("maps Groq failures to a controlled response", async () => {
    rerankMock.mockRejectedValue(new Error("Groq unavailable"));

    const response = await request(app).post("/v1/search/rerank").send({
      query: "QA architect",
      candidates: [{ resumeId: "resume-1", snippet: "QA architect" }],
      topK: 1,
    });

    expect(response.status).toBe(502);
    expect(response.body.errorCode).toBe("RERANK_FAILED");
  });
});
