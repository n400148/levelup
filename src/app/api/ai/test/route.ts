import { NextResponse } from "next/server";
import { callGemini } from "@/lib/ai";

const CHECK_STRING = "LIFTCIPHER_OK";

export async function POST() {
  const key = process.env.GEMINI_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "Server is missing the GEMINI_KEY environment variable." }, { status: 500 });
  }

  try {
    const { text, modelUsed } = await callGemini(
      key,
      `Reply with exactly this string and nothing else: ${CHECK_STRING}`,
      40,
    );
    return NextResponse.json({ ok: text.includes(CHECK_STRING), modelUsed, raw: text });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
