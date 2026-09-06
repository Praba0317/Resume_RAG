import request from "supertest";
import { app } from "../src/app";

describe("resume ingestion API", () => {
  it("returns service health and a request ID", async () => {
    const response = await request(app).get("/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      app: "resume-rag-backend",
      version: "1.0.0",
    });
    expect(response.headers["x-request-id"]).toBeDefined();
  });

  it("returns ingestion module readiness", async () => {
    const response = await request(app).get("/v1/resume/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      module: "resume-ingestion",
    });
  });

  it("cleans resume text", async () => {
    const response = await request(app)
      .post("/v1/resume/clean")
      .send({ rawText: "Name\n\n\nTest Architect   \n C#" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      cleanText: "Name\nTest Architect\nC#",
    });
  });

  it("detects skills", async () => {
    const response = await request(app)
      .post("/v1/resume/skills")
      .send({ rawText: "Selenium WebDriver, Python, RAG, DeepEval" });

    expect(response.status).toBe(200);
    expect(response.body.skills).toEqual([
      "Selenium",
      "Python",
      "RAG",
      "DeepEval",
    ]);
  });

  it("parses structured resume data", async () => {
    const response = await request(app)
      .post("/v1/resume/parse")
      .send({
        rawText:
          "Candidate Name\nTest Architect\nExample Solutions Limited\n13+ years of experience",
      });

    expect(response.status).toBe(200);
    expect(response.body.resume).toMatchObject({
      name: "Candidate Name",
      role: "Test Architect",
      company: "Example Solutions Limited",
      totalExperience: 13,
      skills: [],
    });
  });

  it("rejects an ingest request without a file", async () => {
    const response = await request(app).post("/v1/resume/ingest");

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: "FILE_REQUIRED",
      message: "Resume PDF is required",
    });
    expect(response.body.requestId).toBe(response.headers["x-request-id"]);
  });

  it("rejects invalid JSON with a JSON error response", async () => {
    const response = await request(app)
      .post("/v1/resume/clean")
      .set("Content-Type", "application/json")
      .send("{bad json");

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      errorCode: "INVALID_JSON",
    });
  });
});
