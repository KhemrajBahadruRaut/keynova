const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";

export function canOptimizeImage(source: string): boolean {
  if (source.startsWith("/") && !source.startsWith("//")) return true;

  try {
    const image = new URL(source);
    if (
      image.protocol === "https:" &&
      image.hostname === "images.unsplash.com" &&
      image.port === "" &&
      image.pathname.startsWith("/photo-")
    ) {
      return true;
    }

    if (!API_BASE) return false;
    const api = new URL(API_BASE);
    return (
      image.origin === api.origin &&
      image.pathname.startsWith(`${api.pathname.replace(/\/$/, "")}/uploads/`) &&
      image.search === ""
    );
  } catch {
    return false;
  }
}
