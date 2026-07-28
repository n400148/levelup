import { NextResponse } from "next/server";
import { callGemini } from "@/lib/ai";

export async function POST(req: Request) {
  const key = process.env.GEMINI_KEY;
  if (!key) {
    return NextResponse.json({ error: "Server is missing the GEMINI_KEY environment variable." }, { status: 500 });
  }

  const { summary, question, priorResponse, context } = (await req.json()) as {
    summary?: string;
    question?: string;
    priorResponse?: string;
    context?: string;
  };
  if (!summary) {
    return NextResponse.json({ error: "Missing summary." }, { status: 400 });
  }

  const persona =
    "You are a fitness data analyst helping a lifter interpret their own tracked data, in the style of evidence-based coaches like Jeff Nippard, Eric Helms, or Menno Henselmans.";
  const groundingRules =
    "Do not just restate the numbers above line by line — the user already sees that data in the app, so reading it back to them is worthless. Your job is synthesis: identify the actual trend (weight moving up, down, or flat over the recent weigh-ins; a lift stalling or progressing), then explain why by cross-referencing the other timelines against the dates in that trend — a training frequency or split change, a dose change in the peptide/supplement history (the same substance appearing twice with different dates means the dose changed on that date), or a shift in the daily nutrition log around the same time. Reason quantitatively about intake vs. outcome: compare the standing meal plan target (or the logged macros if there's no standing plan) against what the weight trend actually did over that period, and say in concrete terms whether that intake is running short of or in surplus of what the trend implies — don't just call it 'a bit low' or 'roughly right' without tying it to the numbers. If there's a real, specific gap in the data that's blocking a conclusion, end with exactly one short, targeted clarifying question the user could answer to close it (for example: 'did you eat higher-sodium meals yesterday?') — only ask if you genuinely need it, never ask just to have a question. If the data needed is missing entirely and no question would help, say so explicitly rather than guessing. Frame everything as general fitness information, not medical or dietary advice, and do not suggest any prescription substances or dosing changes. Do not use markdown formatting, just plain lines.";

  let prompt: string;
  if (context && priorResponse) {
    prompt = `${persona}\n\nTheir tracked data:\n${summary}\n\nYour previous response to them was:\n"${priorResponse}"\n\nThe user has now replied with this additional context: "${context}"\n\n${groundingRules} Using this new context alongside the tracked data, give a sharper, more specific answer in under 200 words — don't just repeat your previous response, actually incorporate what they just told you.`;
  } else if (question) {
    prompt = `${persona}\n\nTheir tracked data:\n${summary}\n\nTheir question: "${question}"\n\n${groundingRules} Answer their question directly and specifically in under 200 words, citing the relevant numbers and dates from their data.`;
  } else {
    prompt = `${persona}\n\nTheir tracked data:\n${summary}\n\n${groundingRules} Write a concise, numbered brief (4-6 short points, ~220 words max total) synthesizing this data.`;
  }

  try {
    const { text } = await callGemini(key, prompt, 500);
    return NextResponse.json({ result: text.trim() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
