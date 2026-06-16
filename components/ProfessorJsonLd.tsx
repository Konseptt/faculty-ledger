"use client";

import type { ProfessorResultWithMeta } from "@/lib/types";
import { getSiteUrl, siteConfig } from "@/lib/site";

interface ProfessorJsonLdProps {
  data: ProfessorResultWithMeta;
}

export function ProfessorJsonLd({ data }: ProfessorJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.fullName,
    jobTitle: "Professor",
    worksFor: {
      "@type": "CollegeOrUniversity",
      name: data.university,
    },
    description: data.reviewSummary.summary,
    url: `${getSiteUrl()}/?name=${encodeURIComponent(data.fullName)}&university=${encodeURIComponent(data.university)}`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: data.reviewSummary.overallRating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: data.numRatings,
      reviewCount: data.numRatings,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd),
      }}
      data-site={siteConfig.shortName}
    />
  );
}
