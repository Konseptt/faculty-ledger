import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CompareView, type CompareItem } from "./CompareView";
import type { ProfessorResultWithMeta } from "@/lib/types";

const mockProf1: ProfessorResultWithMeta = {
  fullName: "John Doe",
  department: "Computer Science",
  university: "Stanford University",
  teachingSince: "2015",
  reviewSummary: {
    overallRating: 4.8,
    summary: "Great teacher",
    pros: ["Helpful"],
    cons: ["Hard exams"],
  },
  coursesTaught: ["CS106A", "CS106B"],
  reviewSource: "ratemyprofessors",
  numRatings: 10,
  rmpUrl: "https://example.com/rmp1",
  difficulty: 2.5,
  wouldTakeAgain: 90,
  recentReviews: [],
  photoUrl: "https://example.com/photo1.jpg",
  ratingDistribution: {},
  difficultyDistribution: {},
};

const mockProf2: ProfessorResultWithMeta = {
  fullName: "Jane Smith",
  department: "Computer Science",
  university: "Stanford University",
  teachingSince: "2018",
  reviewSummary: {
    overallRating: 4.2,
    summary: "Decent teacher",
    pros: ["Nice"],
    cons: ["Boring lectures"],
  },
  coursesTaught: ["CS107"],
  reviewSource: "ratemyprofessors",
  numRatings: 20,
  rmpUrl: "https://example.com/rmp2",
  difficulty: 1.5, // Easiest
  wouldTakeAgain: 80,
  recentReviews: [],
  photoUrl: "https://example.com/photo2.jpg",
  ratingDistribution: {},
  difficultyDistribution: {},
};

describe("CompareView", () => {
  it("renders comparison details correctly and highlights correct metrics", () => {
    const items: CompareItem[] = [
      { success: true, data: mockProf1 },
      { success: true, data: mockProf2 },
    ];

    const html = renderToStaticMarkup(<CompareView items={items} />);

    // Check that both professors' information is rendered
    expect(html).toContain("John Doe");
    expect(html).toContain("Jane Smith");
    expect(html).toContain("Stanford University");

    // Check for ratings and courses
    expect(html).toContain("4.8");
    expect(html).toContain("4.2");
    expect(html).toContain("CS106A");
    expect(html).toContain("CS107");

    // Check highlight logic
    // John Doe has overall rating 4.8 (higher than 4.2)
    expect(html).toContain("Highest");
    expect(html).toContain("Easiest");
    expect(html).toContain("Most reviews");
    expect(html).toContain("Show differences only");
  });

  it("handles failed lookups gracefully with inline error column", () => {
    const items: CompareItem[] = [
      { success: true, data: mockProf1 },
      {
        success: false,
        error: "Professor not found on Rate My Professors.",
        fullName: "Error Prof",
        university: "Failing Univ",
      },
    ];

    const html = renderToStaticMarkup(<CompareView items={items} />);

    // Success prof is still visible
    expect(html).toContain("John Doe");

    // Failed prof name and university is visible
    expect(html).toContain("Error Prof");
    expect(html).toContain("Failing Univ");

    // Inline error column state is rendered
    expect(html).toContain("Professor not found on Rate My Professors.");
    expect(html).not.toContain("Highest");
  });
});
