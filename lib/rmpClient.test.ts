import { describe, it, expect, vi, afterEach } from "vitest";
import { teacherNodeId, schoolNodeId, searchSchools, searchProfessors, getRatingsPage } from "@/lib/rmpClient";

function mockFetchOnce(data: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ data }),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("relay ids", () => {
  it("base64-encodes node ids", () => {
    expect(teacherNodeId("12345")).toBe(Buffer.from("Teacher-12345").toString("base64"));
    expect(schoolNodeId("99")).toBe(Buffer.from("School-99").toString("base64"));
  });
});

describe("searchSchools", () => {
  it("returns school nodes", async () => {
    const fn = mockFetchOnce({
      newSearch: { schools: { edges: [{ node: { legacyId: 5, name: "Stanford University", city: "Stanford", state: "CA", avgRating: 4 } }] } },
    });
    const schools = await searchSchools("Stanford");
    expect(schools).toEqual([{ id: "5", name: "Stanford University" }]);
    expect(fn).toHaveBeenCalledOnce();
    const body = JSON.parse((fn.mock.calls[0][1] as RequestInit).body as string);
    expect(body.variables.query.text).toBe("Stanford");
  });
});

describe("searchProfessors", () => {
  it("includes schoolID when school given and maps names", async () => {
    const fn = mockFetchOnce({
      newSearch: { teachers: { edges: [{ node: { legacyId: 7, firstName: "Jane", lastName: "Smith", department: "Psychology", avgRating: 4.2, avgDifficulty: 3.1, numRatings: 10, wouldTakeAgainPercent: 80 } }] } },
    });
    const profs = await searchProfessors("Jane Smith", "5");
    expect(profs[0]).toMatchObject({ id: "7", name: "Jane Smith", department: "Psychology", overall_rating: 4.2, num_ratings: 10, percent_take_again: 80, level_of_difficulty: 3.1 });
    const body = JSON.parse((fn.mock.calls[0][1] as RequestInit).body as string);
    expect(body.variables.query.schoolID).toBe(schoolNodeId("5"));
  });
});

describe("getRatingsPage", () => {
  it("maps ratings and pagination", async () => {
    mockFetchOnce({
      node: {
        legacyId: 7, firstName: "Jane", lastName: "Smith", department: "Psychology",
        avgRating: 4.2, avgDifficulty: 3.1, numRatings: 10, wouldTakeAgainPercent: 80,
        ratings: {
          edges: [{ node: { comment: "Good", clarityRating: 5, helpfulRating: 5, difficultyRating: 2, ratingTags: "Caring--Fun", class: "PSYC 101", date: "2023-01-01 00:00:00 +0000 UTC", grade: "B+" } }],
          pageInfo: { hasNextPage: true, endCursor: "abc" },
        },
      },
    });
    const page = await getRatingsPage("7");
    expect(page.professor.name).toBe("Jane Smith");
    expect(page.ratings[0].quality).toBe(5);
    expect(page.ratings[0].tags).toEqual(["Caring", "Fun"]);
    expect(page.hasNextPage).toBe(true);
    expect(page.endCursor).toBe("abc");
  });
});
