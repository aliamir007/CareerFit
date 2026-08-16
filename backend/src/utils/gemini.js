import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

/**
 * A thin wrapper over the Gemini SDK, because calling it directly is unreliable
 * in two distinct ways that both surface as a failed resume upload:
 *
 *   404 — the model was retired. "gemini-2.5-flash" still appears in the model
 *         list but returns "no longer available to new users" for any project
 *         created after its cutoff. Retrying is pointless; try another model.
 *
 *   503 / 429 — the model is briefly overloaded or rate-limited. Retrying after
 *         a short backoff usually succeeds. Switching models immediately would
 *         waste the preferred one.
 *
 * So: retry transient failures on the same model, fall through to the next model
 * on permanent ones. GEMINI_MODEL may be a comma-separated preference order.
 */

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Preference order, measured against a real resume on this project's key:
//   gemini-flash-lite-latest  200 in ~1.7s, 49 skills   <- fast and reliable
//   gemini-3-flash-preview    200 in ~15.7s, 58 skills  <- better, much slower
//   gemini-flash-latest       503 (overloaded)
//   gemini-2.0-flash          429 (quota)
// Lite goes first because a 15s upload that sometimes 503s is worse than a 2s
// one; the preview model is kept as a fallback for when lite is unavailable.
const MODELS = (
  process.env.GEMINI_MODEL ||
  "gemini-flash-lite-latest,gemini-3-flash-preview"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

export const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";

// Two attempts, not three: a browser gives up long before an exhaustive retry
// budget does. Worst case here is ~2 models x 2 attempts, which stays inside the
// frontend's 120s ceiling instead of grinding for minutes.
const MAX_ATTEMPTS = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransient = (error) =>
  error?.status === 503 ||
  error?.status === 500 ||
  /UNAVAILABLE|high demand|overloaded/i.test(error?.message || "");

// A daily-quota 429 is NOT worth retrying — the quota resets tomorrow, not in
// two seconds — but a per-minute 429 is. Telling them apart from the message is
// the only option the API gives us.
const isRateLimit = (error) =>
  error?.status === 429 && !/per day|PerDay/i.test(error?.message || "");

export async function generateContent({ contents, config }) {
  let lastError;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        return await ai.models.generateContent({ model, contents, config });
      } catch (error) {
        lastError = error;

        if (isTransient(error) || isRateLimit(error)) {
          await sleep(600 * 2 ** attempt); // 0.6s, 1.2s, 2.4s
          continue;
        }

        // Permanent for this model (retired, bad request). Move on.
        break;
      }
    }
  }

  throw lastError;
}

export async function embedContent({ contents, config }) {
  let lastError;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await ai.models.embedContent({
        model: GEMINI_EMBEDDING_MODEL,
        contents,
        config,
      });
    } catch (error) {
      lastError = error;
      if (!isTransient(error) && !isRateLimit(error)) break;
      await sleep(600 * 2 ** attempt);
    }
  }

  throw lastError;
}
