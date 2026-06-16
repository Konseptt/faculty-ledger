export function getReviewDigestApiKey(): string | null {
  const key = process.env.REVIEW_DIGEST_API_KEY?.trim();
  return key || null;
}

export const REVIEW_DIGEST_API_URL =
  process.env.REVIEW_DIGEST_API_URL?.trim() ||
  "https://integrate.api.nvidia.com/v1/chat/completions";

export const REVIEW_DIGEST_MODEL =
  process.env.REVIEW_DIGEST_MODEL?.trim() || "meta/llama-4-maverick-17b-128e-instruct";
