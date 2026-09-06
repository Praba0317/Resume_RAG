import { detectSkills } from "../../../config/skills";
import {
  EMAIL_REGEX,
  EXPERIENCE_REGEX,
  PHONE_REGEX,
} from "../utils/regex";
import { cleanResumeText } from "../utils/textCleaner";
import { ParsedResume } from "../types/ingestion.types";

const ROLE_PATTERN =
  /\b(architect|engineer|developer|manager|analyst|tester|consultant|lead|administrator|specialist)\b/i;
const COMPANY_PATTERN =
  /\b(private limited|pvt\.? ltd\.?|limited|ltd\.?|llc|inc\.?|corporation|technologies|solutions|systems)\b/i;
const EDUCATION_PATTERN =
  /\b(B\.?Tech|B\.?E\.?|M\.?Tech|M\.?E\.?|BSc|MSc|MBA|Bachelor|Master|Ph\.?D)\b/i;

function firstMatchingLine(lines: string[], pattern: RegExp): string | undefined {
  return lines.find((line) => pattern.test(line));
}

function extractName(lines: string[]): string | undefined {
  return lines.find((line) => {
    const words = line.split(/\s+/);
    return (
      words.length >= 2 &&
      words.length <= 5 &&
      !line.includes("@") &&
      !ROLE_PATTERN.test(line) &&
      !COMPANY_PATTERN.test(line) &&
      !EDUCATION_PATTERN.test(line) &&
      !/[|:]/.test(line)
    );
  });
}

export class AlgorithmResumeParser {
  parseResume(rawText: string): ParsedResume {
    const cleanText = cleanResumeText(rawText);
    const lines = cleanText.split("\n");
    const email = cleanText.match(EMAIL_REGEX)?.[0];
    const phone = cleanText.match(PHONE_REGEX)?.[0];
    const experienceMatch = cleanText.match(EXPERIENCE_REGEX);
    const roleLines = lines.filter((line) => ROLE_PATTERN.test(line));
    const role = roleLines[0];
    const skills = detectSkills(cleanText)
      .map((skill) => {
        if (skill === "Selenium" && /\bSelenium WebDriver\b/i.test(cleanText)) {
          return "Selenium WebDriver";
        }
        if (skill === "Java" && /\bCore Java\b/i.test(cleanText)) {
          return "Core Java";
        }
        return skill;
      })
      .sort(
        (left, right) =>
          cleanText.toLowerCase().indexOf(left.toLowerCase()) -
          cleanText.toLowerCase().indexOf(right.toLowerCase()),
      );

    return {
      ...(extractName(lines) ? { name: extractName(lines) } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(firstMatchingLine(lines, COMPANY_PATTERN)
        ? { company: firstMatchingLine(lines, COMPANY_PATTERN) }
        : {}),
      ...(role ? { role } : {}),
      ...(firstMatchingLine(lines, EDUCATION_PATTERN)
        ? { education: firstMatchingLine(lines, EDUCATION_PATTERN) }
        : {}),
      ...(experienceMatch ? { totalExperience: Number(experienceMatch[1]) } : {}),
      skills,
      ...(roleLines.length > 0 ? { jobTitles: roleLines } : {}),
    };
  }
}
