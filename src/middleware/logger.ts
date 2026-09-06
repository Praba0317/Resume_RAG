import { RequestHandler } from "express";

export const logger: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const ingestionLog = res.locals.ingestionLog ?? {};
    const retrievalLog = res.locals.retrievalLog ?? {};
    console.log(JSON.stringify({
      requestId: res.locals.requestId,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ...(ingestionLog.fileName ? { fileName: ingestionLog.fileName } : {}),
      ...(ingestionLog.resumeId ? { resumeId: ingestionLog.resumeId } : {}),
      ...(typeof ingestionLog.extractMs === "number"
        ? { extractMs: ingestionLog.extractMs }
        : {}),
      ...(typeof ingestionLog.cleanMs === "number"
        ? { cleanMs: ingestionLog.cleanMs }
        : {}),
      ...(typeof ingestionLog.parseMs === "number"
        ? { parseMs: ingestionLog.parseMs }
        : {}),
      ...(typeof ingestionLog.embeddingMs === "number"
        ? { embeddingMs: ingestionLog.embeddingMs }
        : {}),
      ...(typeof ingestionLog.mongoInsertMs === "number"
        ? { mongoInsertMs: ingestionLog.mongoInsertMs }
        : {}),
      ...(typeof ingestionLog.totalMs === "number"
        ? { totalMs: ingestionLog.totalMs }
        : {}),
      ...(retrievalLog.componentTimings
        ? { componentTimings: retrievalLog.componentTimings }
        : {}),
      ...(Array.isArray(retrievalLog.warnings)
        ? { warnings: retrievalLog.warnings }
        : {}),
      ...(typeof retrievalLog.errorCode === "string"
        ? { errorCode: retrievalLog.errorCode }
        : {}),
    }));
  });

  next();
};
