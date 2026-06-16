"use client";

import { memo } from "react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md";
}

function StarRatingInner({ rating, max = 5, size = "md" }: StarRatingProps) {
  const dim = size === "sm" ? 14 : 18;
  const animated = useAnimatedNumber(rating, 700, 1);

  return (
    <div className="rating-row-inner" aria-label={`Rating: ${rating.toFixed(1)} out of ${max}`}>
      <span className="rating-big">{animated}</span>
      <span className="rating-stars" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => {
          const fill = Math.min(1, Math.max(0, rating - i));
          const clipId = `star-${i}-${Math.round(rating * 10)}`;
          return (
            <span key={i} className="star-mark">
              <svg width={dim} height={dim} viewBox="0 0 24 24" className="star-icon">
                <path
                  d="M12 2l2.9 6.8 7.4.6-5.6 4.9 1.7 7.2L12 18.3 5.6 21.5l1.7-7.2L1.7 9.4l7.4-.6L12 2z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {fill > 0 && (
                  <defs>
                    <clipPath id={clipId}>
                      <rect x="0" y="0" width={24 * fill} height="24" />
                    </clipPath>
                  </defs>
                )}
                {fill > 0 && (
                  <path
                    d="M12 2l2.9 6.8 7.4.6-5.6 4.9 1.7 7.2L12 18.3 5.6 21.5l1.7-7.2L1.7 9.4l7.4-.6L12 2z"
                    fill="currentColor"
                    clipPath={`url(#${clipId})`}
                  />
                )}
              </svg>
            </span>
          );
        })}
      </span>
    </div>
  );
}

export const StarRating = memo(StarRatingInner);
