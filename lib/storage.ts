export interface RecentSearch {
  name: string;
  university: string;
  ts: number;
}

export interface FavoriteProfessor {
  fullName: string;
  university: string;
  department: string;
  overallRating: number;
  rmpUrl: string;
}

const RECENT_SEARCHES_KEY = "professor_review_hub_recent_searches";
const FAVORITES_KEY = "professor_review_hub_favorites";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getRecentSearches(): RecentSearch[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error("Failed to read recent searches from localStorage", error);
    return [];
  }
}

export function addRecentSearch(name: string, university: string): RecentSearch[] {
  if (!isBrowser()) return [];
  try {
    const searches = getRecentSearches();
    const cleanName = name.trim();
    const cleanUniv = university.trim();
    if (!cleanName || !cleanUniv) return searches;

    // Filter out duplicate searches (case-insensitive comparison)
    const filtered = searches.filter(
      (s) =>
        s.name.trim().toLowerCase() !== cleanName.toLowerCase() ||
        s.university.trim().toLowerCase() !== cleanUniv.toLowerCase()
    );

    const newSearch: RecentSearch = {
      name: cleanName,
      university: cleanUniv,
      ts: Date.now(),
    };

    const updated = [newSearch, ...filtered].slice(0, 10);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Failed to save recent search to localStorage", error);
    return [];
  }
}

export function clearRecentSearches(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error("Failed to clear recent searches from localStorage", error);
  }
}

export function getFavorites(): FavoriteProfessor[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error("Failed to read favorites from localStorage", error);
    return [];
  }
}

export function isFavorite(fullName: string, university: string): boolean {
  if (!isBrowser()) return false;
  try {
    const favorites = getFavorites();
    const cleanName = fullName.trim().toLowerCase();
    const cleanUniv = university.trim().toLowerCase();
    return favorites.some(
      (fav) =>
        fav.fullName.trim().toLowerCase() === cleanName &&
        fav.university.trim().toLowerCase() === cleanUniv
    );
  } catch (error) {
    console.error("Failed to check if professor is favorited", error);
    return false;
  }
}

export function toggleFavorite(prof: FavoriteProfessor): FavoriteProfessor[] {
  if (!isBrowser()) return [];
  try {
    const favorites = getFavorites();
    const cleanName = prof.fullName.trim().toLowerCase();
    const cleanUniv = prof.university.trim().toLowerCase();

    const exists = favorites.some(
      (fav) =>
        fav.fullName.trim().toLowerCase() === cleanName &&
        fav.university.trim().toLowerCase() === cleanUniv
    );

    let updated: FavoriteProfessor[];
    if (exists) {
      updated = favorites.filter(
        (fav) =>
          fav.fullName.trim().toLowerCase() !== cleanName ||
          fav.university.trim().toLowerCase() !== cleanUniv
      );
    } else {
      updated = [...favorites, prof];
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Failed to toggle favorite in localStorage", error);
    return [];
  }
}

