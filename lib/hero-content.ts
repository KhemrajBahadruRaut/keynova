export interface HeroSlide {
  image: string;
  alt: string;
  location: string;
}

export interface HeroContent {
  slides: HeroSlide[];
}

export const DEFAULT_HERO_CONTENT: HeroContent = {
  slides: [
    {
      image:
        "https://images.unsplash.com/photo-1553734021-17c8ee5de759?auto=format&fit=crop&w=1920&q=85",
      alt: "Beacon Hill neighborhood in Boston, Massachusetts",
      location: "Beacon Hill, Boston",
    },
    {
      image:
        "https://images.unsplash.com/photo-1599136115254-f3fa567872ae?auto=format&fit=crop&w=1920&q=85",
      alt: "Historic brick homes along a Beacon Hill street in Boston",
      location: "Beacon Hill, Boston",
    },
    {
      image:
        "https://images.unsplash.com/photo-1766381854360-e4ab2f8f7291?auto=format&fit=crop&w=1920&q=85",
      alt: "Historic row homes on Acorn Street in Boston, Massachusetts",
      location: "Acorn Street, Boston",
    },
    {
      image:
        "https://images.unsplash.com/photo-1563772030906-5837787ca892?auto=format&fit=crop&w=1920&q=85",
      alt: "Brick-lined residential lane in Beacon Hill, Massachusetts",
      location: "Beacon Hill, Boston",
    },
  ],
};

export function cloneHeroContent(): HeroContent {
  return {
    slides: DEFAULT_HERO_CONTENT.slides.map((slide) => ({ ...slide })),
  };
}

export function resolveHeroImage(image: string): string {
  const source = image.trim();
  if (!source || /^https?:\/\//i.test(source) || source.startsWith("/")) {
    return source;
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  if (!apiBase) return `/uploads/${source.replace(/^uploads\//, "")}`;
  return `${apiBase}/uploads/${source.replace(/^uploads\//, "")}`;
}
