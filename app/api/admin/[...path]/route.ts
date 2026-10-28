import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { getBackendUrl } from "@/lib/auth/backend";
import { getMailSettingsAccessToken } from "@/lib/auth/mail-settings-access";
import { deleteAdminSession, getAdminSession } from "@/lib/auth/session";

export const maxDuration = 60;
export const runtime = "nodejs";

const MAX_PROXY_BODY_BYTES = Math.floor(4.25 * 1024 * 1024);
const MAX_ADMIN_IMAGE_PIXELS = 25_000_000;
const MAX_TEAM_WEBP_BYTES = 4 * 1024 * 1024;
const ADMIN_IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "gif"]);
const ADMIN_IMAGE_UPLOADS: Record<
  string,
  { fields: string[]; maxDimension: number; quality?: number; preserveWebp?: boolean }
> = {
  "team/create_member.php": {
    fields: ["photo"],
    maxDimension: 2400,
    quality: 95,
    preserveWebp: true,
  },
  "team/update_member.php": {
    fields: ["photo"],
    maxDimension: 2400,
    quality: 95,
    preserveWebp: true,
  },
  "property/create_property.php": { fields: ["images[]"], maxDimension: 2400 },
  "property/update_property.php": { fields: ["images[]"], maxDimension: 2400 },
  "content/upload_image.php": { fields: ["image"], maxDimension: 2400 },
};

const ALLOWED_ADMIN_ENDPOINTS = new Set([
  "property/get_properties.php",
  "property/get_doc_requests.php",
  "contact/get_contacts.php",
  "property/get_property.php",
  "property/create_property.php",
  "property/update_property.php",
  "property/upload_property_document_chunk.php",
  "property/delete_property.php",
  "property/delete_property_image.php",
  "property/delete_property_document.php",
  "team/get_admin_members.php",
  "team/create_member.php",
  "team/update_member.php",
  "team/delete_member.php",
  "content/get_admin_content.php",
  "content/update_content.php",
  "content/upload_image.php",
  "content/upload_image_chunk.php",
  "valuation/get_requests.php",
  "valuation/update_request_status.php",
  "testimonials/get_admin_testimonials.php",
  "testimonials/update_testimonial_status.php",
  "settings/get_mail_settings.php",
  "settings/update_mail_settings.php",
]);

const MAIL_SETTINGS_ENDPOINTS = new Set([
  "settings/get_mail_settings.php",
  "settings/update_mail_settings.php",
]);

type AdminProxyContext = {
  params: Promise<{ path: string[] }>;
};

