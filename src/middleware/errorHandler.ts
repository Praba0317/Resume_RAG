import { ErrorRequestHandler } from "express";
import multer from "multer";

const errorResponses: Record<string, { status: number; message: string }> = {
  RESUME_EXTRACTION_FAILED: {
    status: 422,
    message: "Resume extraction failed",
  },
  RESUME_PARSE_FAILED: {
    status: 422,
    message: "Resume parsing failed",
  },
  EMBEDDING_FAILED: {
    status: 502,
    message: "Mistral embedding failed",
  },
  INGESTION_FAILED: {
    status: 503,
    message: "Resume ingestion failed",
  },
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  console.error(JSON.stringify({
    requestId: res.locals.requestId,
    endpoint: req.originalUrl,
    errorCode: error?.code,
    message: error?.message,
  }));

  if (error?.type === "entity.parse.failed") {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_JSON",
      message: "Request body contains invalid JSON",
    });
    return;
  }

  if (error?.type === "entity.too.large") {
    res.status(413).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "REQUEST_BODY_TOO_LARGE",
      message: "Request body exceeds the maximum allowed size",
    });
    return;
  }

  if (error instanceof multer.MulterError && error.code === "LIMIT_UNEXPECTED_FILE") {
    res.status(400).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_FILE_FIELD",
      message: "Upload the resume using the file field",
    });
    return;
  }

  if (error?.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "FILE_TOO_LARGE",
      message: "Resume exceeds maximum upload size",
    });
    return;
  }

  if (error?.code === "INVALID_FILE_TYPE") {
    res.status(415).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: "INVALID_FILE_TYPE",
      message: "Only PDF files are allowed",
    });
    return;
  }

  const knownError = errorResponses[error?.code];
  if (knownError) {
    res.status(knownError.status).json({
      success: false,
      requestId: res.locals.requestId,
      errorCode: error.code,
      message: knownError.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    requestId: res.locals.requestId,
    errorCode: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
};
