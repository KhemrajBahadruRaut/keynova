import sharp from "sharp";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
const TEAM_UPLOAD_NAME = /^team_[a-f0-9]{32}\.(?:jpg|png|webp)$/;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!TEAM_UPLOAD_NAME.test(filename)) return new Response(null, { status: 404 });
  if (!API_BASE) return new Response(null, { status: 503 });

  try {
    const source = await fetch(`${API_BASE}/uploads/${filename}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!source.ok) {
      return new Response(null, { status: source.status === 404 ? 404 : 502 });
    }

    const contentLength = Number(source.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES) return new Response(null, { status: 413 });
    if (!source.headers.get("content-type")?.toLowerCase().startsWith("image/")) {
      return new Response(null, { status: 502 });
    }

    const input = await source.arrayBuffer();
    if (input.byteLength > MAX_IMAGE_BYTES) return new Response(null, { status: 413 });

    const thumbnail = await sharp(Buffer.from(input), { limitInputPixels: 25_000_000 })
      .rotate()
      .resize({
        width: 750,
        withoutEnlargement: true,
        kernel: "lanczos3",
        fastShrinkOnLoad: false,
      })
      .sharpen({ sigma: 0.7 })
      .webp({ quality: 90, effort: 4 })
      .toBuffer();

    return new Response(new Uint8Array(thumbnail), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Team thumbnail generation failed:", error);
    return new Response(null, { status: 502 });
  }
}
