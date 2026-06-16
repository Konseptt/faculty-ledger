import { describe, it, expect } from "vitest";
import { scoreSentiment } from "@/lib/sentiment";

describe("scoreSentiment", () => {
  it("flags clearly negative comments", () => {
    expect(scoreSentiment("Terrible class, boring and confusing. Avoid.")).toBe("negative");
  });
  it("flags clearly positive comments", () => {
    expect(scoreSentiment("Amazing professor, clear and helpful. Loved it.")).toBe("positive");
  });
  it("returns neutral when no signal", () => {
    expect(scoreSentiment("The class met on Tuesdays.")).toBe("neutral");
  });
});
