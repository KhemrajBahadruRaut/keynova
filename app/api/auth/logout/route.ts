import { NextRequest, NextResponse } from "next/server";

import { deleteAdminSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { status: "error", message: "Invalid request origin." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  await deleteAdminSession();
  return NextResponse.json(
    { status: "success" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
