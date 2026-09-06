import { SearchCandidate } from "../types/retrieval.types";

export function deduplicateCandidates(
  candidates: SearchCandidate[],
): SearchCandidate[] {
  const byResumeId = new Map<string, SearchCandidate>();

  for (const candidate of candidates) {
    const existing = byResumeId.get(candidate.resumeId);
    if (!existing) {
      byResumeId.set(candidate.resumeId, {
        ...candidate,
        sources: [...candidate.sources],
      });
      continue;
    }

    existing.sources = Array.from(
      new Set([...existing.sources, ...candidate.sources]),
    );
    existing.skills = Array.from(
      new Set([...(existing.skills ?? []), ...(candidate.skills ?? [])]),
    );
    existing.name ??= candidate.name;
    existing.role ??= candidate.role;
    existing.company ??= candidate.company;
    existing.bm25Score ??= candidate.bm25Score;
    existing.vectorScore ??= candidate.vectorScore;
    existing.snippet ??= candidate.snippet;
  }

  return Array.from(byResumeId.values());
}
