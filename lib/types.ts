export interface ProfessorResult {
  fullName: string;
  department: string;
  university: string;
  teachingSince: string;
  reviewSummary: {
    overallRating: number;
    summary: string;
    pros: string[];
    cons: string[];
  };
  coursesTaught: string[];
}

export interface RecentReview {
  comment: string;
  quality: number;
  date: string;
  course?: string;
  grade?: string;
  difficulty?: number;
  tags?: string[];
}

export interface ProfessorResultWithMeta extends ProfessorResult {
  reviewSource: "ratemyprofessors";
  numRatings: number;
  rmpUrl: string;
  difficulty?: number;
  wouldTakeAgain?: number;
  recentReviews: RecentReview[];
  photoUrl?: string;
  facultyProfileUrl?: string;
  photoSource?: "university" | "wikipedia" | "initials";
  ratingDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  gradeDistribution?: Record<string, number>;
}

export interface SearchRequest {
  professorName: string;
  university: string;
}
