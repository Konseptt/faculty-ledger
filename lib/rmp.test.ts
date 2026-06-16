import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/rmpClient", () => ({
  searchSchools: vi.fn(),
  searchProfessors: vi.fn(),
  getRatingsPage: vi.fn(),
  rmpProfileUrlBase: "",
}));

import {
  fetchProfessorFromRmp,
  computeRatingDistribution,
  computeDifficultyDistribution,
  computeGradeDistribution,
} from "@/lib/rmp";
import * as client from "@/lib/rmpClient";
import type { Rating } from "@/lib/rmpTypes";

const prof = {
  id: "7", name: "Jane Smith", department: "Psychology",
  overall_rating: 4.2, num_ratings: 40, percent_take_again: 80, level_of_difficulty: 3,
};

beforeEach(() => {
  vi.mocked(client.searchSchools).mockResolvedValue([{ id: "5", name: "Stanford University" }]);
  vi.mocked(client.searchProfessors).mockResolvedValue([prof]);
});

describe("fetchProfessorFromRmp", () => {
  it("follows pagination until hasNextPage is false", async () => {
    vi.mocked(client.getRatingsPage)
      .mockResolvedValueOnce({ professor: prof, ratings: [{ date: new Date(), comment: "a", quality: 5, difficulty: 2, tags: [], course_raw: "PSYC 101", details: { grade: "A" } }], hasNextPage: true, endCursor: "c1" })
      .mockResolvedValueOnce({ professor: prof, ratings: [{ date: new Date(), comment: "b", quality: 4, difficulty: 3, tags: [], course_raw: "PSYC 102", details: { grade: "B" } }], hasNextPage: false, endCursor: null });

    const result = await fetchProfessorFromRmp("Jane Smith", "Stanford University");
    expect(result).not.toBeNull();
    expect(result!.ratings).toHaveLength(2);
    expect(vi.mocked(client.getRatingsPage)).toHaveBeenCalledTimes(2);
  });

  it("returns null when no school matches", async () => {
    vi.mocked(client.searchSchools).mockResolvedValue([]);
    expect(await fetchProfessorFromRmp("X", "Nowhere")).toBeNull();
  });
});

describe("distribution helper functions", () => {
  const dummyRatings: Rating[] = [
    { date: new Date(), comment: "1", quality: 4.5, difficulty: 1.2, tags: [], course_raw: "C1", details: { grade: "A+" } },
    { date: new Date(), comment: "2", quality: 3.8, difficulty: 2.5, tags: [], course_raw: "C2", details: { grade: "b-" } },
    { date: new Date(), comment: "3", quality: 2.1, difficulty: 4.0, tags: [], course_raw: "C3", details: { grade: "F" } },
    { date: new Date(), comment: "4", quality: 1.0, difficulty: 5.0, tags: [], course_raw: "C4", details: { grade: "WD" } },
    { date: new Date(), comment: "5", quality: null, difficulty: null, tags: [], course_raw: "C5", details: null },
  ];

  it("computes rating distribution", () => {
    const dist = computeRatingDistribution(dummyRatings);
    expect(dist).toEqual({
      "1": 1, // 1.0 rounds to 1
      "2": 1, // 2.1 rounds to 2
      "3": 0,
      "4": 1, // 3.8 rounds to 4
      "5": 1, // 4.5 rounds to 5
    });
  });

  it("computes difficulty distribution", () => {
    const dist = computeDifficultyDistribution(dummyRatings);
    expect(dist).toEqual({
      "1": 1, // 1.2 rounds to 1
      "2": 0, 
      "3": 1, // 2.5 rounds to 3
      "4": 1, // 4.0 rounds to 4
      "5": 1, // 5.0 rounds to 5
    });
  });

  it("computes grade distribution", () => {
    const dist = computeGradeDistribution(dummyRatings);
    expect(dist).toEqual({
      "A": 1, // "A+" -> "A"
      "B": 1, // "b-" -> "B"
      "F": 1, // "F" -> "F"
      "WD": 1, // "WD" -> "WD" (starts with W, not A-D/F, so stays WD)
    });
  });
});

