export const SKILLS = [
  "Java",
  "Selenium",
  "Playwright",
  "API Testing",
  "Postman",
  "SQL",
  "MongoDB",
  "Jenkins",
  "Python",
  "C#",
  "REST Assured",
  "Cucumber",
  "GenAI",
  "Langchain",
  "Langgraph",
  "RAG",
  "Azure DevOps",
  "AWS Lambda",
  "GitHub",
  "DeepEval",
  "MCP (Model Context Protocol)",
] as const;

function skillPattern(skill: string): RegExp {
  const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z0-9])${escapedSkill}(?![A-Za-z0-9])`, "i");
}

export function detectSkills(rawText: string): string[] {
  return SKILLS.filter((skill) => skillPattern(skill).test(rawText));
}
