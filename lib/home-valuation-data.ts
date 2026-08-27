import "server-only";

import { getBackendUrl } from "@/lib/auth/backend";
import {
  cloneHomeValuationContent,
  type HomeValuationContent,
} from "@/lib/home-valuation-content";

type ContentApiResponse = {
  status?: string;
  data?: { content?: unknown } | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  value: Record<string, unknown>,
  key: keyof HomeValuationContent,
  maxLength: number,
) {
  const field = value[key];
  return typeof field === "string" && field.trim() && field.length <= maxLength
    ? field.trim()
    : null;
}

function readOptions(
  value: Record<string, unknown>,
  key: "propertyTypes" | "roomOptions",
  maxItems: number,
  maxLength: number,
) {
  const options = value[key];
  if (
    !Array.isArray(options) ||
    options.length < 1 ||
    options.length > maxItems ||
    options.some(
      (option) =>
        typeof option !== "string" ||
        !option.trim() ||
        option.length > maxLength,
    )
  ) {
    return null;
  }
  return options.map((option) => (option as string).trim());
}

function normalizeContent(value: unknown): HomeValuationContent | null {
  if (!isRecord(value)) return null;

  const content = {
    image: readString(value, "image", 2048),
    imageAlt: readString(value, "imageAlt", 250),
    title: readString(value, "title", 180),
    addressPlaceholder: readString(value, "addressPlaceholder", 100),
    zipPlaceholder: readString(value, "zipPlaceholder", 100),
    propertyTypeLabel: readString(value, "propertyTypeLabel", 100),
    propertyTypePlaceholder: readString(value, "propertyTypePlaceholder", 120),
    propertyTypes: readOptions(value, "propertyTypes", 20, 100),
    bedroomsLabel: readString(value, "bedroomsLabel", 100),
    bathroomsLabel: readString(value, "bathroomsLabel", 100),
    roomOptions: readOptions(value, "roomOptions", 10, 20),
    namePlaceholder: readString(value, "namePlaceholder", 100),
    emailPlaceholder: readString(value, "emailPlaceholder", 100),
    phonePlaceholder: readString(value, "phonePlaceholder", 100),
    consentText: readString(value, "consentText", 3000),
    privacyText: readString(value, "privacyText", 3000),
    submitButtonLabel: readString(value, "submitButtonLabel", 100),
    footerDisclosure: readString(value, "footerDisclosure", 3000),
    privacyPolicyLabel: readString(value, "privacyPolicyLabel", 100),
    privacyPolicyHref: readString(value, "privacyPolicyHref", 2048),
    successTitle: readString(value, "successTitle", 180),
    successText: readString(value, "successText", 1000),
  };

  if (Object.values(content).some((field) => field === null)) return null;
  return content as HomeValuationContent;
}

export async function getHomeValuationContent(): Promise<HomeValuationContent> {
  const fallback = cloneHomeValuationContent();
  try {
    const response = await fetch(
      getBackendUrl(
        "content/get_content.php",
        "?page_key=homevaluation",
      ),
      { cache: "no-store", signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok) return fallback;

    const payload = (await response.json()) as ContentApiResponse;
    if (payload.status !== "success" || !payload.data) return fallback;
    return normalizeContent(payload.data.content) || fallback;
  } catch {
    return fallback;
  }
}
