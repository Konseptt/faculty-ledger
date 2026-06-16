import { describe, it, expect } from "vitest";
import { mapRawRating, parseRmpDate } from "@/lib/rmpTypes";

describe("parseRmpDate", () => {
  it("parses RMP's space-separated UTC format", () => {
    const d = parseRmpDate("2023-09-01 12:30:00 +0000 UTC");
    expect(d.getUTCFullYear()).toBe(2023);
    expect(d.getUTCMonth()).toBe(8); // September
  });

  it("falls back to epoch-safe date on garbage", () => {
    const d = parseRmpDate("not-a-date");
    expect(d instanceof Date).toBe(true);
    expect(Number.isNaN(d.getTime())).toBe(false);
  });
});

describe("mapRawRating", () => {
  it("maps RMP fields and averages clarity+helpful into quality", () => {
    const r = mapRawRating({
      comment: "Great teacher",
      clarityRating: 5,
      helpfulRating: 4,
      difficultyRating: 3,
      ratingTags: "Caring--Inspirational--Caring",
      class: "PSYC 366",
      date: "2023-09-01 12:30:00 +0000 UTC",
      grade: "A",
    });
    expect(r.quality).toBe(4.5);
    expect(r.difficulty).toBe(3);
    expect(r.tags).toEqual(["Caring", "Inspirational", "Caring"]);
    expect(r.course_raw).toBe("PSYC 366");
    expect(r.comment).toBe("Great teacher");
    expect(r.details).toEqual({ grade: "A" });
  });

  it("handles missing tags and ratings", () => {
    const r = mapRawRating({
      comment: "",
      clarityRating: null,
      helpfulRating: null,
      difficultyRating: null,
      ratingTags: "",
      class: null,
      date: "2020-01-01 00:00:00 +0000 UTC",
      grade: null,
    });
    expect(r.tags).toEqual([]);
    expect(r.quality).toBeNull();
    expect(r.details).toEqual({ grade: null });
  });
});
