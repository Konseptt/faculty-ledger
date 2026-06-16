import { mapRawRating, type Professor, type RawRating, type Rating, type School } from "@/lib/rmpTypes";

const ENDPOINT = "https://www.ratemyprofessors.com/graphql";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0";
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

export function teacherNodeId(legacyId: string | number): string {
  return Buffer.from(`Teacher-${legacyId}`).toString("base64");
}
export function schoolNodeId(legacyId: string | number): string {
  return Buffer.from(`School-${legacyId}`).toString("base64");
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  let lastErr: unknown = new Error("RMP request failed");
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": USER_AGENT,
          "Accept-Language": "en-US,en;q=0.5",
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status >= 500) {
        lastErr = new Error(`RMP server error ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`RMP request failed: ${res.status}`);
      const json = (await res.json()) as { data?: T; errors?: unknown };
      if (json.errors) throw new Error(`RMP GraphQL error: ${JSON.stringify(json.errors)}`);
      return json.data as T;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt === MAX_RETRIES) break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("RMP request failed");
}

const SCHOOL_SEARCH = `query SchoolSearch($query: SchoolSearchQuery!, $count: Int!) {
  newSearch { schools(query: $query, first: $count) {
    edges { node { legacyId name city state avgRating } }
  } }
}`;

const TEACHER_SEARCH = `query TeacherSearch($query: TeacherSearchQuery!, $count: Int!) {
  newSearch { teachers(query: $query, first: $count) {
    edges { node {
      legacyId firstName lastName department
      avgRating avgDifficulty numRatings wouldTakeAgainPercent
    } }
  } }
}`;

const RATINGS_LIST = `query RatingsList($id: ID!, $count: Int!, $cursor: String) {
  node(id: $id) { ... on Teacher {
    legacyId firstName lastName department
    avgRating avgDifficulty numRatings wouldTakeAgainPercent
    ratings(first: $count, after: $cursor) {
      edges { node {
        comment helpfulRating clarityRating difficultyRating ratingTags class date grade
      } }
      pageInfo { hasNextPage endCursor }
    }
  } }
}`;

interface SchoolNode {
  legacyId: number;
  name: string;
}
interface TeacherNode {
  legacyId: number;
  firstName: string;
  lastName: string;
  department: string | null;
  avgRating: number | null;
  avgDifficulty: number | null;
  numRatings: number | null;
  wouldTakeAgainPercent: number | null;
}

function toProfessor(n: TeacherNode): Professor {
  return {
    id: String(n.legacyId),
    name: `${n.firstName ?? ""} ${n.lastName ?? ""}`.trim(),
    department: n.department,
    overall_rating: n.avgRating,
    num_ratings: n.numRatings,
    percent_take_again:
      n.wouldTakeAgainPercent != null && n.wouldTakeAgainPercent >= 0
      ? n.wouldTakeAgainPercent
      : null,
    level_of_difficulty: n.avgDifficulty,
  };
}

export async function searchSchools(text: string, count = 10): Promise<School[]> {
  const data = await gql<{ newSearch: { schools: { edges: { node: SchoolNode }[] } } }>(
    SCHOOL_SEARCH,
    { query: { text }, count },
  );
  return data.newSearch.schools.edges.map((e) => ({
    id: String(e.node.legacyId),
    name: e.node.name,
  }));
}

export async function searchProfessors(
  text: string,
  schoolLegacyId?: string,
  count = 10,
): Promise<Professor[]> {
  const query: Record<string, unknown> = { text };
  if (schoolLegacyId) query.schoolID = schoolNodeId(schoolLegacyId);
  const data = await gql<{ newSearch: { teachers: { edges: { node: TeacherNode }[] } } }>(
    TEACHER_SEARCH,
    { query, count },
  );
  return data.newSearch.teachers.edges.map((e) => toProfessor(e.node));
}

export interface RatingsPage {
  professor: Professor;
  ratings: Rating[];
  hasNextPage: boolean;
  endCursor: string | null;
}

export async function getRatingsPage(
  teacherLegacyId: string,
  cursor?: string,
  count = 20,
): Promise<RatingsPage> {
  const data = await gql<{
    node: TeacherNode & {
      ratings: {
        edges: { node: RawRating }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    };
  }>(RATINGS_LIST, { id: teacherNodeId(teacherLegacyId), count, cursor: cursor ?? null });

  const node = data.node;
  return {
    professor: toProfessor(node),
    ratings: node.ratings.edges.map((e) => mapRawRating(e.node)),
    hasNextPage: node.ratings.pageInfo.hasNextPage,
    endCursor: node.ratings.pageInfo.endCursor,
  };
}
