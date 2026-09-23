const LOCAL_ROOT_DOMAIN = "localhost:3000";
const PRODUCTION_ROOT_DOMAIN = "keynovagrp.com";

export function rootDomain(): string {
  const configured = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim().toLowerCase();
  if (configured) {
    const domain = configured.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return domain.endsWith(".vercel.app") ? PRODUCTION_ROOT_DOMAIN : domain;
  }

  return process.env.NODE_ENV === "development"
    ? LOCAL_ROOT_DOMAIN
    : PRODUCTION_ROOT_DOMAIN;
}

export function agentPropertySiteUrl(slug: string, currentHost?: string): string {
  const host = currentHost?.trim().toLowerCase();
  const safeSlug = encodeURIComponent(slug);

  // Vercel project and preview hosts cannot have per-agent subdomains beneath
  // their generated .vercel.app address, so use the existing agent route.
  if (host?.replace(/:\d+$/, "").endsWith(".vercel.app")) {
    return `https://${host}/agent/${safeSlug}`;
  }

  const localPort = host?.match(/:(\d+)$/)?.[1] || "3000";
  const isLocal =
    host === "localhost" ||
    host?.startsWith("localhost:") ||
    host === "127.0.0.1" ||
    host?.startsWith("127.0.0.1:") ||
    host?.endsWith(".localhost") ||
    host?.includes(".localhost:");
  const domain = isLocal ? `localhost:${localPort}` : rootDomain();
  const protocol = domain.startsWith("localhost") ? "http" : "https";

  return `${protocol}://${safeSlug}.${domain}`;
}
