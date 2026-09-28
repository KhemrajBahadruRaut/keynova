import type {
  PropertyAccessVisitor,
  StoredPropertyAccess,
} from "@/lib/property-access";

export interface VisitorHistoryItem {
  id: number;
  source: string;
  first_visited_at: string;
  last_visited_at: string;
  title: string;
  address: string;
  price: string;
  cover_image: string | null;
}

export interface VisitorInquiryItem {
  id: number;
  property_id: number | null;
  message: string;
  created_at: string;
  title: string;
  address: string;
  price: string;
  cover_image: string | null;
  recipient_name: string;
  recipient_email: string;
}

export interface VisitorSavedHomeItem {
  id: number;
  saved_at: string;
  title: string;
  address: string;
  price: string;
  cover_image: string | null;
}

export interface VisitorProfile {
  visitor: PropertyAccessVisitor;
  has_password: boolean;
  email_verified_at: string;
  member_since: string;
  last_login_at: string | null;
  session_expires_at: string;
  saved_homes: VisitorSavedHomeItem[];
  history: VisitorHistoryItem[];
  inquiries: VisitorInquiryItem[];
}

type ApiEnvelope<T> = {
  status?: string;
  message?: string;
  data?: T;
  visitor?: PropertyAccessVisitor;
  access_token?: string;
  expires_at?: string;
  saved_property_ids?: number[];
};

export class VisitorAccountError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "VisitorAccountError";
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";

async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    token?: string;
    body?: Record<string, unknown>;
  } = {},
): Promise<ApiEnvelope<T>> {
  if (!API_BASE) throw new Error("The profile service is not configured.");

  const response = await fetch(`${API_BASE}/user/${path}`, {
    method: options.method || "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new VisitorAccountError("The profile service returned an invalid response.", response.status);
  }
  if (!response.ok || payload.status !== "success") {
    throw new VisitorAccountError(payload.message || "The profile request failed.", response.status);
  }
  return payload;
}

export async function fetchVisitorProfile(token: string): Promise<VisitorProfile> {
  const payload = await request<VisitorProfile>("visitor_profile.php", { token });
  if (!payload.data) throw new Error("The profile response is incomplete.");
  return payload.data;
}

export async function toggleVisitorSavedHome(
  token: string,
  propertyId: number,
  save: boolean,
): Promise<number[]> {
  const payload = await request<never>("toggle_saved_home.php", {
    method: "POST",
    token,
    body: { property_id: propertyId, save },
  });
  return payload.saved_property_ids || [];
}

export async function updateVisitorProfile(
  token: string,
  details: { name: string; phone: string },
): Promise<PropertyAccessVisitor> {
  const payload = await request<never>("update_visitor_profile.php", {
    method: "POST",
    token,
    body: details,
  });
  if (!payload.visitor) throw new Error("The updated profile is incomplete.");
  return payload.visitor;
}

export async function uploadVisitorProfileImage(
  token: string,
  file: File,
): Promise<PropertyAccessVisitor> {
  if (!API_BASE) throw new Error("The profile service is not configured.");
  const form = new FormData();
  form.append("image", file);
  const response = await fetch(`${API_BASE}/user/upload_profile_image.php`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  let payload: ApiEnvelope<never>;
  try {
    payload = (await response.json()) as ApiEnvelope<never>;
  } catch {
    throw new VisitorAccountError(
      "The profile service returned an invalid response.",
      response.status,
    );
  }
  if (!response.ok || payload.status !== "success" || !payload.visitor) {
    throw new VisitorAccountError(
      payload.message || "Unable to upload the profile image.",
      response.status,
    );
  }
  return payload.visitor;
}

export async function requestVisitorEmailChange(token: string, email: string) {
  const payload = await request<never>("request_visitor_email_change.php", {
    method: "POST",
    token,
    body: { email },
  });
  return payload.message || "Verification code sent.";
}

export async function verifyVisitorEmailChange(token: string, code: string) {
  const payload = await request<never>("verify_visitor_email_change.php", {
    method: "POST",
    token,
    body: { code },
  });
  if (!payload.visitor) throw new Error("The updated profile is incomplete.");
  return payload.visitor;
}

export async function changeVisitorPassword(
  token: string,
  details: { current_password: string; new_password: string },
) {
  const payload = await request<never>("change_visitor_password.php", {
    method: "POST",
    token,
    body: details,
  });
  return payload.message || "Password updated.";
}

export async function loginVisitor(email: string, password: string): Promise<StoredPropertyAccess> {
  const payload = await request<never>("visitor_login.php", {
    method: "POST",
    body: { email, password },
  });
  if (!payload.access_token || !payload.expires_at || !payload.visitor) {
    throw new Error("The sign-in response is incomplete.");
  }
  return {
    token: payload.access_token,
    expiresAt: payload.expires_at,
    visitor: payload.visitor,
  };
}

export async function logoutVisitor(token: string) {
  await request<never>("visitor_logout.php", { method: "POST", token, body: {} });
}
