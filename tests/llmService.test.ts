import { env } from "../src/config/env";
import { LLMService } from "../src/modules/retrieval/services/LLMService";
import { SearchCandidate } from "../src/modules/retrieval/types/retrieval.types";

const candidate: SearchCandidate = {
  resumeId: "resume-1",
  name: "Candidate Name",
  snippet: "RAG and DeepEval experience",
  sources: ["bm25"],
};

describe("LLMService", () => {
  const originalApiKey = env.groqApiKey;

  afterEach(() => {
    env.groqApiKey = originalApiKey;
    jest.restoreAllMocks();
  });

  it("validates rerank output and restricts IDs to supplied candidates", async () => {
    env.groqApiKey = "test-key";
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ results: [
            { resumeId: "resume-1", rank: 1, relevanceScore: 1.2, reason: "Strong fit" },
          ] }) } }],
        }),
        { status: 200 },
      ),
    );

    await expect(new LLMService().rerankCandidates("RAG", [candidate], 10)).resolves.toEqual([
      { resumeId: "resume-1", rank: 1, relevanceScore: 1, reason: "Strong fit" },
    ]);
  });

  it("rejects hallucinated candidate IDs", async () => {
    env.groqApiKey = "test-key";
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ results: [
        { resumeId: "unknown", rank: 1, relevanceScore: 0.9, reason: "Fit" },
      ] }) } }] }), { status: 200 }),
    );

    await expect(new LLMService().rerankCandidates("RAG", [candidate], 10)).rejects.toThrow(
      "outside the supplied set",
    );
  });

  it("returns a validated grounded summary", async () => {
    env.groqApiKey = "test-key";
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '{"summary":"Strong RAG fit."}' } }] }), { status: 200 }),
    );

    await expect(
      new LLMService().summarizeCandidateFit("RAG role", candidate, {
        style: "short",
        maxTokens: 150,
      }),
    ).resolves.toBe("Strong RAG fit.");
  });

  it("requires a Groq API key", async () => {
    env.groqApiKey = undefined;

    await expect(new LLMService().rerankCandidates("RAG", [candidate], 1)).rejects.toThrow(
      "GROQ_API_KEY is not configured",
    );
  });
});
