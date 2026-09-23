const LOCAL_ROOT_DOMAIN = "localhost:3000";
const PRODUCTION_ROOT_DOMAIN = "keynovagrp.com";

export function rootDomain(): string {
  const configured = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim().toLowerCase();
  if (configured) return configured.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Local development works at john-smith.localhost:3000. Production agent
  // profiles use the custom domain even when the site is opened via Vercel.
  return process.env.NODE_ENV === "development"
    ? LOCAL_ROOT_DOMAIN
    : PRODUCTION_ROOT_DOMAIN;
}

export function agentProfileUrl(slug: string, currentHost?: string): string {
  const host = currentHost?.trim().toLowerCase();
  const localPort = host?.match(/:(\d+)$/)?.[1] || "3000";
  const domain = host && (host === "localhost" || host.startsWith("localhost:") || host.includes(".localhost"))
    ? `localhost:${localPort}`
    : rootDomain();
  const protocol = domain.startsWith("localhost") || domain.includes(".localhost:")
    ? "http"
    : "https";
  return `${protocol}://${slug}.${domain}`;
}
