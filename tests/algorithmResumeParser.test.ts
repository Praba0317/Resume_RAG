import { AlgorithmResumeParser } from "../src/modules/ingestion/services/AlgorithmResumeParser";

describe("AlgorithmResumeParser", () => {
  const parser = new AlgorithmResumeParser();

  it("extracts supported resume metadata without an LLM", () => {
    const resume = parser.parseResume(`
      Rajesh Mohan Kumar
      Test Architect & Senior Agentic Test Engineer
      Testleaf Software Solutions Private Limited
      B.Tech - Information Technology
      13+ years of experience
      rajesh@example.com
      +91 9876543210
      Selenium WebDriver, Core Java, C#, Python, RAG, DeepEval
    `);

    expect(resume).toMatchObject({
      name: "Rajesh Mohan Kumar",
      role: "Test Architect & Senior Agentic Test Engineer",
      company: "Testleaf Software Solutions Private Limited",
      education: "B.Tech - Information Technology",
      totalExperience: 13,
      email: "rajesh@example.com",
      phone: "+91 9876543210",
    });
    expect(resume.skills).toEqual([
      "Selenium WebDriver",
      "Core Java",
      "C#",
      "Python",
      "RAG",
      "DeepEval",
    ]);
  });

  it("omits unsupported values instead of inventing them", () => {
    expect(parser.parseResume("Candidate Name\nSoftware Engineer")).toEqual({
      name: "Candidate Name",
      role: "Software Engineer",
      skills: [],
      jobTitles: ["Software Engineer"],
    });
  });
});
