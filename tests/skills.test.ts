import { detectSkills } from "../src/config/skills";

describe("resume skill detection", () => {
  it("detects the documented sample skills", () => {
    expect(
      detectSkills(
        "Experienced in Selenium WebDriver, Python, RAG, DeepEval and MCP (Model Context Protocol).",
      ),
    ).toEqual(["Selenium", "Python", "RAG", "DeepEval", "MCP (Model Context Protocol)"]);
  });

  it("preserves punctuation-sensitive skills", () => {
    expect(detectSkills("C# and JavaScript, plus .NET tooling")).toEqual([
      "C#",
    ]);
  });

  it("does not match Java inside JavaScript", () => {
    expect(detectSkills("JavaScript developer")).not.toContain("Java");
  });
});
