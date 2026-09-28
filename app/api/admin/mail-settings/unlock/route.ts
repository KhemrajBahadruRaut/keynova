import { NextRequest, NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/auth/backend";
import {
  createMailSettingsAccess,
  MAIL_SETTINGS_ACCESS_MAX_AGE,
} from "@/lib/auth/mail-settings-access";
import { deleteAdminSession, getAdminSession } from "@/lib/auth/session";
import { validatePassword } from "@/lib/validation";

type UnlockResponse = {
  status?: string;
  message?: string;
  access_token?: string;
  expires_in?: number;
  retry_after?: number;
};

function jsonResponse(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") {
    return jsonResponse({ status: "error", message: "Your session has expired." }, 401);
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return jsonResponse({ status: "error", message: "Invalid request origin." }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 2048) {
    return jsonResponse({ status: "error", message: "Request is too large." }, 413);
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ status: "error", message: "Invalid request body." }, 400);
  }

  const password = typeof body.password === "string" ? body.password : "";
  const passwordError = validatePassword(password);
  if (passwordError) {
    return jsonResponse({ status: "error", message: passwordError }, 400);
  }

  try {
    const backendResponse = await fetch(
      getBackendUrl("settings/unlock_mail_settings.php"),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    const payload = (await backendResponse.json().catch(() => null)) as UnlockResponse | null;
    if (backendResponse.status === 401 && payload?.message === "Unauthorized") {
      await deleteAdminSession();
      return jsonResponse({ status: "error", message: "Your session has expired." }, 401);
    }
    if (
      !backendResponse.ok ||
      payload?.status !== "success" ||
      typeof payload.access_token !== "string"
    ) {
      return jsonResponse(
        {
          status: "error",
          message: payload?.message || "Unable to unlock email settings.",
          ...(typeof payload?.retry_after === "number"
            ? { retry_after: payload.retry_after }
            : {}),
        },
        backendResponse.status >= 400 ? backendResponse.status : 502,
      );
    }

    const expiresIn =
      typeof payload.expires_in === "number" && Number.isFinite(payload.expires_in)
        ? payload.expires_in
        : MAIL_SETTINGS_ACCESS_MAX_AGE;
    await createMailSettingsAccess(payload.access_token, expiresIn);

    return jsonResponse(
      { status: "success", message: "Email settings unlocked." },
      200,
    );
  } catch (error) {
    console.error("Email settings unlock failed:", error);
    return jsonResponse(
      { status: "error", message: "Email settings service is unavailable." },
      502,
    );
  }
}
