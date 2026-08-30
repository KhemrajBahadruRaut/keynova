import { NextRequest, NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/auth/backend";

const MAX_REQUEST_BYTES = 12 * 1024;

function jsonResponse(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function forwardBackendResponse(response: Response) {
  const body = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "application/json";

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET() {
  try {
    const response = await fetch(
      getBackendUrl("testimonials/get_testimonials.php"),
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    return forwardBackendResponse(response);
  } catch (error) {
    console.error("Public testimonials API failed:", error);
    return jsonResponse(
      { status: "error", message: "Testimonials are temporarily unavailable." },
      502,
    );
  }
}
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return jsonResponse({ status: "error", message: "Invalid request origin." }, 403);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return jsonResponse(
      { status: "error", message: "Content-Type must be application/json." },
      415,
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ status: "error", message: "Request is too large." }, 413);
  }

  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ status: "error", message: "Request is too large." }, 413);
  }

  try {
    const response = await fetch(
      getBackendUrl("testimonials/submit_testimonial.php"),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    return forwardBackendResponse(response);
  } catch (error) {
    console.error("Testimonial submission API failed:", error);
    return jsonResponse(
      { status: "error", message: "Unable to submit your testimonial right now." },
      502,
    );
  }
}
