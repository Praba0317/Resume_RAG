import { env } from "../../../config/env";

export interface ResumeEmbeddingInput {
  name?: string;
  role?: string;
  skills?: string[];
  company?: string;
  experienceSummary?: string;
  rawText: string;
}

export class EmbeddingService {
  async generateResumeEmbedding(input: ResumeEmbeddingInput): Promise<number[]> {
    if (!env.mistralApiKey) {
      throw new Error("MISTRAL_API_KEY is not configured");
    }

    const embeddingText = [
      input.name,
      input.role,
      input.skills?.join(", "),
      input.company,
      input.experienceSummary,
      input.rawText,
    ]
      .filter((value) => value?.trim())
      .join("\n");

    const response = await fetch("https://api.mistral.ai/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.mistralEmbedModel,
        input: [embeddingText],
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral embedding request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{ embedding?: unknown }>;
    };
    const embedding = payload.data?.[0]?.embedding;
    if (
      !Array.isArray(embedding) ||
      !embedding.every((value) => typeof value === "number") ||
      embedding.length !== env.embeddingDimension
    ) {
      throw new Error("Mistral returned an invalid embedding vector");
    }

    return embedding;
  }
}
