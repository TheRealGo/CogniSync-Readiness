import { NextResponse } from "next/server";
import { saveFlankerSession } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { subjective_score, trials } = body;
  const sessionId = saveFlankerSession(subjective_score, trials);
  return NextResponse.json({ session_id: sessionId });
}
