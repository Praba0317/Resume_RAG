import { logger } from "../src/middleware/logger";

describe("logger", () => {
  it("logs request metadata and ingestion timings without sensitive fields", () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);
    let finishHandler: (() => void) | undefined;
    const response = {
      locals: {
        requestId: "request-1",
        ingestionLog: {
          fileName: "resume.pdf",
          resumeId: "resume-1",
          extractMs: 10,
          cleanMs: 2,
          parseMs: 5,
          embeddingMs: 20,
          mongoInsertMs: 8,
          totalMs: 45,
          rawText: "must not log",
          embedding: [0.1, 0.2],
        },
      },
      statusCode: 200,
      on: jest.fn((_event: string, handler: () => void) => {
        finishHandler = handler;
      }),
    };

    logger(
      { method: "POST", originalUrl: "/v1/resume/ingest" } as never,
      response as never,
      jest.fn(),
    );
    finishHandler?.();

    const output = log.mock.calls[0][0] as string;
    expect(output).toContain('"fileName":"resume.pdf"');
    expect(output).toContain('"extractMs":10');
    expect(output).not.toContain("must not log");
    expect(output).not.toContain('"embedding":');
    log.mockRestore();
  });

  it("logs retrieval timings and warnings without request data", () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);
    let finishHandler: (() => void) | undefined;
    const response = {
      locals: {
        requestId: "request-2",
        retrievalLog: {
          componentTimings: { embeddingMs: 10, totalMs: 40 },
          warnings: ["VECTOR_SEARCH_FAILED"],
        },
      },
      statusCode: 200,
      on: jest.fn((_event: string, handler: () => void) => {
        finishHandler = handler;
      }),
    };

    logger(
      { method: "POST", originalUrl: "/v1/search" } as never,
      response as never,
      jest.fn(),
    );
    finishHandler?.();

    const output = log.mock.calls[0][0] as string;
    expect(output).toContain('"componentTimings":{"embeddingMs":10,"totalMs":40}');
    expect(output).toContain('"warnings":["VECTOR_SEARCH_FAILED"]');
    expect(output).not.toContain('"query":');
    log.mockRestore();
  });
});
