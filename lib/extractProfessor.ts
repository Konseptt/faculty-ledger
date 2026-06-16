export interface ExtractedProfessor {
  professorName: string;
  university?: string;
  course?: string;
  confidence: "high" | "low";
}

const NAME = "([A-Z][a-z]+(?:\\s+[A-Z]\\.?)?(?:\\s+[A-Z][a-z]+){1,2})";
const NAME_CUES = [
  new RegExp(`Instructor\\s*:?\\s*(?:Dr\\.?|Prof\\.?|Professor)?\\s*${NAME}`),
  new RegExp(`Professor\\s+${NAME}`),
  new RegExp(`Prof\\.?\\s+${NAME}`),
  new RegExp(`Dr\\.?\\s+${NAME}`),
  new RegExp(`Lecturer\\s*:?\\s*${NAME}`),
  new RegExp(`[Tt]aught by\\s+(?:Dr\\.?|Prof\\.?|Professor)?\\s*${NAME}`),
];
const UNIVERSITY = /\b((?:University of [A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)|(?:[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*\s(?:University|College|Institute)))\b/;
const COURSE = /\b([A-Z]{2,4}\s?\d{2,4})\b/;

export function extractProfessorHeuristic(text: string): ExtractedProfessor {
  let professorName = "";
  for (const cue of NAME_CUES) {
    const m = text.match(cue);
    if (m && m[1]) {
      professorName = m[1].trim();
      break;
    }
  }
  const university = text.match(UNIVERSITY)?.[1]?.trim();
  const course = text.match(COURSE)?.[1]?.replace(/\s+/, " ").trim();

  return {
    professorName,
    university,
    course,
    confidence: professorName ? "high" : "low",
  };
}
