import { NextResponse } from "next/server";
import { getSessionById, getPvtTrials, getFlankerTrials } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = Number(id);
  const session = getSessionById(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const trials =
    session.task_type === "pvt"
      ? getPvtTrials(sessionId)
      : getFlankerTrials(sessionId);

  return NextResponse.json(trials);
}
