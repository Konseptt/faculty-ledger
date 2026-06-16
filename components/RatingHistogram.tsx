"use client";

import { useEffect, useState } from "react";

interface RatingHistogramProps {
  distribution: Record<string, number>;
  totalReviews: number;
}

const STAR_ORDER = ["5", "4", "3", "2", "1"];

export function RatingHistogram({ distribution, totalReviews }: RatingHistogramProps) {
  const [animate, setAnimate] = useState(false);
  const counts = STAR_ORDER.map((star) => distribution[star] ?? 0);
  const maxCount = Math.max(...counts, 1);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setAnimate(true);
      return;
    }
    const t = window.setTimeout(() => setAnimate(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="rating-histogram" aria-label={`Rating distribution from ${totalReviews} reviews`}>
      <p className="rating-histogram-label">Rating breakdown</p>
      <ul className="rating-histogram-bars">
        {STAR_ORDER.map((star, index) => {
          const count = counts[index];
          const width = totalReviews > 0 ? (count / maxCount) * 100 : 0;
          const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

          return (
            <li key={star} className="rating-histogram-row" aria-label={`${star} stars: ${count} reviews`}>
              <span className="rating-histogram-star">{star}★</span>
              <span className="rating-histogram-track" aria-hidden="true">
                <span
                  className="rating-histogram-fill"
                  style={{
                    width: animate ? `${width}%` : "0%",
                    transitionDelay: `${index * 60}ms`,
                  }}
                />
              </span>
              <span className="rating-histogram-count">
                {count}
                <span className="rating-histogram-pct"> ({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
