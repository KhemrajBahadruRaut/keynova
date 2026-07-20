import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      authenticated: true,
      admin: { id: session.adminId, email: session.email, role: session.role },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
