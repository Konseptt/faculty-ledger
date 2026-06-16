export const exampleSearches = [
  { name: "David Malan", university: "Harvard University", label: "CS legend at Harvard" },
  { name: "Jennifer Widom", university: "Stanford University", label: "Stanford CS dean" },
  { name: "Michael Jordan", university: "University of California Berkeley", label: "Berkeley ML prof" },
] as const;

export const keyboardHints = [
  { keys: "/", action: "Focus search" },
  { keys: "1 · 2 · 3", action: "Switch search mode" },
  { keys: "Enter", action: "Run search" },
] as const;