function unauthorizedResponse() {
  return NextResponse.json(
    { status: "error", message: "Your session has expired." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

async function convertAdminImageField(
  formData: FormData,
  fieldName: string,
  maxDimension: number,
  quality: number,
  preserveWebp: boolean,
): Promise<NextResponse | null> {
  const entries = formData.getAll(fieldName);
  if (!entries.some((entry) => entry instanceof File && entry.size > 0)) {
    return null;
  }

  formData.delete(fieldName);
  for (const entry of entries) {
    if (!(entry instanceof File) || entry.size <= 0) {
      formData.append(fieldName, entry);
      continue;
    }

    const baseName =
      entry.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) ||
      "image";
    let optimizedImage: Buffer;
    try {
      const imageBuffer = Buffer.from(await entry.arrayBuffer());
      const source = sharp(imageBuffer, {
        limitInputPixels: MAX_ADMIN_IMAGE_PIXELS,
      });
      const metadata = await source.metadata();
      if (!metadata.format || !ADMIN_IMAGE_FORMATS.has(metadata.format)) {
        const label = fieldName === "photo" ? "photo" : "image";
        return NextResponse.json(
          {
            status: "error",
            message: `The ${label} must be a JPG, PNG, WebP, or GIF image.`,
          },
          { status: 422, headers: { "Cache-Control": "no-store" } },
        );
      }

      if (
        preserveWebp &&
        metadata.format === "webp" &&
        entry.size <= MAX_TEAM_WEBP_BYTES &&
        metadata.width &&
        metadata.height &&
        metadata.width <= maxDimension &&
        metadata.height <= maxDimension &&
        (!metadata.orientation || metadata.orientation === 1)
      ) {
        formData.append(
          fieldName,
          new Blob([Uint8Array.from(imageBuffer)], { type: "image/webp" }),
          `${baseName}.webp`,
        );
        continue;
      }

      optimizedImage = await source
        .rotate()
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 4 })
        .toBuffer();
    } catch (error) {
      console.error(`Admin image conversion failed for ${fieldName}:`, error);
      const label = fieldName === "photo" ? "photo" : "image";
      return NextResponse.json(
        {
          status: "error",
          message: `The ${label} could not be processed. Choose a valid image and try again.`,
        },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }

    formData.append(
      fieldName,
      new Blob([Uint8Array.from(optimizedImage)], { type: "image/webp" }),
      `${baseName}.webp`,
    );
  }

  return null;
}

async function validatePreservedAdminImageField(
  formData: FormData,
  fieldName: string,
): Promise<NextResponse | null> {
  const entries = formData.getAll(fieldName);
  if (!entries.some((entry) => entry instanceof File && entry.size > 0)) {
    return null;
  }

  const label = fieldName === "photo" ? "photo" : "image";
  for (const entry of entries) {
    if (!(entry instanceof File) || entry.size <= 0) continue;

    try {
      const metadata = await sharp(Buffer.from(await entry.arrayBuffer()), {
        limitInputPixels: MAX_ADMIN_IMAGE_PIXELS,
      }).metadata();

      if (!metadata.format || !ADMIN_IMAGE_FORMATS.has(metadata.format)) {
        return NextResponse.json(
          {
            status: "error",
            message: `The ${label} must be a JPG, PNG, WebP, or GIF image.`,
          },
          { status: 422, headers: { "Cache-Control": "no-store" } },
        );
      }

      if (
        !metadata.width ||
        !metadata.height ||
        metadata.width * metadata.height > MAX_ADMIN_IMAGE_PIXELS
      ) {
        return NextResponse.json(
          {
            status: "error",
            message: `The ${label} must be 25 megapixels or smaller.`,
          },
          { status: 422, headers: { "Cache-Control": "no-store" } },
        );
      }
    } catch (error) {
      console.error(`Admin image validation failed for ${fieldName}:`, error);
      return NextResponse.json(
        {
          status: "error",
          message: `The ${label} must be a valid image.`,
        },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  return null;
}

async function proxyAdminRequest(
  request: NextRequest,
  context: AdminProxyContext,
) {
  const session = await getAdminSession();
  if (!session || session.role !== "admin") return unauthorizedResponse();

  if (request.method !== "GET") {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { status: "error", message: "Invalid request origin." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const { path } = await context.params;
  const endpoint = path.join("/");
  if (!ALLOWED_ADMIN_ENDPOINTS.has(endpoint)) {
    return NextResponse.json(
      { status: "error", message: "Admin endpoint not found." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_PROXY_BODY_BYTES) {
    return NextResponse.json(
      {
        status: "error",
        message: "A single upload request is too large for Vercel.",
      },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${session.backendToken}`,
  });
  const imageUpload =
    request.method === "POST" ? ADMIN_IMAGE_UPLOADS[endpoint] : undefined;
  const contentType = request.headers.get("content-type");
  if (contentType && !imageUpload) headers.set("Content-Type", contentType);
  if (MAIL_SETTINGS_ENDPOINTS.has(endpoint)) {
    const mailSettingsAccess = await getMailSettingsAccessToken();
    if (mailSettingsAccess) {
      headers.set("X-KeyNova-Mail-Access", `Bearer ${mailSettingsAccess}`);
    }
  }

  try {
    let body: BodyInit | undefined;
    if (request.method !== "GET") {
      if (imageUpload) {
        const formData = await request.formData();
        const preserveHomeHeroOriginal =
          endpoint === "content/upload_image.php" &&
          formData.get("page_key") === "homehero";

        for (const fieldName of imageUpload.fields) {
          const conversionError = preserveHomeHeroOriginal
            ? await validatePreservedAdminImageField(formData, fieldName)
            : await convertAdminImageField(
                formData,
                fieldName,
                imageUpload.maxDimension,
                imageUpload.quality ?? 85,
                imageUpload.preserveWebp ?? false,
              );
          if (conversionError) return conversionError;
        }

        body = formData;
      } else {
        body = await request.arrayBuffer();
      }
    }

    const backendResponse = await fetch(
      getBackendUrl(endpoint, request.nextUrl.search),
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(55_000),
      },
    );
    const responseBody = await backendResponse.arrayBuffer();
    const responseType =
      backendResponse.headers.get("content-type") || "application/json";

    if (responseType.includes("application/json")) {
      try {
        const data = JSON.parse(new TextDecoder().decode(responseBody)) as {
          status?: string;
          message?: string;
        };
        if (
          data.status === "error" &&
          ["Unauthorized", "Invalid token"].includes(data.message || "")
        ) {
          await deleteAdminSession();
          return unauthorizedResponse();
        }
      } catch {
        // Preserve malformed backend responses for the caller to handle.
      }
    }

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": responseType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Admin API proxy failed:", error);
    return NextResponse.json(
      { status: "error", message: "Admin service is unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export function GET(request: NextRequest, context: AdminProxyContext) {
  return proxyAdminRequest(request, context);
}

export function POST(request: NextRequest, context: AdminProxyContext) {
  return proxyAdminRequest(request, context);
}
