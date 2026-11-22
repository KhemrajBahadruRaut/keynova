export interface HeroSlide {
  image: string;
  alt: string;
  location: string;
}

export interface HeroContent {
  slides: HeroSlide[];
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
