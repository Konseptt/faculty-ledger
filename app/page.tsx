"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CompareView, type CompareItem } from "@/components/CompareView";
import { CourseTags } from "@/components/CourseTags";
import { ExampleSearches } from "@/components/ExampleSearches";
import { ProfessorJsonLd } from "@/components/ProfessorJsonLd";
import { ProfessorProfile } from "@/components/ProfessorProfile";
import { ResultsNav } from "@/components/ResultsNav";
import { ReviewDashboard } from "@/components/ReviewDashboard";
import { SearchHero } from "@/components/SearchHero";
import { SiteHeader } from "@/components/SiteHeader";
import { SocialShare } from "@/components/SocialShare";
import { createToast, ToastStack, type ToastMessage } from "@/components/Toast";
import { toastCopy, uiCopy } from "@/lib/copy";
import type { ProfessorResultWithMeta } from "@/lib/types";
import { siteConfig } from "@/lib/site";
import {
  addRecentSearch,
  getFavorites,
  getRecentSearches,
  toggleFavorite,
  type FavoriteProfessor,
  type RecentSearch,
} from "@/lib/storage";

export default function Home() {
  const [professorName, setProfessorName] = useState("");
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProfessorResultWithMeta | null>(null);
  const [compareResults, setCompareResults] = useState<CompareItem[] | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [searched, setSearched] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [favorites, setFavorites] = useState<FavoriteProfessor[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
    setFavorites(getFavorites());
    const saved = localStorage.getItem("professor_review_theme");
    const preferDark = saved === "dark";
    setIsDarkMode(preferDark);
    if (preferDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const addToast = useCallback((text: string, type: ToastMessage["type"] = "error") => {
    setToasts((prev) => [...prev, createToast(text, type)]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const runSearchWith = useCallback(
    async (name: string, uni: string) => {
      setLoading(true);
      setSearched(true);
      setCompareResults(null);
      setIsCompareMode(false);

      try {
        const response = await fetch("/api/professor-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ professorName: name.trim(), university: uni.trim() }),
        });
        const data = await response.json();

        if (!response.ok) {
          addToast(data.error ?? toastCopy.genericError);
          setResult(null);
          return;
        }

        const searchResult = data as ProfessorResultWithMeta;
        setResult(searchResult);
        setRecentSearches(addRecentSearch(searchResult.fullName, searchResult.university));
      } catch {
        addToast(toastCopy.serverError);
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [addToast],
  );

  const pickExample = useCallback(
    (name: string, uni: string) => {
      setProfessorName(name);
      setUniversity(uni);
      runSearchWith(name, uni);
    },
    [runSearchWith],
  );

  useEffect(() => {
    if (loading) return;
    if (result || compareResults) {
      scrollToResults();
    }
  }, [result, compareResults, loading, scrollToResults]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("name");
    const uni = params.get("university");
    if (name && uni) {
      setProfessorName(name);
      setUniversity(uni);
      runSearchWith(name, uni);
    }
  }, [runSearchWith]);

  useEffect(() => {
    if (!result) {
      document.title = `${siteConfig.name} | Professor Reviews & Ratings`;
      return;
    }
    const rating = result.reviewSummary.overallRating.toFixed(1);
    document.title = `${result.fullName} (${rating}/5) at ${result.university} | ${siteConfig.name}`;

    const description = `${result.fullName} at ${result.university}: ${result.reviewSummary.summary.slice(0, 140)}…`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [result]);

  async function handleSearch() {
    if (!professorName.trim() || !university.trim()) {
      addToast(toastCopy.missingFields);
      return;
    }
    await runSearchWith(professorName, university);
  }

  async function handleExtractAndSearch(text: string) {
    if (!text.trim()) {
      addToast(toastCopy.missingPaste);
      return;
    }

    setLoading(true);
    setCompareResults(null);
    setIsCompareMode(false);

    try {
      const res = await fetch("/api/extract-professor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (!res.ok) {
        addToast(data.error ?? toastCopy.syllabusFail);
        return;
      }

      setProfessorName(data.professorName);
      if (data.university) {
        setUniversity(data.university);
        await runSearchWith(data.professorName, data.university);
      } else {
        addToast(toastCopy.syllabusPartial, "info");
        setLoading(false);
      }
    } catch {
      addToast("Could not reach the server.");
      setLoading(false);
    }
  }

  async function handleCompareSubmit(rows: { name: string; university: string }[]) {
    if (rows.length < 2) {
      addToast(toastCopy.missingCompare);
      return;
    }

    const validRows = rows.map((r) => ({
      name: r.name.trim(),
      university: r.university.trim(),
    }));

    if (validRows.some((r) => !r.name || !r.university)) {
      addToast(toastCopy.incompleteCompare);
      return;
    }

    setLoading(true);
    setSearched(true);
    setResult(null);
    setIsCompareMode(true);

    try {
      const responses = await Promise.all(
        validRows.map(async (row) => {
          try {
            const res = await fetch("/api/professor-search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                professorName: row.name,
                university: row.university,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              return {
                success: false as const,
                error: data.error || "Not found.",
                fullName: row.name,
                university: row.university,
              };
            }
            return { success: true as const, data: data as ProfessorResultWithMeta };
          } catch {
            return {
              success: false as const,
              error: "Network error.",
              fullName: row.name,
              university: row.university,
            };
          }
        }),
      );

      setCompareResults(responses);
    } catch {
      addToast(toastCopy.compareFail);
      setCompareResults(null);
    } finally {
      setLoading(false);
    }
  }

  function handleToggleFavorite() {
    if (!result) return;
    setFavorites(
      toggleFavorite({
        fullName: result.fullName,
        university: result.university,
        department: result.department,
        overallRating: result.reviewSummary.overallRating,
        rmpUrl: result.rmpUrl,
      }),
    );
  }

  function handleToggleTheme() {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("professor_review_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("professor_review_theme", "light");
    }
  }

  const isFavorited = result
    ? favorites.some(
        (f) =>
          f.fullName.trim().toLowerCase() === result.fullName.trim().toLowerCase() &&
          f.university.trim().toLowerCase() === result.university.trim().toLowerCase(),
      )
    : false;

  const showEmpty = !searched && !result && !compareResults;
  const showNotFound = searched && !loading && !result && !compareResults;

  return (
    <div className="hub-page">
      {loading && <div className="loading-bar" aria-hidden="true" />}

      <SiteHeader isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} />

      <SearchHero
        professorName={professorName}
        university={university}
        loading={loading}
        onProfessorNameChange={setProfessorName}
        onUniversityChange={setUniversity}
        onSubmit={handleSearch}
        onExtractAndSearch={handleExtractAndSearch}
        onCompareSubmit={handleCompareSubmit}
        recentSearches={recentSearches}
        onRecentSearchClick={(name, uni) => {
          setProfessorName(name);
          setUniversity(uni);
          runSearchWith(name, uni);
        }}
      />

      {showEmpty && (
        <ExampleSearches onPick={pickExample} disabled={loading} />
      )}

      {!result && !compareResults && <hr className="rule" />}

      <div className="content-area" ref={resultsRef} aria-live="polite">
        {showEmpty && <p className="empty-note">{uiCopy.emptyState}</p>}

        {showNotFound && <p className="empty-note">{uiCopy.notFound}</p>}

        {!isCompareMode && result && (
          <>
            <ResultsNav
              hasCourses={
                result.coursesTaught.length > 0 &&
                result.coursesTaught[0] !== "No courses listed in reviews"
              }
            />
            <article className="results-enter results-layout">
            <ProfessorJsonLd data={result} />
            <aside className="results-sidebar">
              <ProfessorProfile
                data={result}
                isFavorited={isFavorited}
                onToggleFavorite={handleToggleFavorite}
              />
              <SocialShare
                professorName={result.fullName}
                university={result.university}
                rating={result.reviewSummary.overallRating}
              />
            </aside>
            <div className="results-main">
              <ReviewDashboard data={result} />
              <CourseTags courses={result.coursesTaught} />
            </div>
          </article>
          </>
        )}

        {isCompareMode && compareResults && !loading && (
          <div className="results-enter">
            <CompareView items={compareResults} />
          </div>
        )}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
