import { describe, it, expect } from "vitest";
import { initials, initialsAvatarDataUri } from "@/lib/initialsAvatar";

describe("initials", () => {
  it("takes first + last initial", () => {
    expect(initials("Jane Smith")).toBe("JS");
  });
  it("handles single name", () => {
    expect(initials("Plato")).toBe("P");
  });
  it("handles empty", () => {
    expect(initials("")).toBe("?");
  });
});

describe("initialsAvatarDataUri", () => {
  it("returns an svg data uri containing the initials", () => {
    const uri = initialsAvatarDataUri("Jane Smith", "#123456");
    expect(uri.startsWith("data:image/svg+xml;base64,")).toBe(true);
    const base64Content = uri.substring("data:image/svg+xml;base64,".length);
    const decoded = Buffer.from(base64Content, "base64").toString("utf-8");
    expect(decoded).toContain("JS");
    expect(decoded).toContain("#123456");
  });
});
