"use client";

interface ResultsNavProps {
  hasCourses: boolean;
}

const links = [
  { id: "result-profile", label: "Profile" },
  { id: "result-reviews", label: "Reviews" },
  { id: "result-courses", label: "Courses", optional: true },
] as const;

export function ResultsNav({ hasCourses }: ResultsNavProps) {
  const visible = links.filter((link) => !("optional" in link && link.optional) || hasCourses);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }

  return (
    <nav className="results-jump" aria-label="Jump to section">
      <span className="results-jump-label">On this page:</span>{" "}
      {visible.map((link, index) => (
        <span key={link.id}>
          {index > 0 && <span className="results-jump-sep"> · </span>}
          <button type="button" className="text-link" onClick={() => scrollTo(link.id)}>
            {link.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
