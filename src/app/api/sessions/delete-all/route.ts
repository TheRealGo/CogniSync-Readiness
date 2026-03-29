import { NextRequest, NextResponse } from "next/server";
import { deleteAllSessions } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  const taskType = request.nextUrl.searchParams.get("task_type");
  if (!taskType) {
    return NextResponse.json({ error: "task_type is required" }, { status: 400 });
  }
  deleteAllSessions(taskType);
  return NextResponse.json({ ok: true });
}
