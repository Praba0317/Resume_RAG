import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export class ResumeParserService {
  async extractText(filePath: string, originalName: string): Promise<string> {
    if (originalName.toLowerCase().endsWith(".docx")) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value.trim();
    }

    return this.extractTextFromPdf(filePath);
  }

  async extractTextFromPdf(filePath: string): Promise<string> {
    const fileBuffer = await readFile(filePath);
    const parser = new PDFParse({ data: fileBuffer });
    try {
      const parsedPdf = await parser.getText();
      return parsedPdf.text.trim();
    } finally {
      await parser.destroy();
    }
  }
}
