import { RequestHandler } from "express";
import { unlink } from "node:fs/promises";
import { detectSkills } from "../../../config/skills";
import { env } from "../../../config/env";
import { ResumeParserService } from "../services/ResumeParserService";
import { AlgorithmResumeParser } from "../services/AlgorithmResumeParser";
import { LLMResumeParser } from "../services/LLMResumeParser";
import { EmbeddingService } from "../services/EmbeddingService";
import { ResumeIngestionRepository } from "../repositories/ResumeIngestionRepository";
import { ResumeIngestionService } from "../services/ResumeIngestionService";
import { cleanResumeText } from "../utils/textCleaner";

const resumeParserService = new ResumeParserService();
const algorithmResumeParser = new AlgorithmResumeParser();
const llmResumeParser = new LLMResumeParser();
const embeddingService = new EmbeddingService();
const resumeIngestionRepository = new ResumeIngestionRepository();
const resumeIngestionService = new ResumeIngestionService();

export const readiness: RequestHandler = (_req, res) => {
  res.status(200).json({
    status: "ok",
    module: "resume-ingestion",
  });
};

export const uploadResume: RequestHandler = (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "FILE_REQUIRED",
      message: "Resume PDF is required",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Resume uploaded successfully",
    file: {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
};

export const extractResume: RequestHandler = async (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "FILE_REQUIRED",
      message: "Resume PDF is required",
    });
    return;
  }

  try {
    const rawText = await resumeParserService.extractTextFromPdf(req.file.path);
    if (!rawText) {
      res.status(422).json({
        success: false,
        requestId: res.locals.requestId,
        errorCode: "RESUME_EXTRACTION_FAILED",
        message: "Resume extraction failed",
      });
      return;
    }

    res.status(200).json({
      success: true,
      rawText,
      characters: rawText.length,
    });
  } catch (_error) {
    res.status(422).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "RESUME_EXTRACTION_FAILED",
      message: "Resume extraction failed",
    });
  } finally {
    await unlink(req.file.path).catch(() => undefined);
  }
};

export const cleanResume: RequestHandler = (req, res) => {
  if (typeof req.body?.rawText !== "string") {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "RAW_TEXT_REQUIRED",
      message: "rawText is required",
    });
    return;
  }

  const cleanText = cleanResumeText(req.body.rawText);
  res.status(200).json({
    success: true,
    cleanText,
  });
};

export const detectResumeSkills: RequestHandler = (req, res) => {
  if (typeof req.body?.rawText !== "string") {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "RAW_TEXT_REQUIRED",
      message: "rawText is required",
    });
    return;
  }

  res.status(200).json({
    success: true,
    skills: detectSkills(req.body.rawText),
  });
};

export const parseResume: RequestHandler = (req, res) => {
  if (typeof req.body?.rawText !== "string") {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "RAW_TEXT_REQUIRED",
      message: "rawText is required",
    });
    return;
  }

  if (!req.body.rawText.trim()) {
    res.status(422).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "RESUME_PARSE_FAILED",
      message: "Resume parsing failed",
    });
    return;
  }

  res.status(200).json({
    success: true,
    resume: algorithmResumeParser.parseResume(req.body.rawText),
  });
};

export const parseResumeWithLlm: RequestHandler = async (req, res) => {
  if (typeof req.body?.rawText !== "string") {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "RAW_TEXT_REQUIRED",
      message: "rawText is required",
    });
    return;
  }

  if (!env.useLlmParser) {
    res.status(503).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "LLM_PARSER_DISABLED",
      message: "LLM resume parser is disabled",
    });
    return;
  }

  try {
    const resume = await llmResumeParser.parseResume(req.body.rawText);
    res.status(200).json({ success: true, resume });
  } catch (_error) {
    res.status(422).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "RESUME_PARSE_FAILED",
      message: "Resume parsing failed",
    });
  }
};

export const embedResume: RequestHandler = async (req, res) => {
  if (typeof req.body?.rawText !== "string" || !req.body.rawText.trim()) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "RAW_TEXT_REQUIRED",
      message: "rawText is required",
    });
    return;
  }

  try {
    const embedding = await embeddingService.generateResumeEmbedding({
      name: typeof req.body.name === "string" ? req.body.name : undefined,
      role: typeof req.body.role === "string" ? req.body.role : undefined,
      skills: Array.isArray(req.body.skills)
        ? req.body.skills.filter((skill: unknown): skill is string =>
            typeof skill === "string",
          )
        : undefined,
      company:
        typeof req.body.company === "string" ? req.body.company : undefined,
      experienceSummary:
        typeof req.body.experienceSummary === "string"
          ? req.body.experienceSummary
          : undefined,
      rawText: req.body.rawText,
    });

    res.status(200).json({
      success: true,
      model: env.mistralEmbedModel,
      dimension: embedding.length,
      embedding,
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

export const storeResume: RequestHandler = async (req, res) => {
  const { fileName, rawText, resume, embedding } = req.body ?? {};
  if (
    typeof fileName !== "string" ||
    !fileName.trim() ||
    typeof rawText !== "string" ||
    !rawText.trim() ||
    !resume ||
    typeof resume !== "object" ||
    !Array.isArray(resume.skills) ||
    !resume.skills.every((skill: unknown) => typeof skill === "string") ||
    !Array.isArray(embedding) ||
    !embedding.every((value: unknown) => typeof value === "number") ||
    embedding.length !== env.embeddingDimension
  ) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_RESUME_DATA",
      message: "Valid resume metadata and embedding are required",
    });
    return;
  }

  try {
    const resumeId = await resumeIngestionRepository.insertResume({
      fileName,
      rawText,
      resume,
      embedding,
    });
    res.status(200).json({
      success: true,
      message: "Resume stored successfully",
      resumeId,
    });
  } catch (_error) {
    res.status(503).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INGESTION_FAILED",
      message: "Resume ingestion failed",
    });
  }
};

export const injectResume: RequestHandler = async (req, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "FILE_REQUIRED",
      message: "Resume PDF is required",
    });
    return;
  }

  try {
    const result = await resumeIngestionService.injectResume(req.file);
    res.locals.ingestionLog = {
      fileName: req.file.originalname,
      resumeId: result.resumeId,
      ...result.timings,
    };
    res.status(200).json({
      success: true,
      requestId: res.locals.requestId,
      message: "Resume ingestion completed",
      ...result,
    });
  } catch (_error) {
    res.status(503).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INGESTION_FAILED",
      message: "Resume ingestion failed",
    });
  }
};
