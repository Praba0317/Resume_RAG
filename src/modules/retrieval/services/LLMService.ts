import { env } from "../../../config/env";
import { ParsedResume } from "../../ingestion/types/ingestion.types";
import { SearchCandidate } from "../types/retrieval.types";

export interface RerankedCandidate {
  resumeId: string;
  rank: number;
  relevanceScore: number;
  reason: string;
}

function parseJsonContent(content: string): unknown {
  const withoutFence = content.replace(/^```(?:json)?\s*|\s*```$/gi, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  return JSON.parse(
    start >= 0 && end > start ? withoutFence.slice(start, end + 1) : withoutFence,
  );
}

function isRerankResult(value: unknown): value is { results: RerankedCandidate[] } {
  if (!value || typeof value !== "object" || !Array.isArray((value as any).results)) {
    return false;
  }
  return (value as any).results.every(
    (item: any) =>
      typeof item?.resumeId === "string" &&
      Number.isInteger(item?.rank) &&
      typeof item?.relevanceScore === "number" &&
      typeof item?.reason === "string",
  );
}

function isParsedResume(value: unknown): value is ParsedResume {
  if (!value || typeof value !== "object") {
    return false;
  }
  const resume = value as Record<string, unknown>;
  return (
    Array.isArray(resume.skills) &&
    resume.skills.every((skill) => typeof skill === "string") &&
    (resume.totalExperience === undefined || typeof resume.totalExperience === "number") &&
    (resume.relevantExperience === undefined ||
      typeof resume.relevantExperience === "number")
  );
}

export class LLMService {
  private async complete(system: string, user: string, maxTokens = 600): Promise<string> {
    if (!env.groqApiKey) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.groqModel,
        temperature: 0,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq request failed with status ${response.status}`);
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Groq returned no content");
    }
    return content;
  }

  async rerankCandidates(
    query: string,
    candidates: SearchCandidate[],
    topK: number,
  ): Promise<RerankedCandidate[]> {
    const limitedCandidates = candidates.slice(0, Math.max(1, topK));
    const parsed = parseJsonContent(
      await this.complete(
        "Rank only supplied candidates. Return JSON {results:[{resumeId,rank,relevanceScore,reason}]}. Never invent IDs.",
        JSON.stringify({ query, candidates: limitedCandidates }),
      ),
    );
    if (!isRerankResult(parsed)) {
      throw new Error("Groq returned an invalid rerank schema");
    }
    const allowedIds = new Set(limitedCandidates.map((candidate) => candidate.resumeId));
    const results = parsed.results
      .filter((result) => allowedIds.has(result.resumeId))
      .slice(0, topK)
      .map((result, index) => ({
        ...result,
        rank: index + 1,
        relevanceScore: Math.max(0, Math.min(1, result.relevanceScore)),
      }));
    if (results.length !== parsed.results.length || results.length === 0) {
      throw new Error("Groq returned candidate IDs outside the supplied set");
    }
    return results;
  }

  async summarizeCandidateFit(
    query: string,
    candidate: SearchCandidate,
    options: { style: "short" | "detailed"; maxTokens: number },
  ): Promise<string> {
    if (!Number.isInteger(options.maxTokens) || options.maxTokens < 1) {
      throw new Error("maxTokens must be a positive integer");
    }
    const parsed = parseJsonContent(
      await this.complete(
        `Summarize fit only from supplied data in ${options.style} style. Return JSON {summary:string}.`,
        JSON.stringify({ query, candidate }),
        options.maxTokens,
      ),
    ) as { summary?: unknown };
    if (typeof parsed.summary !== "string" || !parsed.summary.trim()) {
      throw new Error("Groq returned an invalid summary schema");
    }
    return parsed.summary.trim();
  }

  async extractMetadata(rawText: string): Promise<ParsedResume> {
    const parsed = parseJsonContent(
      await this.complete(
        "Extract only evidence-supported resume metadata. Return ParsedResume JSON with skills as a string array. Do not invent values.",
        rawText,
      ),
    );
    if (!isParsedResume(parsed)) {
      throw new Error("Groq returned an invalid metadata schema");
    }
    return parsed;
  }
}
