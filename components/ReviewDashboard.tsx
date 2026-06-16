"use client";

import { useState } from "react";
import { uiCopy } from "@/lib/copy";
import type { ProfessorResultWithMeta } from "@/lib/types";
import { RatingHistogram } from "./RatingHistogram";
import { StarRating } from "./StarRating";

interface ReviewDashboardProps {
  data: ProfessorResultWithMeta;
}

const QUOTE_PREVIEW = 220;

function ExpandableQuote({
  comment,
  quality,
  course,
  date,
}: {
  comment: string;
  quality: number;
  course?: string;
  date?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = comment.length > QUOTE_PREVIEW;
  const text = long && !expanded ? `${comment.slice(0, QUOTE_PREVIEW).trim()}…` : comment;

  return (
    <blockquote className="quote-item">
      <p>&ldquo;{text}&rdquo;</p>
      {long && (
        <button
          type="button"
          className="quote-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read full quote"}
        </button>
      )}
      <footer className="quote-meta">
        {quality}/5
        {course ? ` · ${course}` : ""}
        {date ? ` · ${date}` : ""}
      </footer>
    </blockquote>
  );
}

export function ReviewDashboard({ data }: ReviewDashboardProps) {
  const {
    reviewSummary,
    numRatings,
    rmpUrl,
    difficulty,
    wouldTakeAgain,
    recentReviews,
    ratingDistribution,
  } = data;
  const quotes = recentReviews.filter((r) => r.comment?.trim()).slice(0, 3);
  const hasDistribution = Object.values(ratingDistribution).some((n) => n > 0);

  return (
    <section className="review-block" id="result-reviews" aria-labelledby="reviews-heading">
      <div className="review-head">
        <h3 id="reviews-heading">{uiCopy.reviewsHeading}</h3>
        <a
          href={rmpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rmp-link"
          aria-label={`Read all ${numRatings} reviews on Rate My Professors. ${uiCopy.rmpLinkSuffix}`}
        >
          Read {numRatings} reviews on RMP
          <span className="rmp-link-note">{uiCopy.rmpLinkSuffix}</span>
        </a>
      </div>

      <div className="rating-summary">
        <div className="rating-summary-score">
          <StarRating rating={reviewSummary.overallRating} />
          <p className="rating-summary-count">
            Based on <strong>{numRatings}</strong> student{" "}
            {numRatings === 1 ? "review" : "reviews"} on Rate My Professors
          </p>
        </div>
        {hasDistribution && (
          <RatingHistogram distribution={ratingDistribution} totalReviews={numRatings} />
        )}
      </div>

      {(difficulty != null || wouldTakeAgain != null) && (
        <dl className="stat-strip">
          {difficulty != null && (
            <div className="stat-item">
              <dt>Difficulty</dt>
              <dd>{difficulty.toFixed(1)}/5</dd>
            </div>
          )}
          {wouldTakeAgain != null && (
            <div className="stat-item">
              <dt>Would take again</dt>
              <dd>{Math.round(wouldTakeAgain)}%</dd>
            </div>
          )}
        </dl>
      )}

      <p className="review-lede">{reviewSummary.summary}</p>

      <div className="pros-cons">
        <div className="pros-cons-col">
          <h4 className="col-label col-label-pros">{uiCopy.prosLabel}</h4>
          <ul className="simple-list">
            {reviewSummary.pros.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="pros-cons-col">
          <h4 className="col-label col-label-cons">{uiCopy.consLabel}</h4>
          <ul className="simple-list">
            {reviewSummary.cons.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {quotes.length > 0 && (
        <div className="quotes-block">
          <h4>{uiCopy.quotesHeading}</h4>
          {quotes.map((review, i) => (
            <ExpandableQuote
              key={i}
              comment={review.comment}
              quality={review.quality}
              course={review.course}
              date={review.date}
            />
          ))}
        </div>
      )}
    </section>
  );
}
