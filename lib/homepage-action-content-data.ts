import "server-only";

import { getBackendUrl } from "@/lib/auth/backend";
import {
  cloneHomepageActionContent,
  type HomepageActionCardId,
  type HomepageActionContent,
  type HomepageActionCardImage,
} from "@/lib/homepage-action-content";

type ContentApiResponse = {
  status?: string;
  data?: { content?: unknown } | null;
};

const CARD_IDS: HomepageActionCardId[] = ["buy", "list", "valuation", "contact"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeCard(value: unknown, index: number): HomepageActionCardImage | null {
  if (!isRecord(value) || value.id !== CARD_IDS[index]) return null;
  const image = typeof value.image === "string" ? value.image.trim() : "";
  if (!image || image.length > 2048) return null;
  return { id: CARD_IDS[index], image };
}

function normalizeContent(value: unknown): HomepageActionContent | null {
  if (!isRecord(value) || !Array.isArray(value.cards) || value.cards.length !== CARD_IDS.length) {
    return null;
  }

  const cards = value.cards.map(normalizeCard);
  if (cards.some((card) => card === null)) return null;
  return { cards: cards as HomepageActionCardImage[] };
}

export async function getHomepageActionContent(): Promise<HomepageActionContent> {
  const fallback = cloneHomepageActionContent();

  try {
    const response = await fetch(
      getBackendUrl("content/get_content.php", "?page_key=homepagecards"),
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
