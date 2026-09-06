import { getDatabase } from "../../../config/database";
import { env } from "../../../config/env";

export interface RetrievalReadiness {
  ready: boolean;
  collection: string;
  resumeCount: number;
  resumesWithEmbedding: number;
  embeddingModel: string;
  embeddingDimension: number;
  reason?: string;
}

export class RetrievalValidationService {
  async checkReadiness(): Promise<RetrievalReadiness> {
    const database = await getDatabase();
    const collection = database.collection(env.collectionName);
    const resumeCount = await collection.countDocuments();
    const resumesWithEmbedding = await collection.countDocuments({
      embedding: {
        $exists: true,
        $type: "array",
        $not: { $size: 0 },
      },
      embeddingModel: env.mistralEmbedModel,
      embeddingDimension: env.embeddingDimension,
    });
    const ready = resumeCount > 0 && resumesWithEmbedding > 0;

    return {
      ready,
      collection: env.collectionName,
      resumeCount,
      resumesWithEmbedding,
      embeddingModel: env.mistralEmbedModel,
      embeddingDimension: env.embeddingDimension,
      ...(ready
        ? {}
        : { reason: "No ingested resume embeddings are available" }),
    };
  }
}
