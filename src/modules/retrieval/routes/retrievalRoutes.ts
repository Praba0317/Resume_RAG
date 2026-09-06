import { Router } from "express";
import { createQueryEmbedding } from "../controllers/embeddingController";
import {
	bm25Search,
	hybridSearch,
	vectorSearch,
} from "../controllers/retrievalController";
import {
	rerankCandidates,
	summarizeCandidate,
} from "../controllers/retrievalController";
import {
	readiness,
	finalSearch,
} from "../controllers/retrievalController";

export const retrievalRoutes = Router();

retrievalRoutes.get("/search/readiness", readiness);
retrievalRoutes.post("/embeddings", createQueryEmbedding);
retrievalRoutes.post("/search/bm25", bm25Search);
retrievalRoutes.post("/search/vector", vectorSearch);
retrievalRoutes.post("/search/hybrid", hybridSearch);
retrievalRoutes.post("/search/rerank", rerankCandidates);
retrievalRoutes.post("/search/summarize", summarizeCandidate);
retrievalRoutes.post("/search", finalSearch);
