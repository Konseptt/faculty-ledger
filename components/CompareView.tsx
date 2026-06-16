"use client";

import React, { useMemo, useState } from "react";
import { uiCopy } from "@/lib/copy";
import type { ProfessorResultWithMeta } from "@/lib/types";

export type CompareItem =
  | { success: true; data: ProfessorResultWithMeta }
  | { success: false; error: string; fullName: string; university: string };

interface CompareViewProps {
  items: CompareItem[];
}

type CompareRow = {
  id: string;
  category: string;
  label: string;
  getValue: (data: ProfessorResultWithMeta) => string;
  isDifferent: (items: Extract<CompareItem, { success: true }>[]) => boolean;
  highlight?: (
    item: Extract<CompareItem, { success: true }>,
    items: Extract<CompareItem, { success: true }>[],
  ) => string | null;
};

function formatCourses(courses: string[]) {
  if (courses.length === 0 || courses[0] === "No courses listed in reviews") {
    return "None listed";
  }
  return courses.slice(0, 4).join(" · ");
}

export function CompareView({ items }: CompareViewProps) {
  const [differencesOnly, setDifferencesOnly] = useState(false);

  const successItems = items.filter(
    (item): item is Extract<CompareItem, { success: true }> => item.success,
  );
  const showHighlights = successItems.length >= 2;

  const maxOverallRating = showHighlights
    ? Math.max(...successItems.map((item) => item.data.reviewSummary.overallRating))
    : -1;

  const validDifficulties = successItems
    .map((item) => item.data.difficulty)
    .filter((d): d is number => d !== undefined);
  const minDifficulty =
    showHighlights && validDifficulties.length > 0 ? Math.min(...validDifficulties) : -1;

  const validWouldTakeAgains = successItems
    .map((item) => item.data.wouldTakeAgain)
    .filter((w): w is number => w !== undefined && w !== -1);
  const maxWouldTakeAgain =
    showHighlights && validWouldTakeAgains.length > 0
      ? Math.max(...validWouldTakeAgains)
      : -1;

  const maxNumRatings = showHighlights
    ? Math.max(...successItems.map((item) => item.data.numRatings))
    : -1;

  const rows: CompareRow[] = useMemo(
    () => [
      {
        id: "rating",
        category: "Student scores",
        label: "Overall rating",
        getValue: (data) => `${data.reviewSummary.overallRating.toFixed(1)} / 5`,
        isDifferent: (list) =>
          new Set(list.map((i) => i.data.reviewSummary.overallRating.toFixed(1))).size > 1,
        highlight: (item, list) =>
          showHighlights &&
          list.length >= 2 &&
          item.data.reviewSummary.overallRating === maxOverallRating
            ? "Highest"
            : null,
      },
      {
        id: "difficulty",
        category: "Student scores",
        label: "Difficulty",
        getValue: (data) =>
          data.difficulty != null ? `${data.difficulty.toFixed(1)} / 5` : "N/A",
        isDifferent: (list) => {
          const vals = list.map((i) =>
            i.data.difficulty != null ? i.data.difficulty.toFixed(1) : "na",
          );
          return new Set(vals).size > 1;
        },
        highlight: (item, list) =>
          showHighlights &&
          item.data.difficulty != null &&
          item.data.difficulty === minDifficulty
            ? "Easiest"
            : null,
      },
      {
        id: "retake",
        category: "Student scores",
        label: "Would take again",
        getValue: (data) =>
          data.wouldTakeAgain != null ? `${Math.round(data.wouldTakeAgain)}%` : "N/A",
        isDifferent: (list) => {
          const vals = list.map((i) =>
            i.data.wouldTakeAgain != null ? Math.round(i.data.wouldTakeAgain) : "na",
          );
          return new Set(vals).size > 1;
        },
        highlight: (item, list) =>
          showHighlights &&
          item.data.wouldTakeAgain != null &&
          item.data.wouldTakeAgain === maxWouldTakeAgain
            ? "Highest"
            : null,
      },
      {
        id: "reviews",
        category: "Trust signals",
        label: "Review count",
        getValue: (data) => String(data.numRatings),
        isDifferent: (list) => new Set(list.map((i) => i.data.numRatings)).size > 1,
        highlight: (item, list) =>
          showHighlights && item.data.numRatings === maxNumRatings && item.data.numRatings > 0
            ? "Most reviews"
            : null,
      },
      {
        id: "courses",
        category: "Teaching",
        label: "Courses mentioned",
        getValue: (data) => formatCourses(data.coursesTaught),
        isDifferent: (list) =>
          new Set(list.map((i) => formatCourses(i.data.coursesTaught))).size > 1,
      },
    ],
    [
      maxNumRatings,
      maxOverallRating,
      maxWouldTakeAgain,
      minDifficulty,
      showHighlights,
    ],
  );

  const visibleRows = useMemo(() => {
    if (!differencesOnly || successItems.length < 2) return rows;
    return rows.filter((row) => row.isDifferent(successItems));
  }, [differencesOnly, rows, successItems]);

  let lastCategory = "";

  return (
    <section className="compare-section" aria-labelledby="compare-heading">
      <div className="compare-toolbar">
        <h3 id="compare-heading" className="compare-title">
          {uiCopy.compareTitle}
        </h3>
        {successItems.length >= 2 && (
          <label className="compare-toggle">
            <input
              type="checkbox"
              checked={differencesOnly}
              onChange={(e) => setDifferencesOnly(e.target.checked)}
            />
            <span className="compare-toggle-text">Show differences only</span>
            <span className="compare-toggle-hint">Hides rows where professors match</span>
          </label>
        )}
      </div>

      <div className="compare-scroll">
        <table className="compare-table">
          <caption className="visually-hidden">
            Comparison of {items.length} professors by rating, difficulty, retake rate, review
            count, and courses
          </caption>
          <thead>
            <tr>
              <th scope="col" className="compare-label-col">
                Attribute
              </th>
              {items.map((item, idx) => (
                <th key={idx} scope="col" className="compare-prof-col">
                  {item.success ? (
                    <>
                      {item.data.photoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.data.photoUrl}
                          alt=""
                          className="compare-thumb"
                          loading="lazy"
                        />
                      )}
                      <span className="compare-prof-name">{item.data.fullName}</span>
                      <span className="compare-prof-meta">{item.data.department}</span>
                      <span className="compare-prof-meta">{item.data.university}</span>
                    </>
                  ) : (
                    <>
                      <span className="compare-prof-name">{item.fullName}</span>
                      <span className="compare-prof-meta">{item.university}</span>
                      <span className="compare-fail">{item.error}</span>
                    </>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && differencesOnly && (
              <tr>
                <td colSpan={items.length + 1} className="compare-empty-row">
                  All professors match on every attribute. Turn off &ldquo;Show differences
                  only&rdquo; to see the full table.
                </td>
              </tr>
            )}
            {visibleRows.map((row) => {
              const showCategory = row.category !== lastCategory;
              lastCategory = row.category;
              return (
                <React.Fragment key={row.id}>
                  {showCategory && (
                    <tr className="compare-category-row">
                      <th scope="colgroup" colSpan={items.length + 1}>
                        {row.category}
                      </th>
                    </tr>
                  )}
                  <tr className="compare-data-row">
                    <th scope="row" className="compare-row-label">
                      {row.label}
                    </th>
                    {items.map((item, idx) =>
                      item.success ? (
                        <td key={idx} className="compare-cell">
                          {row.id === "courses" ? (
                            <span className="compare-courses">{row.getValue(item.data)}</span>
                          ) : (
                            row.getValue(item.data)
                          )}
                          {row.highlight?.(item, successItems) && (
                            <span className="compare-best">
                              {row.highlight(item, successItems)}
                            </span>
                          )}
                        </td>
                      ) : (
                        <td key={idx} className="compare-cell compare-cell-empty">
                          n/a
                        </td>
                      ),
                    )}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
