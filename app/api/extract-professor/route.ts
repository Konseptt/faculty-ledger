import { NextResponse } from "next/server";
import { z } from "zod";
import { extractProfessorHeuristic, type ExtractedProfessor } from "@/lib/extractProfessor";
import {
  REVIEW_DIGEST_API_URL,
  REVIEW_DIGEST_MODEL,
  getReviewDigestApiKey,
} from "@/lib/reviewDigestConfig";

const bodySchema = z.object({ text: z.string().min(1).max(20000) });

const EXTRACT_PROMPT = `Extract the instructor's name from a course description or syllabus. Return ONLY valid JSON:

{ "professorName": "string", "university": "string or empty", "course": "string or empty" }

Rules:
- professorName is the human instructor's full name, no titles (no "Dr.", "Professor").
- If no instructor name is present, set professorName to "".
- Do not invent a name. No markdown, no code fences.`;

function stripFences(text: string): string {
  const m = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1].trim() : text.trim();
}

async function extractWithApi(apiKey: string, text: string) {
  try {
    const res = await fetch(REVIEW_DIGEST_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: REVIEW_DIGEST_MODEL,
        messages: [
          { role: "system", content: EXTRACT_PROMPT },
          { role: "user", content: text.slice(0, 6000) },
        ],
        temperature: 0,
        max_tokens: 200,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(stripFences(content)) as {
      professorName?: string;
      university?: string;
      course?: string;
    };
    if (!parsed.professorName?.trim()) return null;
    return {
      professorName: parsed.professorName.trim(),
      university: parsed.university?.trim() || undefined,
      course: parsed.course?.trim() || undefined,
      confidence: "high" as const,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paste some course text first." }, { status: 400 });
  }

  const text = parsed.data.text;
  const apiKey = getReviewDigestApiKey();

  let result: ExtractedProfessor | null = apiKey ? await extractWithApi(apiKey, text) : null;
  if (!result) {
    const heuristic = extractProfessorHeuristic(text);
    if (!heuristic.professorName) {
      return NextResponse.json(
        { error: "Could not find a professor name in that text. Try search by name instead." },
        { status: 422 },
      );
    }
    result = heuristic;
  }

  return NextResponse.json(result);
}
