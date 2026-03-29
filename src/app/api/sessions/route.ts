import { NextRequest, NextResponse } from "next/server";
import { getSessions } from "@/lib/db";

export async function GET(request: NextRequest) {
  const taskType = request.nextUrl.searchParams.get("task_type") ?? undefined;
  const sessions = getSessions(taskType);
  return NextResponse.json(sessions);
}
