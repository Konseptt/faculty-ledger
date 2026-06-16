"use client";

import { useState } from "react";
import { uiCopy } from "@/lib/copy";

interface CourseTagsProps {
  courses: string[];
}

const INITIAL_VISIBLE = 8;

export function CourseTags({ courses }: CourseTagsProps) {
  const [expanded, setExpanded] = useState(false);

  if (courses.length === 0 || courses[0] === "No courses listed in reviews") {
    return null;
  }

  const visible = expanded ? courses : courses.slice(0, INITIAL_VISIBLE);
  const hiddenCount = courses.length - INITIAL_VISIBLE;

  return (
    <section className="courses-line" id="result-courses" aria-labelledby="courses-heading">
      <h3 id="courses-heading">{uiCopy.coursesHeading}</h3>
      <p className="course-list">
        {visible.map((course, index) => (
          <span key={course}>
            {index > 0 && " · "}
            <span>{course}</span>
          </span>
        ))}
      </p>
      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          className="text-link text-link-small"
          onClick={() => setExpanded(true)}
        >
          Show {hiddenCount} more
        </button>
      )}
      {expanded && courses.length > INITIAL_VISIBLE && (
        <button type="button" className="text-link text-link-small" onClick={() => setExpanded(false)}>
          Show fewer
        </button>
      )}
    </section>
  );
}
