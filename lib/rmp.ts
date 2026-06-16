import { searchSchools, searchProfessors, getRatingsPage } from "@/lib/rmpClient";
import { scoreSentiment } from "@/lib/sentiment";
import type { Professor, Rating, School } from "@/lib/rmpTypes";

const MAX_RATINGS = 300;
const MAX_PAGES = 15;


export interface RmpProfessorData {
  professor: Professor;
  ratings: Rating[];
  school: School;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function scoreSchoolMatch(schoolName: string, query: string): number {
  const a = normalize(schoolName);
  const b = normalize(query);
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 80;
  const bTokens = b.split(" ");
  const matches = bTokens.filter((t) => t.length > 2 && a.includes(t)).length;
  return matches * 15;
}

function pickBestSchool(schools: School[], university: string): School | null {
  if (schools.length === 0) return null;
  return [...schools].sort(
    (x, y) => scoreSchoolMatch(y.name, university) - scoreSchoolMatch(x.name, university),
  )[0];
}

function scoreNameMatch(professorName: string, query: string): number {
  const a = normalize(professorName);
  const b = normalize(query);
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 85;
  const bParts = b.split(" ");
  const aParts = a.split(" ");
  const lastMatch = bParts.length > 0 && aParts[aParts.length - 1] === bParts[bParts.length - 1];
  const firstMatch = bParts.length > 0 && aParts[0] === bParts[0];
  if (firstMatch && lastMatch) return 90;
  if (lastMatch) return 70;
  if (firstMatch) return 60;
  return 0;
}

function pickBestProfessor(professors: Professor[], professorName: string): Professor | null {
  const ranked = professors
    .map((p) => ({ p, score: scoreNameMatch(p.name, professorName) }))
    .filter((x) => x.score >= 60)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.p ?? null;
}

export async function fetchProfessorFromRmp(
  professorName: string,
  university: string,
): Promise<RmpProfessorData | null> {
  const schools = await searchSchools(university, 10);
  const school = pickBestSchool(schools, university);
  if (!school) return null;

  const professors = await searchProfessors(professorName, school.id, 10);
  const professor = pickBestProfessor(professors, professorName);
  if (!professor) return null;

  const ratings: Rating[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await getRatingsPage(professor.id, cursor, 20);
    ratings.push(...result.ratings);
    if (!result.hasNextPage || !result.endCursor || ratings.length >= MAX_RATINGS) break;
    cursor = result.endCursor;
  }

  return { professor, ratings, school };
}

export function rmpProfileUrl(professorId: string): string {
  return `https://www.ratemyprofessors.com/professor/${professorId}`;
}

function countTags(ratings: Rating[], minQuality: number, maxQuality: number): Map<string, number> {
  const counts = new Map<string, number>();
  for (const rating of ratings) {
    const q = rating.quality ?? 0;
    if (q < minQuality || q > maxQuality) continue;
    for (const tag of rating.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

function topTags(counts: Map<string, number>, limit: number): string[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

function extractConsFromComments(ratings: Rating[]): string[] {
  const cons: string[] = [];
  for (const rating of ratings) {
    if (!rating.comment || (rating.quality ?? 5) > 2) continue;
    if (scoreSentiment(rating.comment) === "negative") {
      const snippet = rating.comment.length > 120 ? `${rating.comment.slice(0, 117)}...` : rating.comment;
      cons.push(snippet);
    }
    if (cons.length >= 3) break;
  }
  return cons;
}

export function buildReviewSummaryFromRmp(professor: Professor, ratings: Rating[]) {
  const overallRating = professor.overall_rating ?? 0;
  const numRatings = professor.num_ratings ?? ratings.length;
  const difficulty = professor.level_of_difficulty ?? undefined;
  const wouldTakeAgain = professor.percent_take_again ?? undefined;

  const pros = topTags(countTags(ratings, 4, 5), 4);
  const tagCons = topTags(countTags(ratings, 1, 2), 3);
  const commentCons = extractConsFromComments(ratings);
  const cons = [...new Set([...tagCons, ...commentCons])].slice(0, 4);

  const takeAgainText =
    wouldTakeAgain != null ? `${Math.round(wouldTakeAgain)}% would take again. ` : "";
  const difficultyText =
    difficulty != null ? `Difficulty rated ${difficulty.toFixed(1)}/5. ` : "";

  const summary =
    numRatings > 0
      ? `${numRatings} student reviews on Rate My Professors give an overall quality of ${overallRating.toFixed(1)}/5. ${takeAgainText}${difficultyText}Themes below come from review tags and comments.`
      : "No written reviews yet on Rate My Professors for this professor.";

  if (pros.length === 0 && ratings.some((r) => (r.quality ?? 0) >= 4)) {
    pros.push("Generally well rated by students");
  }
  if (cons.length === 0 && difficulty != null && difficulty >= 4) {
    cons.push("Students report high difficulty");
  }

  return {
    overallRating,
    summary,
    pros: pros.length > 0 ? pros : ["Not enough review data for clear pros"],
    cons: cons.length > 0 ? cons : ["Not enough review data for clear cons"],
    numRatings,
    difficulty,
    wouldTakeAgain,
  };
}

export function uniqueCourses(ratings: Rating[]): string[] {
  const courses = new Set<string>();
  for (const r of ratings) {
    if (r.course_raw?.trim()) courses.add(r.course_raw.trim());
  }
  return [...courses].slice(0, 8);
}

export function earliestReviewYear(ratings: Rating[]): string | null {
  if (ratings.length === 0) return null;
  const years = ratings.map((r) => r.date.getFullYear()).filter((y) => y > 1990);
  if (years.length === 0) return null;
  return String(Math.min(...years));
}

export function formatRecentReviews(ratings: Rating[]) {
  return ratings
    .filter((r) => r.comment?.trim())
    .slice(0, 100)
    .map((r) => ({
      comment: r.comment,
      quality: r.quality ?? 0,
      date: r.date.toLocaleDateString("en-US", { year: "numeric", month: "short" }),
      course: r.course_raw ?? undefined,
      grade: (r.details?.grade as string) ?? undefined,
      difficulty: r.difficulty ?? undefined,
      tags: r.tags,
    }));
}
export function computeRatingDistribution(ratings: Rating[]): Record<string, number> {
  const dist: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const r of ratings) {
    if (r.quality != null) {
      const bucket = Math.round(r.quality);
      if (bucket >= 1 && bucket <= 5) {
        dist[String(bucket)]++;
      }
    }
  }
  return dist;
}

export function computeDifficultyDistribution(ratings: Rating[]): Record<string, number> {
  const dist: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const r of ratings) {
    if (r.difficulty != null) {
      const bucket = Math.round(r.difficulty);
      if (bucket >= 1 && bucket <= 5) {
        dist[String(bucket)]++;
      }
    }
  }
  return dist;
}

export function computeGradeDistribution(ratings: Rating[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const r of ratings) {
    const grade = r.details?.grade;
    if (typeof grade === "string" && grade.trim()) {
      const cleanGrade = grade.trim().toUpperCase();
      let bucket = cleanGrade;
      if (/^[A-DF]/i.test(cleanGrade)) {
        bucket = cleanGrade[0];
      }
      dist[bucket] = (dist[bucket] ?? 0) + 1;
    }
  }
  return dist;
}

