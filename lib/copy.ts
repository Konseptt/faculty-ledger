export type SearchMode = "name" | "paste" | "compare";

export const uiCopy = {
  tagline: "Independent desk for course research",
  mastheadDeck:
    "Rate My Professors reviews, arranged for reading. Know before you enroll.",
  searchLede: "Name the professor and school, paste a syllabus, or line up a comparison.",
  emptyState:
    "No professor on file yet. Choose a search method above and run a lookup.",
  notFound:
    "No match at that school. Check spelling, nicknames, or department listings.",
  recentSearchesLabel: "Recent lookups:",
  shareHeading: "Pass it along",
  shareSub: "Send this page to someone picking sections.",
  compareTitle: "Side by side",
  coursesHeading: "Courses named in reviews",
  reviewsHeading: "The review file",
  rmpLinkSuffix: "(opens Rate My Professors in a new tab)",
  prosLabel: "In their favor",
  consLabel: "Complaints noted",
  quotesHeading: "Verbatim from students",
} as const;

export const searchModeOptions: {
  id: SearchMode;
  label: string;
  description: string;
  submitLabel: string;
  loadingLabel: string;
}[] = [
  {
    id: "name",
    label: "Search by name",
    description: "Enter professor + school. Old reliable.",
    submitLabel: "Look up professor",
    loadingLabel: "Digging through reviews…",
  },
  {
    id: "paste",
    label: "Paste syllabus",
    description: "Paste course text; we locate the instructor.",
    submitLabel: "Find instructor & look up",
    loadingLabel: "Reading the syllabus…",
  },
  {
    id: "compare",
    label: "Compare professors",
    description: "Up to three names, one table.",
    submitLabel: "Run comparison",
    loadingLabel: "Building the table…",
  },
];

export const shareChannels = [
  {
    id: "x" as const,
    label: "Post on X",
    copiedLabel: "Link copied",
  },
  {
    id: "facebook" as const,
    label: "Share on Facebook",
    copiedLabel: "Link copied",
  },
  {
    id: "linkedin" as const,
    label: "Share on LinkedIn",
    copiedLabel: "Link copied",
  },
  {
    id: "whatsapp" as const,
    label: "Send on WhatsApp",
    copiedLabel: "Link copied",
  },
  {
    id: "copy" as const,
    label: "Copy link",
    copiedLabel: "Link copied",
  },
];

export const toastCopy = {
  missingFields: "We need both a professor and a school. One without the other is just vibes.",
  missingPaste: "Paste something first. Even the attendance policy counts.",
  missingCompare: "Compare needs at least two professors. One is just a crush.",
  incompleteCompare: "Every row needs a name and a school. No mystery entries.",
  serverError: "Server went to office hours and never came back. Try again.",
  syllabusFail: "Could not find a professor in that text. Try a longer paste.",
  syllabusPartial: "Found the name. Add their school and look up.",
  genericError: "Something broke. Not your GPA, just the search.",
  compareFail: "Comparison fizzled. Give it another shot.",
} as const;

export const themeCopy = {
  light: {
    button: "Switch to night edition",
    hint: "Easier on eyes at 2 a.m.",
  },
  dark: {
    button: "Switch to day edition",
    hint: "For well-adjusted morning people",
  },
} as const;

export const fieldHints = {
  professorName: "First and last name as students know them",
  university: "Full school name improves match accuracy",
  syllabus: "Longer paste works better. PDF text beats a vague course title.",
} as const;

export const bookmarkCopy = {
  save: "Save to reading list",
  saved: "Remove from reading list",
} as const;
