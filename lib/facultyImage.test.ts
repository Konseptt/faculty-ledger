import { describe, it, expect, vi, afterEach } from "vitest";
import { isValidImageResponse, resolveProfessorPhoto, __clearPhotoCache } from "@/lib/facultyImage";

afterEach(() => {
  vi.unstubAllGlobals();
  __clearPhotoCache();
});

describe("isValidImageResponse", () => {
  it("accepts an image/* response with size", () => {
    const headers = new Headers({ "content-type": "image/jpeg", "content-length": "8000" });
    expect(isValidImageResponse({ ok: true, headers } as Response)).toBe(true);
  });
  it("rejects html", () => {
    const headers = new Headers({ "content-type": "text/html" });
    expect(isValidImageResponse({ ok: true, headers } as Response)).toBe(false);
  });
  it("rejects tiny tracking pixels", () => {
    const headers = new Headers({ "content-type": "image/gif", "content-length": "40" });
    expect(isValidImageResponse({ ok: true, headers } as Response)).toBe(false);
  });
});

describe("resolveProfessorPhoto", () => {
  it("always returns an initials monogram as the floor", async () => {
    // Force the university + wikipedia tiers to yield nothing.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, headers: new Headers() }));
    const result = await resolveProfessorPhoto("Jane Smith", "Nowhere University", "Psychology");
    expect(result.source).toBe("initials");
    expect(result.photoUrl.startsWith("data:image/svg+xml;base64,")).toBe(true);
  });

  it("caches results by name|university", async () => {
    const fn = vi.fn().mockResolvedValue({ ok: false, status: 404, headers: new Headers() });
    vi.stubGlobal("fetch", fn);
    await resolveProfessorPhoto("Jane Smith", "Nowhere University", "Psychology");
    const callsAfterFirst = fn.mock.calls.length;
    await resolveProfessorPhoto("Jane Smith", "Nowhere University", "Psychology");
    expect(fn.mock.calls.length).toBe(callsAfterFirst); // no new network calls
  });
});
