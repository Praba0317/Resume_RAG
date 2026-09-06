import { env } from "../../../config/env";
import { ParsedResume } from "../types/ingestion.types";

function parseJsonContent(content: string): unknown {
  const withoutFence = content.replace(/^```(?:json)?\s*|\s*```$/gi, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  return JSON.parse(
    start >= 0 && end > start
      ? withoutFence.slice(start, end + 1)
      : withoutFence,
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
    (resume.totalExperience === undefined ||
      typeof resume.totalExperience === "number") &&
    (resume.relevantExperience === undefined ||
      typeof resume.relevantExperience === "number")
  );
}

export class LLMResumeParser {
  async parseResume(rawText: string): Promise<ParsedResume> {
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
        messages: [
          {
            role: "system",
            content:
              "Extract only evidence-supported resume fields. Return one JSON object with a skills string array. Do not invent missing values.",
          },
          { role: "user", content: rawText },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM parser request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("LLM parser returned no content");
    }

    const parsed = parseJsonContent(content);
    if (!isParsedResume(parsed)) {
      throw new Error("LLM parser returned an invalid resume schema");
    }

    return parsed;
  }
}
