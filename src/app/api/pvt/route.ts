import { NextResponse } from "next/server";
import { savePvtSession } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { subjective_score, trials } = body;
  const sessionId = savePvtSession(subjective_score, trials);
  return NextResponse.json({ session_id: sessionId });
}
