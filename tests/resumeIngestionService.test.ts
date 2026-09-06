import { writeFile } from "node:fs/promises";
import path from "node:path";
import { ResumeIngestionService } from "../src/modules/ingestion/services/ResumeIngestionService";
import { env } from "../src/config/env";

describe("ResumeIngestionService", () => {
  it("orchestrates parsing, embedding, storage, and file cleanup", async () => {
    const filePath = path.join(process.cwd(), "uploads", "phase13-test.pdf");
    await writeFile(filePath, "temporary test file");
    const embedding = Array.from({ length: env.embeddingDimension }, () => 0.1);
    const repository = {
      insertResume: jest.fn().mockResolvedValue("phase13-resume-id"),
    };
    const service = new ResumeIngestionService(
      { extractTextFromPdf: jest.fn().mockResolvedValue("Candidate Name\nRAG") },
      { parseResume: jest.fn().mockReturnValue({ name: "Candidate Name", skills: ["RAG"] }) },
      { parseResume: jest.fn() },
      { generateResumeEmbedding: jest.fn().mockResolvedValue(embedding) },
      repository,
    );

    const result = await service.injectResume({
      path: filePath,
      originalname: "candidate.pdf",
    } as Express.Multer.File);

    expect(result.resumeId).toBe("phase13-resume-id");
    expect(result.data.skillsCount).toBe(1);
    expect(result.data.embeddingDimension).toBe(env.embeddingDimension);
    expect(result.timings.totalMs).toBeGreaterThanOrEqual(0);
    expect(repository.insertResume).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "candidate.pdf", rawText: "Candidate Name\nRAG" }),
    );
    await expect(import("node:fs/promises").then(({ access }) => access(filePath))).rejects.toThrow();
  });
});
