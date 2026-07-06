// Gemini model names get renamed/retired periodically — try a short fallback
// list in order rather than hardcoding one string, and always surface the
// real upstream error so a bad model name is diagnosable instead of a silent
// "No response." gemini-1.5-* models have been fully retired (404 on
// generateContent) and gemini-2.0-flash has shown a hard free-tier quota of
// 0 on this key, so the list only carries models confirmed to work.
export const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

export interface GeminiResult {
  text: string;
  modelUsed: string;
}

export async function callGemini(
  apiKey: string,
  prompt: string,
  maxOutputTokens = 600,
): Promise<GeminiResult> {
  const errors: string[] = [];

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens,
              temperature: 0.6,
              // 2.5 models spend part of the token budget on hidden
              // "thinking" tokens by default, which was silently eating the
              // entire budget on short responses and returning empty text
              // with finishReason MAX_TOKENS. This app needs a direct
              // answer, not extended reasoning, so turn it off.
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        errors.push(`${model}: ${data?.error?.message ?? res.statusText}`);
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        errors.push(`${model}: empty response (${JSON.stringify(data).slice(0, 200)})`);
        continue;
      }

      return { text, modelUsed: model };
    } catch (e) {
      errors.push(`${model}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  throw new Error(`All Gemini models failed — ${errors.join(" | ")}`);
}
