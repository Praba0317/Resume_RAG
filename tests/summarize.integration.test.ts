import request from "supertest";
import { app } from "../src/app";
import { env } from "../src/config/env";
import { LLMService } from "../src/modules/retrieval/services/LLMService";

const summarizeMock = jest.spyOn(LLMService.prototype, "summarizeCandidateFit");

describe("candidate summarization API", () => {
  afterEach(() => summarizeMock.mockReset());

  it("returns a grounded candidate summary", async () => {
    summarizeMock.mockResolvedValue("Strong fit for a senior QA architecture role.");

    const response = await request(app).post("/v1/search/summarize").send({
      query: "Senior QA architect with GenAI RAG and evaluation experience",
      candidate: {
        resumeId: "resume-1",
        snippet: "13+ years, RAG, DeepEval and MCP experience",
      },
      style: "short",
      maxTokens: 150,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      resumeId: "resume-1",
      summary: "Strong fit for a senior QA architecture role.",
      model: env.groqModel,
    });
  });

  it("rejects invalid style and token values", async () => {
    const response = await request(app).post("/v1/search/summarize").send({
      query: "QA architect",
      candidate: { resumeId: "resume-1", snippet: "QA architect" },
      style: "medium",
      maxTokens: 0,
    });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe("INVALID_SUMMARY_REQUEST");
  });

  it("maps Groq failures to a controlled response", async () => {
    summarizeMock.mockRejectedValue(new Error("Groq unavailable"));

    const response = await request(app).post("/v1/search/summarize").send({
      query: "QA architect",
      candidate: { resumeId: "resume-1", snippet: "QA architect" },
    });

    expect(response.status).toBe(502);
    expect(response.body.errorCode).toBe("SUMMARY_FAILED");
  });
});
