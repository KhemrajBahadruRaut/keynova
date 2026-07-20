import "server-only";

import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "keynova_admin_session";
export const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60;

export type AdminSession = {
  adminId: string;
  email: string;
  role: "admin";
  backendToken: string;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return secret;
}

async function getEncryptionKey() {
  const secretBytes = new TextEncoder().encode(getAuthSecret());
  const digest = await crypto.subtle.digest("SHA-256", secretBytes);
  return new Uint8Array(digest);
}

export async function encryptAdminSession(session: AdminSession) {
  return new EncryptJWT(session)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("keynova")
    .setAudience("keynova-admin")
    .setExpirationTime("8h")
    .encrypt(await getEncryptionKey());
}

export async function decryptAdminSession(token: string | undefined) {
  if (!token) return null;

  try {
    const { payload } = await jwtDecrypt(token, await getEncryptionKey(), {
      issuer: "keynova",
      audience: "keynova-admin",
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256GCM"],
      clockTolerance: 5,
    });

    if (
      typeof payload.adminId !== "string" ||
      typeof payload.email !== "string" ||
      payload.role !== "admin" ||
      typeof payload.backendToken !== "string" ||
      payload.backendToken.length < 32
    ) {
      return null;
    }

    return {
      adminId: payload.adminId,
      email: payload.email,
      role: payload.role,
      backendToken: payload.backendToken,
    } satisfies AdminSession;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return decryptAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function createAdminSession(session: AdminSession) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, await encryptAdminSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
    priority: "high",
  });
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
    priority: "high",
  });
}
