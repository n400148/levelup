import { NextResponse } from "next/server";
import { callGemini } from "@/lib/ai";

export async function POST(req: Request) {
  const key = process.env.GEMINI_KEY;
  if (!key) {
    return NextResponse.json({ error: "Server is missing the GEMINI_KEY environment variable." }, { status: 500 });
  }

  const { summary, question } = (await req.json()) as { summary?: string; question?: string };
  if (!summary) {
    return NextResponse.json({ error: "Missing summary." }, { status: 400 });
  }

  const persona =
    "You are a fitness data analyst helping a lifter interpret their own tracked data, in the style of evidence-based coaches like Jeff Nippard, Eric Helms, or Menno Henselmans.";
  const groundingRules =
    "Base everything strictly on the tracked data below — cross-reference across categories where relevant (e.g. a training plateau alongside under-eating protein or carbs, insufficient recovery/frequency, or an unbalanced split). If the data needed to answer is missing or not logged, say so explicitly rather than guessing. Frame everything as general fitness information, not medical or dietary advice, and do not suggest any prescription substances or dosing changes. Do not use markdown formatting, just plain lines.";

  const prompt = question
    ? `${persona}\n\nTheir tracked data:\n${summary}\n\nTheir question: "${question}"\n\n${groundingRules} Answer their question directly and specifically in under 200 words, citing the relevant numbers from their data.`
    : `${persona}\n\nTheir tracked data:\n${summary}\n\n${groundingRules} Write a concise, numbered brief (4-6 short points, ~220 words max total) synthesizing this data.`;

  try {
    const { text } = await callGemini(key, prompt, 500);
    return NextResponse.json({ result: text.trim() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
