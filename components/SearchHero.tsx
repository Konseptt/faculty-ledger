"use client";

import { useEffect, useRef, useState } from "react";
import { fieldHints, searchModeOptions, uiCopy, type SearchMode } from "@/lib/copy";
import type { RecentSearch } from "@/lib/storage";

export type { SearchMode };

interface SearchHeroProps {
  professorName: string;
  university: string;
  loading: boolean;
  onProfessorNameChange: (value: string) => void;
  onUniversityChange: (value: string) => void;
  onSubmit: () => void;
  onExtractAndSearch: (text: string) => void;
  onCompareSubmit: (rows: { name: string; university: string }[]) => void;
  recentSearches?: RecentSearch[];
  onRecentSearchClick?: (name: string, university: string) => void;
}

export function SearchHero({
  professorName,
  university,
  loading,
  onProfessorNameChange,
  onUniversityChange,
  onSubmit,
  onExtractAndSearch,
  onCompareSubmit,
  recentSearches = [],
  onRecentSearchClick,
}: SearchHeroProps) {
  const [mode, setMode] = useState<SearchMode>("name");
  const [pasted, setPasted] = useState("");
  const [compareRows, setCompareRows] = useState([
    { name: "", university: "" },
    { name: "", university: "" },
  ]);

  const activeMode = searchModeOptions.find((option) => option.id === mode)!;
  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (loading) return;
    firstFieldRef.current?.focus();
  }, [mode, loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "name") onSubmit();
    else if (mode === "paste") onExtractAndSearch(pasted);
    else onCompareSubmit(compareRows);
  }

  return (
    <section id="search-panel" className="search-block" aria-labelledby="search-heading">
      <h2 id="search-heading" className="visually-hidden">
        Professor search
      </h2>
      <p className="search-lede">{uiCopy.searchLede}</p>

      <nav className="mode-nav" aria-label="Search method">
        {searchModeOptions.map((option, index) => (
          <span key={option.id} className="mode-nav-item">
            {index > 0 && (
              <span className="mode-nav-sep" aria-hidden="true">
                ·
              </span>
            )}
            <button
              type="button"
              className={`mode-nav-link ${mode === option.id ? "mode-nav-link-active" : ""}`}
              onClick={() => setMode(option.id)}
              disabled={loading}
              aria-pressed={mode === option.id}
            >
              {option.label}
            </button>
          </span>
        ))}
      </nav>
      <p className="mode-desc" id="active-mode-note">
        {activeMode.description}
      </p>

      <form onSubmit={handleSubmit} className="search-form" aria-busy={loading}>
        <div className="search-toolbar">
          <div key={mode} className="search-mode-panel">
            {mode === "name" && (
              <div className="search-row search-row-single">
                <div className="field-wrap">
                  <label htmlFor="professor-name" className="field-label">
                    Professor name
                  </label>
                  <span id="professor-name-hint" className="field-hint">
                    {fieldHints.professorName}
                  </span>
                  <input
                    ref={firstFieldRef as React.RefObject<HTMLInputElement>}
                    id="professor-name"
                    type="text"
                    className="field-input"
                    placeholder="Jane Smith"
                    value={professorName}
                    onChange={(e) => onProfessorNameChange(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                    name="professor-name"
                    suppressHydrationWarning
                    aria-describedby="active-mode-note professor-name-hint"
                  />
                </div>
                <div className="field-wrap">
                  <label htmlFor="university" className="field-label">
                    University or college
                  </label>
                  <span id="university-hint" className="field-hint">
                    {fieldHints.university}
                  </span>
                  <input
                    id="university"
                    type="text"
                    className="field-input"
                    placeholder="Stanford University"
                    value={university}
                    onChange={(e) => onUniversityChange(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                    name="university"
                    suppressHydrationWarning
                    aria-describedby="active-mode-note university-hint"
                  />
                </div>
              </div>
            )}

            {mode === "paste" && (
              <div className="field-wrap">
                <label htmlFor="course-desc" className="field-label">
                  Paste syllabus or course description
                </label>
                <span id="course-desc-hint" className="field-hint">
                  {fieldHints.syllabus}
                </span>
                <textarea
                  ref={firstFieldRef as React.RefObject<HTMLTextAreaElement>}
                  id="course-desc"
                  className="field-input field-textarea"
                  rows={6}
                  placeholder="Paste syllabus text here"
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                  name="course-description"
                  suppressHydrationWarning
                  aria-describedby="active-mode-note course-desc-hint"
                />
              </div>
            )}

            {mode === "compare" && (
              <div className="compare-fields">
                {compareRows.map((row, index) => (
                  <div key={index} className="compare-row">
                    <p className="compare-field-label">Professor {index + 1}</p>
                    <div className="search-row">
                      <div className="field-wrap">
                        <label htmlFor={`compare-name-${index}`} className="field-label">
                          Professor name
                        </label>
                        <input
                          id={`compare-name-${index}`}
                          ref={
                            index === 0
                              ? (firstFieldRef as React.RefObject<HTMLInputElement>)
                              : undefined
                          }
                          type="text"
                          className="field-input"
                          placeholder="Full name"
                          value={row.name}
                          onChange={(e) =>
                            setCompareRows((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, name: e.target.value } : r,
                              ),
                            )
                          }
                          disabled={loading}
                          autoComplete="off"
                          name={`compare-name-${index}`}
                          suppressHydrationWarning
                        />
                      </div>
                      <div className="field-wrap">
                        <label htmlFor={`compare-uni-${index}`} className="field-label">
                          University or college
                        </label>
                        <input
                          id={`compare-uni-${index}`}
                          type="text"
                          className="field-input"
                          placeholder="School name"
                          value={row.university}
                          onChange={(e) =>
                            setCompareRows((prev) =>
                              prev.map((r, i) =>
                                i === index ? { ...r, university: e.target.value } : r,
                              ),
                            )
                          }
                          disabled={loading}
                          autoComplete="off"
                          name={`compare-university-${index}`}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                    {compareRows.length > 2 && (
                      <button
                        type="button"
                        className="text-link text-link-small"
                        onClick={() => setCompareRows((prev) => prev.filter((_, i) => i !== index))}
                        disabled={loading}
                      >
                        Remove professor {index + 1}
                      </button>
                    )}
                  </div>
                ))}
                {compareRows.length < 3 && (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() =>
                      setCompareRows((prev) => [...prev, { name: "", university: "" }])
                    }
                    disabled={loading}
                  >
                    Add third professor
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              className="search-btn"
              disabled={loading}
              aria-label={loading ? activeMode.loadingLabel : activeMode.submitLabel}
            >
              {loading ? (
                <>
                  <span className="ink-spinner" aria-hidden="true" />
                  {activeMode.loadingLabel}
                </>
              ) : (
                activeMode.submitLabel
              )}
            </button>
          </div>
        </div>
      </form>

      {mode === "name" && recentSearches.length > 0 && (
        <div className="recent-block">
          <p className="recent-label" id="recent-searches-label">
            {uiCopy.recentSearchesLabel}
          </p>
          <p className="recent-list">
            {recentSearches.map((s, i) => (
              <span key={`${s.name}-${s.university}-${i}`}>
                {i > 0 && <span className="recent-sep"> · </span>}
                <button
                  type="button"
                  className="text-link recent-link"
                  onClick={() => onRecentSearchClick?.(s.name, s.university)}
                >
                  {s.name}, {s.university}
                </button>
              </span>
            ))}
          </p>
        </div>
      )}
    </section>
  );
}
