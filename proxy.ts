import { type NextRequest, NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = new Set([
  "admin",
  "api",
  "app",
  "ftp",
  "localhost",
  "mail",
  "smtp",
  "www",
]);

function requestHostname(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0];
  const host = (forwardedHost || request.headers.get("host") || "")
    .trim()
    .toLowerCase();

  return host.replace(/:\d+$/, "").replace(/\.$/, "");
}

function agentSlugFromHostname(hostname: string): string | null | false {
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  let candidate: string | null = null;

  if (hostname.endsWith(".localhost")) {
    candidate = hostname.slice(0, -".localhost".length);
  } else {
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "keynovagrp.com")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/:\d+$/, "")
      .replace(/\/$/, "");

    if (hostname === rootDomain || hostname === `www.${rootDomain}`) return null;
    if (hostname.endsWith(`.${rootDomain}`)) {
      candidate = hostname.slice(0, -(rootDomain.length + 1));
    }
  }

  if (candidate === null) return null;
  if (
    candidate.length > 63 ||
    RESERVED_SUBDOMAINS.has(candidate) ||
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(candidate)
  ) {
    return false;
  }

  return candidate;
}

export function proxy(request: NextRequest) {
  const slug = agentSlugFromHostname(requestHostname(request));
  if (slug === null) return NextResponse.next();
  if (slug === false) return new NextResponse(null, { status: 404 });

  const destination = request.nextUrl.clone();
  destination.pathname = `/agent/${slug}`;
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ["/"],
};
