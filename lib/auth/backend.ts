import "server-only";

export function getBackendBaseUrl() {
  const baseUrl =
    process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "";

  if (!baseUrl) {
    throw new Error("API_BASE_URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
}

export function getBackendUrl(path: string, search = "") {
  const normalizedPath = path.replace(/^\/+/, "");
  return `${getBackendBaseUrl()}/${normalizedPath}${search}`;
}
