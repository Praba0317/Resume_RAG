import { Router } from "express";
import { upload } from "../../../config/multerConfig";
import {
	extractResume,
	cleanResume,
	detectResumeSkills,
	parseResume,
	parseResumeWithLlm,
	embedResume,
	storeResume,
	injectResume,
	readiness,
	uploadResume,
} from "../controllers/ingestionController";

export const ingestionRoutes = Router();

ingestionRoutes.get("/resume/health", readiness);
ingestionRoutes.post("/resume/upload", upload.single("file"), uploadResume);
ingestionRoutes.post("/resume/extract", upload.single("file"), extractResume);
ingestionRoutes.post("/resume/clean", cleanResume);
ingestionRoutes.post("/resume/skills", detectResumeSkills);
ingestionRoutes.post("/resume/parse", parseResume);
ingestionRoutes.post("/resume/llm-parse", parseResumeWithLlm);
ingestionRoutes.post("/resume/embed", embedResume);
ingestionRoutes.post("/resume/store", storeResume);
ingestionRoutes.post("/resume/inject", upload.single("file"), injectResume);
ingestionRoutes.post("/resume/ingest", upload.single("file"), injectResume);
