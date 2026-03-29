import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteSession(Number(id));
  return NextResponse.json({ ok: true });
}
