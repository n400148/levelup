import { NextResponse } from "next/server";
import { callGemini } from "@/lib/ai";

export async function POST(req: Request) {
  const key = process.env.GEMINI_KEY;
  if (!key) {
    return NextResponse.json({ error: "Server is missing the GEMINI_KEY environment variable." }, { status: 500 });
  }

  const { summary } = (await req.json()) as { summary?: string };
  if (!summary) {
    return NextResponse.json({ error: "Missing summary." }, { status: 400 });
  }

  const prompt = `You are a fitness data analyst writing a short brief for a lifter using their own tracked data below.

${summary}

Write a concise, numbered brief (4-6 short points, ~220 words max total) synthesizing this data in the style of evidence-based coaches like Jeff Nippard, Eric Helms, or Menno Henselmans. Be specific and reference the numbers given. Frame everything as general fitness information, not medical or dietary advice, and do not suggest any prescription substances or dosing changes. Do not use markdown formatting, just plain numbered lines.`;

  try {
    const { text } = await callGemini(key, prompt, 500);
    return NextResponse.json({ result: text.trim() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
