import multer from "multer";
import { errorHandler } from "../src/middleware/errorHandler";

function responseMock() {
  const response = {
    locals: { requestId: "test-request" },
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  return response;
}

describe("errorHandler", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ["RESUME_EXTRACTION_FAILED", 422, "Resume extraction failed"],
    ["RESUME_PARSE_FAILED", 422, "Resume parsing failed"],
    ["EMBEDDING_FAILED", 502, "Mistral embedding failed"],
    ["INGESTION_FAILED", 503, "Resume ingestion failed"],
  ])("maps %s to a stable response", (code, status, message) => {
    const response = responseMock();

    errorHandler({ code }, {} as never, response as never, jest.fn());

    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      requestId: "test-request",
      errorCode: code,
      message,
    });
  });

  it("maps an unexpected multipart field", () => {
    const response = responseMock();
    const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE");

    errorHandler(error, {} as never, response as never, jest.fn());

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: "INVALID_FILE_FIELD" }),
    );
  });

  it("maps oversized JSON bodies to HTTP 413", () => {
    const response = responseMock();

    errorHandler({ type: "entity.too.large" }, {} as never, response as never, jest.fn());

    expect(response.status).toHaveBeenCalledWith(413);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: "REQUEST_BODY_TOO_LARGE" }),
    );
  });
});
