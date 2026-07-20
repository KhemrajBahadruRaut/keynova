import { NextRequest, NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/auth/backend";
import { createAdminSession } from "@/lib/auth/session";
import { validateEmail, validatePassword } from "@/lib/validation";

type BackendLoginResponse = {
  status?: string;
  message?: string;
  token?: string;
  admin?: { id?: string | number; email?: string };
};

function jsonResponse(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return jsonResponse({ status: "error", message: "Invalid request origin." }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4096) {
    return jsonResponse({ status: "error", message: "Request is too large." }, 413);
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ status: "error", message: "Invalid request body." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  if (emailError || passwordError) {
    return jsonResponse(
      {
        status: "error",
        message: "Enter a valid email address and password.",
      },
      400,
    );
  }

  try {
    const backendResponse = await fetch(getBackendUrl("admin/admin_login.php"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await backendResponse.json()) as BackendLoginResponse;

    if (
      !backendResponse.ok ||
      data.status !== "success" ||
      typeof data.token !== "string" ||
      typeof data.admin?.email !== "string" ||
      (typeof data.admin.id !== "string" && typeof data.admin.id !== "number")
    ) {
      return jsonResponse(
        { status: "error", message: "Invalid email or password." },
        401,
      );
    }

    await createAdminSession({
      adminId: String(data.admin.id),
      email: data.admin.email,
      role: "admin",
      backendToken: data.token,
    });

    return jsonResponse(
      {
        status: "success",
        admin: { id: data.admin.id, email: data.admin.email },
      },
      200,
    );
  } catch (error) {
    console.error("Admin login failed:", error);
    return jsonResponse(
      { status: "error", message: "Authentication service is unavailable." },
      502,
    );
  }
}
