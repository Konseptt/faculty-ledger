import { describe, it, expect } from "vitest";
import { extractProfessorHeuristic } from "@/lib/extractProfessor";

describe("extractProfessorHeuristic", () => {
  it("extracts an Instructor: label and university", () => {
    const text = "PSYC 366 Behavior Modification. Instructor: Jane Smith. Stanford University. MWF 10am.";
    const out = extractProfessorHeuristic(text);
    expect(out.professorName).toBe("Jane Smith");
    expect(out.university).toBe("Stanford University");
    expect(out.course).toBe("PSYC 366");
    expect(out.confidence).toBe("high");
  });

  it("extracts 'taught by' phrasing", () => {
    const out = extractProfessorHeuristic("This course is taught by Dr. Alan Turing at King's College.");
    expect(out.professorName).toBe("Alan Turing");
  });

  it("returns low confidence and empty name when nothing matches", () => {
    const out = extractProfessorHeuristic("The course meets on Tuesdays in room 204.");
    expect(out.professorName).toBe("");
    expect(out.confidence).toBe("low");
  });
});
