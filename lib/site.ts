export const siteConfig = {
  name: "The Faculty Ledger",
  shortName: "Faculty Ledger",
  tagline: "Independent desk for course research",
  description:
    "Look up professors by name or university. Real Rate My Professors reviews, difficulty scores, course history, and side-by-side comparisons before you register.",
  keywords: [
    "professor reviews",
    "rate my professors",
    "college professor ratings",
    "course registration help",
    "university professor lookup",
    "compare professors",
    "syllabus professor finder",
    "student guide",
  ],
  locale: "en_US",
  twitterHandle: "@FacultyLedger",
} as const;

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function buildProfessorShareUrl(name: string, university: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : getSiteUrl();
  const params = new URLSearchParams({
    name: name.trim(),
    university: university.trim(),
  });
  return `${base}/?${params.toString()}`;
}

export function buildShareText(professorName: string, university: string, rating?: number): string {
  const ratingPart = rating != null ? ` (${rating.toFixed(1)}/5 on RMP)` : "";
  return `Professor review: ${professorName} at ${university}${ratingPart}, via ${siteConfig.name}`;
}
