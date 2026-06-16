// Minimal lexicon sentiment scorer. Replaces analyzeSentiment from the removed
// ratemyprofessors-client library. Used only for the cons heuristic.

const NEGATIVE = [
  "terrible", "awful", "boring", "confusing", "rude", "unfair", "hard",
  "worst", "avoid", "horrible", "disorganized", "useless", "fail", "waste",
  "unclear", "harsh", "impossible", "nightmare", "bad",
];
const POSITIVE = [
  "amazing", "great", "clear", "helpful", "kind", "best", "love", "loved",
  "excellent", "fair", "engaging", "caring", "fun", "wonderful", "organized",
  "easy", "inspiring", "awesome", "good",
];

export type Sentiment = "negative" | "neutral" | "positive";

export function scoreSentiment(text: string): Sentiment {
  const lower = ` ${text.toLowerCase().replace(/[^a-z\s]/g, " ")} `;
  let score = 0;
  for (const w of NEGATIVE) if (lower.includes(` ${w} `)) score -= 1;
  for (const w of POSITIVE) if (lower.includes(` ${w} `)) score += 1;
  if (score < 0) return "negative";
  if (score > 0) return "positive";
  return "neutral";
}
