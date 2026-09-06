import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";

const uploadDirectory = path.resolve(process.cwd(), "uploads");
mkdirSync(uploadDirectory, { recursive: true });

class InvalidFileTypeError extends Error {
  code = "INVALID_FILE_TYPE";
}

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (_req, _file, callback) => {
    callback(null, `${randomUUID()}.pdf`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (extension !== ".pdf" || file.mimetype !== "application/pdf") {
      callback(new InvalidFileTypeError("Only PDF files are allowed"));
      return;
    }
    callback(null, true);
  },
});
