import { z } from "zod";
import {
  REVIEW_DIGEST_API_URL,
  REVIEW_DIGEST_MODEL,
} from "@/lib/reviewDigestConfig";

const summarySchema = z.object({
  summary: z.string().min(1),
  pros: z.array(z.string()).min(1),
  cons: z.array(z.string()).min(1),
});

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) return fenceMatch[1].trim();
  return trimmed;
}

function extractJsonObject(text: string): string {
  const stripped = stripMarkdownFences(text);
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found");
  }
  return stripped.slice(start, end + 1);
}

export async function composeReviewDigest(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
): Promise<{ summary: string; pros: string[]; cons: string[] } | null> {
  try {
    const response = await fetch(REVIEW_DIGEST_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: REVIEW_DIGEST_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 512,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = summarySchema.parse(JSON.parse(extractJsonObject(content)));
    return parsed;
  } catch {
    return null;
  }
}
