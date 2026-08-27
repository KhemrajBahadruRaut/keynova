import "server-only";

import { getBackendUrl } from "@/lib/auth/backend";
import {
  clonePageContent,
  PAGE_ICON_OPTIONS,
  type PageContentKey,
  type PageContentStep,
  type PageStepIcon,
  type ServicePageContent,
} from "@/lib/page-content";

type ContentApiResponse = {
  status?: string;
  data?: { content?: unknown } | null;
};

const ICONS = new Set<PageStepIcon>(
  PAGE_ICON_OPTIONS.map((option) => option.value),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
) {
  const value = record[key];
  return typeof value === "string" && value.trim() && value.length <= maxLength
    ? value.trim()
    : null;
}

function normalizeStep(value: unknown, index: number): PageContentStep | null {
  if (!isRecord(value) || value.id !== index + 1) return null;

  const navLabel = readString(value, "navLabel", 80);
  const stepLabel = readString(value, "stepLabel", 80);
  const title = readString(value, "title", 180);
  const image = readString(value, "image", 2048);
  const body = readString(value, "body", 30000);
  const icon = value.icon;

  if (
    !navLabel ||
    !stepLabel ||
    !title ||
    !image ||
    !body ||
    typeof icon !== "string" ||
    !ICONS.has(icon as PageStepIcon)
  ) {
    return null;
  }

  return {
    id: index + 1,
    navLabel,
    stepLabel,
    title,
    image,
    body,
    icon: icon as PageStepIcon,
  };
}

function normalizeContent(value: unknown): ServicePageContent | null {
  if (!isRecord(value) || !Array.isArray(value.steps) || value.steps.length !== 6) {
    return null;
  }

  const eyebrow = readString(value, "eyebrow", 80);
  const contactTitle = readString(value, "contactTitle", 150);
  const contactText = readString(value, "contactText", 500);
  const contactButtonLabel = readString(value, "contactButtonLabel", 80);
  const contactButtonHref = readString(value, "contactButtonHref", 255);
  const steps = value.steps.map(normalizeStep);

  if (
    !eyebrow ||
    !contactTitle ||
    !contactText ||
    !contactButtonLabel ||
    !contactButtonHref ||
    !/^\/(?!\/)/.test(contactButtonHref) ||
    steps.some((step) => step === null)
  ) {
    return null;
  }

  return {
    eyebrow,
    contactTitle,
    contactText,
    contactButtonLabel,
    contactButtonHref,
    steps: steps as PageContentStep[],
  };
}

export async function getServicePageContent(
  pageKey: PageContentKey,
): Promise<ServicePageContent> {
  const fallback = clonePageContent(pageKey);

  try {
    const response = await fetch(
      getBackendUrl(
        "content/get_content.php",
        `?page_key=${encodeURIComponent(pageKey)}`,
      ),
      {
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) return fallback;

    const payload = (await response.json()) as ContentApiResponse;
    if (payload.status !== "success" || !payload.data) return fallback;

    return normalizeContent(payload.data.content) || fallback;
  } catch {
    return fallback;
  }
}
