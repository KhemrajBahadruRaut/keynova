import "server-only";

import { getBackendUrl } from "@/lib/auth/backend";
import {
  cloneHeroContent,
  type HeroContent,
  type HeroSlide,
} from "@/lib/hero-content";

type ContentApiResponse = {
  status?: string;
  data?: { content?: unknown } | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSlide(value: unknown): HeroSlide | null {
  if (!isRecord(value)) return null;

  const image = typeof value.image === "string" ? value.image.trim() : "";
  const alt = typeof value.alt === "string" ? value.alt.trim() : "";
  const location =
    typeof value.location === "string" ? value.location.trim() : "";

  if (
    !image ||
    image.length > 2048 ||
    !alt ||
    alt.length > 250 ||
    !location ||
    location.length > 120
  ) {
    return null;
  }

  return { image, alt, location };
}

function normalizeContent(value: unknown): HeroContent | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.slides) ||
    value.slides.length < 1 ||
    value.slides.length > 8
  ) {
    return null;
  }

  const slides = value.slides.map(normalizeSlide);
  if (slides.some((slide) => slide === null)) return null;
  return { slides: slides as HeroSlide[] };
}

export async function getHeroContent(): Promise<HeroContent> {
  const fallback = cloneHeroContent();

  try {
    const response = await fetch(
      getBackendUrl("content/get_content.php", "?page_key=homehero"),
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
