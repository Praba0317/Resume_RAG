import { Document } from "mongodb";
import { SearchCandidate, SearchSource } from "../types/retrieval.types";

export function mapResumeToCandidate(
  resume: Document,
  source: SearchSource,
  score: number,
): SearchCandidate {
  return {
    resumeId: String(resume._id),
    ...(typeof resume.name === "string" ? { name: resume.name } : {}),
    ...(typeof resume.role === "string" ? { role: resume.role } : {}),
    ...(typeof resume.company === "string" ? { company: resume.company } : {}),
    ...(Array.isArray(resume.skills) ? { skills: resume.skills } : {}),
    ...(typeof resume.rawText === "string"
      ? { snippet: resume.rawText.slice(0, 500) }
      : {}),
    ...(source === "bm25" ? { bm25Score: score } : { vectorScore: score }),
    sources: [source],
  };
}
