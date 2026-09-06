import { ObjectId } from "mongodb";
import { getDatabase } from "../../../config/database";
import { env } from "../../../config/env";
import { ParsedResume } from "../types/ingestion.types";

export interface ResumeDocumentInput {
  fileName: string;
  rawText: string;
  resume: ParsedResume;
  embedding: number[];
}

export class ResumeIngestionRepository {
  async insertResume(input: ResumeDocumentInput): Promise<string> {
    const database = await getDatabase();
    const now = new Date();
    const document = {
      _id: new ObjectId(),
      fileName: input.fileName,
      rawText: input.rawText,
      ...input.resume,
      embedding: input.embedding,
      embeddingModel: env.mistralEmbedModel,
      embeddingDimension: input.embedding.length,
      createdAt: now,
      updatedAt: now,
    };

    await database.collection(env.collectionName).insertOne(document);
    return document._id.toHexString();
  }
}
