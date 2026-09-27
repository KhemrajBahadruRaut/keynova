import { resolveHeroImage } from "@/lib/hero-content";

export type HomepageActionCardId = "buy" | "list" | "valuation" | "contact";

export interface HomepageActionCardImage {
  id: HomepageActionCardId;
  image: string;
}

export interface HomepageActionContent {
  cards: HomepageActionCardImage[];
}

export const HOMEPAGE_ACTION_CARD_DETAILS: Record<
  HomepageActionCardId,
  { title: string; description: string; href: string }
> = {
  buy: {
    title: "Buy with us",
    description: "Find your next home with local experts guiding every step.",
    href: "/buywithus",
  },
  list: {
    title: "List with us",
    description:
      "Sell your property for the best price with our strategic marketing and extensive network.",
    href: "/listwithus",
  },
  valuation: {
    title: "Home Valuation",
    description: "Discover the current market value of your property in minutes.",
    href: "/homevaluation",
  },
  contact: {
    title: "Contact Us",
    description: "Get in touch with our team for personalized real estate advice.",
    href: "/contact",
  },
};

export const DEFAULT_HOMEPAGE_ACTION_CONTENT: HomepageActionContent = {
  cards: [
    {
      id: "buy",
      image:
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "list",
      image:
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "valuation",
      image:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "contact",
      image:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    },
  ],
};

export function cloneHomepageActionContent(): HomepageActionContent {
  return {
    cards: DEFAULT_HOMEPAGE_ACTION_CONTENT.cards.map((card) => ({ ...card })),
  };
}

export function resolveHomepageActionImage(image: string): string {
  return resolveHeroImage(image);
}
