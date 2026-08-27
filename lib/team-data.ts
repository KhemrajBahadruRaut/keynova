export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  photo: string | null;
  bio: string;
  email: string;
  phone: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asBoolean(value: unknown, fallback = true): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return !["0", "false", "no", "inactive"].includes(
    String(value).trim().toLowerCase(),
  );
}

export function slugifyTeamMemberName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function teamPhotoUrl(photo: string | null | undefined): string {
  const source = photo?.trim();
  if (!source) return "";
  if (/^(https?:)?\/\//i.test(source) || /^(data|blob):/i.test(source)) {
    return source;
  }

  if (source.startsWith("/teams/")) return source;

  const cleanSource = source.replace(/^\/+/, "");
  if (!API_BASE) return source.startsWith("/") ? source : `/${cleanSource}`;
  if (cleanSource.startsWith("uploads/")) return `${API_BASE}/${cleanSource}`;
  return `${API_BASE}/uploads/${cleanSource}`;
}

export function normalizeTeamMember(value: unknown): TeamMember {
  const member = asRecord(value);
  const name = asString(member.name);

  return {
    id: asString(member.id),
    slug: asString(member.slug) || slugifyTeamMemberName(name),
    name,
    role: asString(member.role || member.title),
    photo: asString(member.photo || member.image || member.photo_url) || null,
    bio: asString(member.bio || member.description),
    email: asString(member.email),
    phone: asString(member.phone),
    sortOrder: asNumber(member.sort_order ?? member.sortOrder),
    isActive: asBoolean(member.is_active ?? member.isActive),
    createdAt: asString(member.created_at ?? member.createdAt),
    updatedAt: asString(member.updated_at ?? member.updatedAt),
  };
}

function unwrapList(payload: ApiEnvelope | unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const envelope = asRecord(payload);
  const data = envelope.data;
  if (Array.isArray(data)) return data;

  const nestedData = asRecord(data);
  if (Array.isArray(nestedData.members)) return nestedData.members;
  return [];
}

function unwrapMember(payload: ApiEnvelope | unknown): unknown {
  const envelope = asRecord(payload);
  const data = "data" in envelope ? envelope.data : payload;
  if (Array.isArray(data)) return data[0];

  const nestedData = asRecord(data);
  return nestedData.member ?? data;
}

async function readJson(response: Response): Promise<ApiEnvelope | unknown> {
  const payload = (await response.json()) as ApiEnvelope | unknown;
  const envelope = asRecord(payload);
  const status = asString(envelope.status).toLowerCase();

  if (status && status !== "success") {
    throw new Error(asString(envelope.message) || "The team service returned an error.");
  }

  return payload;
}

async function requestTeamMembers(signal?: AbortSignal): Promise<TeamMember[]> {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not configured.");

  const response = await fetch(`${API_BASE}/team/get_members.php`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Team request failed with status ${response.status}.`);
  }

  const payload = await readJson(response);
  return unwrapList(payload)
    .map(normalizeTeamMember)
    .filter((member) => member.id && member.slug && member.name && member.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

async function requestTeamMember(
  slug: string,
  signal?: AbortSignal,
): Promise<TeamMember | null> {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE is not configured.");

  const response = await fetch(
    `${API_BASE}/team/get_member.php?slug=${encodeURIComponent(slug)}`,
    { cache: "no-store", signal },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Team member request failed with status ${response.status}.`);
  }

  let payload: ApiEnvelope | unknown;
  try {
    payload = await readJson(response);
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) return null;
    throw error;
  }

  const member = normalizeTeamMember(unwrapMember(payload));
  return member.id && member.slug && member.name && member.isActive ? member : null;
}

export async function getTeamMembers(signal?: AbortSignal): Promise<TeamMember[]> {
  try {
    return await requestTeamMembers(signal);
  } catch {
    // Never republish static records when the admin-managed source is unavailable.
    return [];
  }
}

export async function getTeamMember(
  slug: string,
  signal?: AbortSignal,
): Promise<TeamMember | null> {
  try {
    return await requestTeamMember(slug, signal);
  } catch {
    // A stale fallback could expose a profile that an admin has hidden or deleted.
    return null;
  }
}
