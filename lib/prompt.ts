export const SUMMARIZE_REVIEWS_PROMPT = `You summarize real student reviews from Rate My Professors. You will receive review comments and tags. Return ONLY valid JSON:

{
  "summary": "string (2-3 sentences summarizing themes in the reviews)",
  "pros": ["string"],
  "cons": ["string"]
}

Rules:
- Use ONLY information present in the provided reviews. Do not invent facts.
- Do not mention Rate My Professors in the output.
- pros and cons: 2 to 4 items each, short phrases.
- No markdown, no code fences.`;

export function buildSummarizeUserMessage(reviews: { comment: string; quality: number; tags: string[] }[]): string {
  const blocks = reviews.map((r, i) => {
    const tags = r.tags.length > 0 ? ` Tags: ${r.tags.join(", ")}.` : "";
    return `Review ${i + 1} (${r.quality}/5): ${r.comment}${tags}`;
  });
  return blocks.join("\n\n");
}
