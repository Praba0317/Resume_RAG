import { readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { env } from "../../../config/env";
import { AlgorithmResumeParser } from "./AlgorithmResumeParser";
import { EmbeddingService } from "./EmbeddingService";
import { LLMResumeParser } from "./LLMResumeParser";
import { ResumeParserService } from "./ResumeParserService";
import { ResumeIngestionRepository } from "../repositories/ResumeIngestionRepository";
import { cleanResumeText } from "../utils/textCleaner";

export interface ResumeIngestionResult {
  fileName?: string;
  resumeId: string;
  data: {
    name?: string;
    role?: string;
    company?: string;
    totalExperience?: number;
    skillsCount: number;
    embeddingModel: string;
    embeddingDimension: number;
  };
  timings: {
    extractMs: number;
    cleanMs: number;
    parseMs: number;
    embeddingMs: number;
    mongoInsertMs: number;
    totalMs: number;
  };
}

export interface BatchIngestionFileResult {
  fileName: string;
  status: "ingested" | "failed" | "skipped";
  resumeId?: string;
  error?: string;
}

export interface BatchIngestionResult {
  directory: string;
  batchSize: number;
  totalFiles: number;
  ingested: number;
  failed: number;
  skipped: number;
  batches: BatchIngestionFileResult[][];
}

type ResumeParser = Pick<ResumeParserService, "extractTextFromPdf"> &
  Partial<Pick<ResumeParserService, "extractText">>;

export class ResumeIngestionService {
  constructor(
    private readonly resumeParserService: ResumeParser = new ResumeParserService(),
    private readonly algorithmResumeParser = new AlgorithmResumeParser(),
    private readonly llmResumeParser = new LLMResumeParser(),
    private readonly embeddingService = new EmbeddingService(),
    private readonly repository = new ResumeIngestionRepository(),
  ) {}

  async injectResume(
    file: Express.Multer.File,
    options: { removeFile?: boolean } = {},
  ): Promise<ResumeIngestionResult> {
    const totalStartedAt = Date.now();
    try {
      const extractStartedAt = Date.now();
      const rawText = file.originalname.toLowerCase().endsWith(".docx")
        ? await this.resumeParserService.extractText!(file.path, file.originalname)
        : await this.resumeParserService.extractTextFromPdf(file.path);
      const extractMs = Date.now() - extractStartedAt;
      if (!rawText) {
        throw new Error("Resume extraction failed");
      }

      const cleanStartedAt = Date.now();
      const cleanText = cleanResumeText(rawText);
      const cleanMs = Date.now() - cleanStartedAt;
      if (!cleanText) {
        throw new Error("Resume extraction failed");
      }

      const parseStartedAt = Date.now();
      const resume = env.useLlmParser
        ? await this.llmResumeParser.parseResume(cleanText)
        : this.algorithmResumeParser.parseResume(cleanText);
      const parseMs = Date.now() - parseStartedAt;

      const embeddingStartedAt = Date.now();
      const embedding = await this.embeddingService.generateResumeEmbedding({
        name: resume.name,
        role: resume.role,
        skills: resume.skills,
        company: resume.company,
        experienceSummary: resume.experienceSummary,
        rawText: cleanText,
      });
      const embeddingMs = Date.now() - embeddingStartedAt;

      const mongoStartedAt = Date.now();
      const resumeId = await this.repository.insertResume({
        fileName: file.originalname,
        rawText: cleanText,
        resume,
        embedding,
      });
      const mongoInsertMs = Date.now() - mongoStartedAt;

      return {
        resumeId,
        fileName: file.originalname,
        data: {
          name: resume.name,
          role: resume.role,
          company: resume.company,
          totalExperience: resume.totalExperience,
          skillsCount: resume.skills.length,
          embeddingModel: env.mistralEmbedModel,
          embeddingDimension: embedding.length,
        },
        timings: {
          extractMs,
          cleanMs,
          parseMs,
          embeddingMs,
          mongoInsertMs,
          totalMs: Date.now() - totalStartedAt,
        },
      };
    } finally {
      if (options.removeFile !== false) {
        await unlink(file.path).catch(() => undefined);
      }
    }
  }

  async ingestDirectory(
    directory: string,
    batchSize = 10,
  ): Promise<BatchIngestionResult> {
    if (!Number.isInteger(batchSize) || batchSize < 1) {
      throw new Error("batchSize must be a positive integer");
    }

    const entries = await readdir(directory, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
    const supported = files.filter((fileName) => /\.(pdf|docx)$/i.test(fileName));
    const skippedFiles = files.filter((fileName) => !/\.(pdf|docx)$/i.test(fileName));
    const batches: BatchIngestionFileResult[][] = [];

    for (let index = 0; index < supported.length; index += batchSize) {
      const batch = supported.slice(index, index + batchSize);
      const batchResults: BatchIngestionFileResult[] = [];

      for (const fileName of batch) {
        const filePath = path.join(directory, fileName);
        try {
          const result = await this.injectResume(
            {
              path: filePath,
              originalname: fileName,
              filename: fileName,
              destination: directory,
              fieldname: "file",
              encoding: "7bit",
              mimetype: fileName.toLowerCase().endsWith(".pdf")
                ? "application/pdf"
                : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              size: 0,
              stream: undefined as never,
              buffer: Buffer.alloc(0),
            } as Express.Multer.File,
            { removeFile: false },
          );
          batchResults.push({
            fileName,
            status: "ingested",
            resumeId: result.resumeId,
          });
        } catch (error) {
          batchResults.push({
            fileName,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown ingestion error",
          });
        }
      }

      batches.push(batchResults);
    }

    if (skippedFiles.length > 0) {
      batches.push(
        skippedFiles.map((fileName) => ({
          fileName,
          status: "skipped" as const,
          error: "Unsupported file type; only PDF and DOCX are supported",
        })),
      );
    }

    const results = batches.flat();
    return {
      directory,
      batchSize,
      totalFiles: files.length,
      ingested: results.filter((result) => result.status === "ingested").length,
      failed: results.filter((result) => result.status === "failed").length,
      skipped: results.filter((result) => result.status === "skipped").length,
      batches,
    };
  }
}
