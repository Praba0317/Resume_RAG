import dotenv from "dotenv";

dotenv.config();

function getPort(): number {
  const port = Number(process.env.PORT ?? 3000);
  return Number.isInteger(port) && port > 0 ? port : 3000;
}

function getEmbeddingDimension(): number {
  const dimension = Number(process.env.EMBEDDING_DIMENSION ?? 1024);
  return Number.isInteger(dimension) && dimension > 0 ? dimension : 1024;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: getPort(),
  mongodbUri: process.env.MONGODB_URI,
  mongodbDbName: process.env.MONGODB_DB_NAME ?? "resume_rag",
  collectionName: process.env.COLLECTION_NAME ?? "resumes",
  useLlmParser: process.env.USE_LLM_PARSER === "true",
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel:
    process.env.GROQ_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct",
  mistralApiKey: process.env.MISTRAL_API_KEY,
  mistralEmbedModel: process.env.MISTRAL_EMBED_MODEL ?? "mistral-embed",
  embeddingDimension: getEmbeddingDimension(),
  atlasSearchIndex: process.env.ATLAS_SEARCH_INDEX ?? "default",
  atlasVectorIndex: process.env.ATLAS_VECTOR_INDEX ?? "resume_vector_index",
};
