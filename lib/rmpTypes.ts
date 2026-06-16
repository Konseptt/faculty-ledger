// Our own RMP data models (snake_case to minimize churn in lib/rmp.ts),
// replacing the types previously imported from ratemyprofessors-client.

export interface School {
  id: string; // numeric legacy id, as a string
  name: string;
}

export interface Professor {
  id: string; // numeric legacy id, used in RMP URLs
  name: string;
  department?: string | null;
  overall_rating?: number | null;
  num_ratings?: number | null;
  percent_take_again?: number | null;
  level_of_difficulty?: number | null;
}

export interface Rating {
  date: Date;
  comment: string;
  quality?: number | null;
  difficulty?: number | null;
  tags: string[];
  course_raw?: string | null;
  details?: Record<string, unknown> | null;
}

// Shape of a single rating node as RMP's GraphQL returns it.
export interface RawRating {
  comment: string | null;
  clarityRating: number | null;
  helpfulRating: number | null;
  difficultyRating: number | null;
  ratingTags: string | null; // "--"-separated
  class: string | null;
  date: string;
  grade: string | null;
}

export function parseRmpDate(raw: string): Date {
  // RMP returns e.g. "2023-09-01 12:30:00 +0000 UTC". Try direct parse, then
  // normalize the space-separated form to ISO, then fall back to today.
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;
  const iso = raw.slice(0, 19).replace(" ", "T") + "Z";
  const normalized = new Date(iso);
  if (!Number.isNaN(normalized.getTime())) return normalized;
  return new Date();
}

export function mapRawRating(n: RawRating): Rating {
  const clarity = n.clarityRating ?? 0;
  const helpful = n.helpfulRating ?? 0;
  let quality: number | null = null;
  if (clarity > 0 && helpful > 0) {
    quality = Math.round(((clarity + helpful) / 2) * 10) / 10;
  } else if (clarity > 0 || helpful > 0) {
    quality = clarity || helpful;
  }
  return {
    date: parseRmpDate(n.date),
    comment: n.comment ?? "",
    quality,
    difficulty: n.difficultyRating ?? null,
    tags: (n.ratingTags ?? "").split("--").map((t) => t.trim()).filter(Boolean),
    course_raw: n.class ?? null,
    details: { grade: n.grade },
  };
}
