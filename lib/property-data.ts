export interface PropertyDocument {
  name: string;
  file: string;
}

export interface PropertyRecord {
  id: string;
  title: string;
  address: string;
  price: string;
  building_size: string;
  units: string;
  year_built: string;
  description: string;
  highlights: string[];
  agent_name: string;
  agent_title: string;
  agent_phone: string;
  agent_email: string;
  agent_photo: string | null;
  cover_image: string | null;
  images: string[];
  documents: PropertyDocument[];
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
}

export type PropertyDestination = "listing" | "off_market";

type ApiEnvelope = {
  status?: string;
  message?: string;
  data?: unknown;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function asCoordinate(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(asString).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function asDocuments(value: unknown): PropertyDocument[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((document) => {
    const item = asRecord(document);
    const name = asString(item.name);
    const file = asString(item.file);
    return name && file ? [{ name, file }] : [];
  });
}

export function normalizeProperty(value: unknown): PropertyRecord {
  const property = asRecord(value);

  return {
    id: asString(property.id),
    title: asString(property.title),
    address: asString(property.address),
    price: asString(property.price),
    building_size: asString(property.building_size),
    units: asString(property.units),
    year_built: asString(property.year_built),
    description: asString(property.description),
    highlights: asStringArray(property.highlights),
    agent_name: asString(property.agent_name),
    agent_title: asString(property.agent_title),
    agent_phone: asString(property.agent_phone),
    agent_email: asString(property.agent_email),
    agent_photo: asString(property.agent_photo) || null,
    cover_image: asString(property.cover_image) || null,
    images: asStringArray(property.images),
    documents: asDocuments(property.documents),
    property_type: asString(property.property_type),
    bedrooms: asString(property.bedrooms || property.beds),
    bathrooms: asString(property.bathrooms || property.baths),
    created_at: asString(property.created_at),
    lat: asCoordinate(property.lat),
    lng: asCoordinate(property.lng),
  };
}

async function requestApi(path: string, signal?: AbortSignal) {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE is not configured.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Property request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as ApiEnvelope;
  if (payload.status !== "success") {
    throw new Error(payload.message || "The property service returned an error.");
  }

  return payload.data;
}

export async function fetchListingProperties(
  destination: PropertyDestination = "listing",
  signal?: AbortSignal,
): Promise<PropertyRecord[]> {
  const data = await requestApi(
    `/property/get_properties.php?destination=${destination}`,
    signal,
  );

  return Array.isArray(data)
    ? data.map(normalizeProperty).filter((property) => property.id)
    : [];
}

export async function fetchProperty(
  id: string,
  signal?: AbortSignal,
): Promise<PropertyRecord | null> {
  const data = await requestApi(
    `/property/get_property.php?id=${encodeURIComponent(id)}`,
    signal,
  );
  const item = Array.isArray(data) ? data[0] : data;
  const property = normalizeProperty(item);
  return property.id ? property : null;
}

export function propertyUploadUrl(file: string | null | undefined): string {
  if (!file) return "";
  if (/^https?:\/\//i.test(file)) return file;
  if (!API_BASE) return "";
  return `${API_BASE}/uploads/${file.replace(/^\/+/, "")}`;
}

export function numericPropertyValue(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function displayPrice(price: string): string {
  if (!price) return "Price upon request";
  return /[$€£¥]/.test(price) ? price : `$${price}`;
}

export function displayBuildingSize(size: string): string {
  if (!size) return "Size not listed";
  return /\b(sf|sq\.?\s*ft|square\s*feet)\b/i.test(size)
    ? size
    : `${size} sq. ft`;
}
