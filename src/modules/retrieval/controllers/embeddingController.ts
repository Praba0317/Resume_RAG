import { RequestHandler } from "express";
import { env } from "../../../config/env";
import { EmbeddingService } from "../../ingestion/services/EmbeddingService";

const embeddingService = new EmbeddingService();
const maxQueryLength = 4000;

export const createQueryEmbedding: RequestHandler = async (req, res) => {
  const input = req.body ?? {};
  const query = typeof input.input === "string" ? input.input.trim() : "";
  const model = typeof input.model === "string" ? input.model : env.mistralEmbedModel;

  if (!query) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_EMBEDDING_INPUT",
      message: "Embedding input is required",
    });
    return;
  }

  if (query.length > maxQueryLength) {
    res.status(413).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "EMBEDDING_INPUT_TOO_LARGE",
      message: "Embedding input exceeds maximum length",
    });
    return;
  }

  if (model !== env.mistralEmbedModel) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "UNSUPPORTED_EMBEDDING_MODEL",
      message: `Only ${env.mistralEmbedModel} is supported`,
    });
    return;
  }

  try {
    const embedding = await embeddingService.generateResumeEmbedding({
      rawText: query,
    });
    res.status(200).json({
      embedding,
      model: env.mistralEmbedModel,
      dimension: embedding.length,
    });
  } catch (_error) {
    res.status(502).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "EMBEDDING_FAILED",
      message: "Mistral embedding failed",
    });
  }
};
