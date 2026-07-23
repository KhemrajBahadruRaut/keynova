import { NextRequest, NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/auth/backend";
import { deleteAdminSession, getAdminSession } from "@/lib/auth/session";

export const maxDuration = 60;

const MAX_PROXY_BODY_BYTES = Math.floor(4.25 * 1024 * 1024);

const ALLOWED_ADMIN_ENDPOINTS = new Set([
  "property/get_properties.php",
  "property/get_doc_requests.php",
  "property/get_inquiries.php",
  "property/get_property.php",
  "property/create_property.php",
  "property/update_property.php",
  "property/delete_property.php",
  "property/delete_property_image.php",
  "property/delete_property_document.php",
]);

type AdminProxyContext = {
  params: Promise<{ path: string[] }>;
};

function unauthorizedResponse() {
  return NextResponse.json(
    { status: "error", message: "Your session has expired." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

async function proxyAdminRequest(
  request: NextRequest,
  context: AdminProxyContext,
) {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") return unauthorizedResponse();

  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { status: "error", message: "Invalid request origin." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const { path } = await context.params;
  const endpoint = path.join("/");
  if (!ALLOWED_ADMIN_ENDPOINTS.has(endpoint)) {
    return NextResponse.json(
      { status: "error", message: "Admin endpoint not found." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_PROXY_BODY_BYTES) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "The upload is too large for Vercel. Use files no larger than 4 MB.",
      },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${session.backendToken}`,
  });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  try {
    const backendResponse = await fetch(
      getBackendUrl(endpoint, request.nextUrl.search),
      {
        method: request.method,
        headers,
        body: request.method === "GET" ? undefined : await request.arrayBuffer(),
        cache: "no-store",
        signal: AbortSignal.timeout(55_000),
      },
    );
    const responseBody = await backendResponse.arrayBuffer();
    const responseType =
      backendResponse.headers.get("content-type") || "application/json";

    if (responseType.includes("application/json")) {
      try {
        const data = JSON.parse(new TextDecoder().decode(responseBody)) as {
          status?: string;
          message?: string;
        };
        if (
          data.status === "error" &&
          ["Unauthorized", "Invalid token"].includes(data.message || "")
        ) {
          await deleteAdminSession();
          return unauthorizedResponse();
        }
      } catch {
        // Preserve malformed backend responses for the caller to handle.
      }
    }

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": responseType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Admin API proxy failed:", error);
    return NextResponse.json(
      { status: "error", message: "Admin service is unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export function GET(request: NextRequest, context: AdminProxyContext) {
  return proxyAdminRequest(request, context);
}

export function POST(request: NextRequest, context: AdminProxyContext) {
  return proxyAdminRequest(request, context);
}
