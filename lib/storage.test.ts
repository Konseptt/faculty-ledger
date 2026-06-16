import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  getFavorites,
  isFavorite,
  toggleFavorite,
  type FavoriteProfessor,
} from "./storage";

class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }
}

const mockLocalStorage = new LocalStorageMock();

beforeEach(() => {
  mockLocalStorage.clear();
  vi.stubGlobal("localStorage", mockLocalStorage);
  vi.stubGlobal("window", {});
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("recentSearches", () => {
  it("starts empty", () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it("can add a search query", () => {
    const updated = addRecentSearch("John Doe", "MIT");
    expect(updated.length).toBe(1);
    expect(updated[0].name).toBe("John Doe");
    expect(updated[0].university).toBe("MIT");
    expect(updated[0].ts).toBeLessThanOrEqual(Date.now());
  });

  it("deduplicates queries and moves the newest to the front", () => {
    addRecentSearch("John Doe", "MIT");
    // Wait slightly or just write to ensure order/updates are testable
    addRecentSearch("Jane Smith", "Stanford");
    const updated = addRecentSearch("john doe ", " mit "); // case-insensitive check

    expect(updated.length).toBe(2);
    expect(updated[0].name).toBe("john doe");
    expect(updated[0].university).toBe("mit");
    expect(updated[1].name).toBe("Jane Smith");
  });

  it("caps recent searches at 10 items", () => {
    for (let i = 1; i <= 12; i++) {
      addRecentSearch(`Professor ${i}`, "University");
    }
    const searches = getRecentSearches();
    expect(searches.length).toBe(10);
    // The first searches should have been pushed out.
    // The most recent should be Professor 12.
    expect(searches[0].name).toBe("Professor 12");
    expect(searches[9].name).toBe("Professor 3");
  });

  it("can clear recent searches", () => {
    addRecentSearch("John Doe", "MIT");
    expect(getRecentSearches().length).toBe(1);
    clearRecentSearches();
    expect(getRecentSearches()).toEqual([]);
  });

  it("is safe when localStorage fails or throws errors", () => {
    const throwingStorage = {
      getItem: () => {
        throw new Error("Quota exceeded");
      },
      setItem: () => {
        throw new Error("Quota exceeded");
      },
      removeItem: () => {
        throw new Error("Quota exceeded");
      },
    };
    vi.stubGlobal("localStorage", throwingStorage);

    expect(getRecentSearches()).toEqual([]);
    expect(addRecentSearch("John Doe", "MIT")).toEqual([]);
    expect(() => clearRecentSearches()).not.toThrow();
  });
});

describe("favorites", () => {
  const prof1: FavoriteProfessor = {
    fullName: "Jane Doe",
    university: "Harvard",
    department: "Physics",
    overallRating: 4.5,
    rmpUrl: "https://example.com/jane-doe",
  };

  const prof2: FavoriteProfessor = {
    fullName: "Arthur Pendragon",
    university: "Camelot U",
    department: "History",
    overallRating: 4.8,
    rmpUrl: "https://example.com/arthur",
  };

  it("starts empty", () => {
    expect(getFavorites()).toEqual([]);
  });

  it("can add a professor to favorites", () => {
    const updated = toggleFavorite(prof1);
    expect(updated.length).toBe(1);
    expect(updated[0]).toEqual(prof1);
    expect(isFavorite(prof1.fullName, prof1.university)).toBe(true);
  });

  it("can toggle a professor off favorites", () => {
    toggleFavorite(prof1);
    expect(isFavorite(prof1.fullName, prof1.university)).toBe(true);
    const updated = toggleFavorite(prof1);
    expect(updated.length).toBe(0);
    expect(isFavorite(prof1.fullName, prof1.university)).toBe(false);
  });

  it("handles multiple favorites", () => {
    toggleFavorite(prof1);
    const updated = toggleFavorite(prof2);
    expect(updated.length).toBe(2);
    expect(isFavorite(prof1.fullName, prof1.university)).toBe(true);
    expect(isFavorite(prof2.fullName, prof2.university)).toBe(true);
  });

  it("is case-insensitive for favorite checks", () => {
    toggleFavorite(prof1);
    expect(isFavorite("jane doe", "harvard")).toBe(true);
  });

  it("is safe when localStorage is missing or throws", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(getFavorites()).toEqual([]);
    expect(isFavorite("Jane", "Harvard")).toBe(false);
    expect(toggleFavorite(prof1)).toEqual([]);
  });
});
