import { NextResponse } from "next/server";
import { resolveProfessorPhoto } from "@/lib/facultyImage";
import { buildSummarizeUserMessage, SUMMARIZE_REVIEWS_PROMPT } from "@/lib/prompt";
import {
  buildReviewSummaryFromRmp,
  earliestReviewYear,
  fetchProfessorFromRmp,
  formatRecentReviews,
  rmpProfileUrl,
  uniqueCourses,
  computeRatingDistribution,
  computeDifficultyDistribution,
  computeGradeDistribution,
} from "@/lib/rmp";
import { composeReviewDigest } from "@/lib/summarizeReviews";
import { getReviewDigestApiKey } from "@/lib/reviewDigestConfig";
import type { ProfessorResultWithMeta } from "@/lib/types";

export async function POST(request: Request) {
  let body: { professorName?: string; university?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { professorName, university } = body;

  if (!professorName?.trim() || !university?.trim()) {
    return NextResponse.json(
      { error: "Professor name and university are both required." },
      { status: 400 },
    );
  }

  try {
    const rmpData = await fetchProfessorFromRmp(professorName.trim(), university.trim());

    if (!rmpData) {
      return NextResponse.json(
        {
          error:
            "No professor found on Rate My Professors for that name and school. Try checking spelling or the exact university name.",
        },
        { status: 404 },
      );
    }

    const { professor, ratings, school } = rmpData;
    let reviewSummary = buildReviewSummaryFromRmp(professor, ratings);

    const reviewsWithText = ratings.filter((r) => r.comment?.trim());
    const apiKey = getReviewDigestApiKey();

    if (apiKey && reviewsWithText.length > 0) {
      const digest = await composeReviewDigest(
        apiKey,
        SUMMARIZE_REVIEWS_PROMPT,
        buildSummarizeUserMessage(
          reviewsWithText.slice(0, 12).map((r) => ({
            comment: r.comment,
            quality: r.quality ?? 0,
            tags: r.tags,
          })),
        ),
      );

      if (digest) {
        reviewSummary = {
          ...reviewSummary,
          summary: digest.summary,
          pros: digest.pros,
          cons: digest.cons,
        };
      }
    }

    const courses = uniqueCourses(ratings);
    const teachingSince = earliestReviewYear(ratings) ?? "Not listed";

    const photo = await resolveProfessorPhoto(
      professor.name,
      school.name,
      professor.department ?? "",
    );

    const ratingDistribution = computeRatingDistribution(ratings);
    const difficultyDistribution = computeDifficultyDistribution(ratings);
    const gradeDistribution = computeGradeDistribution(ratings);

    const result: ProfessorResultWithMeta = {
      fullName: professor.name,
      department: professor.department ?? "Unknown department",
      university: school.name,
      teachingSince,
      reviewSummary: {
        overallRating: reviewSummary.overallRating,
        summary: reviewSummary.summary,
        pros: reviewSummary.pros,
        cons: reviewSummary.cons,
      },
      coursesTaught: courses.length > 0 ? courses : ["No courses listed in reviews"],
      reviewSource: "ratemyprofessors",
      numRatings: reviewSummary.numRatings,
      rmpUrl: rmpProfileUrl(professor.id),
      difficulty: reviewSummary.difficulty,
      wouldTakeAgain: reviewSummary.wouldTakeAgain,
      recentReviews: formatRecentReviews(ratings),
      photoUrl: photo.photoUrl,
      facultyProfileUrl: photo.profileUrl,
      photoSource: photo.source,
      ratingDistribution,
      difficultyDistribution,
      gradeDistribution,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Could not fetch reviews from Rate My Professors. Try again shortly." },
      { status: 502 },
    );
  }
}
