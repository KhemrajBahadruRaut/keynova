import "server-only";

import { cookies } from "next/headers";

export const MAIL_SETTINGS_ACCESS_COOKIE = "keynova_mail_settings_access";
export const MAIL_SETTINGS_ACCESS_MAX_AGE = 10 * 60;

export async function getMailSettingsAccessToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(MAIL_SETTINGS_ACCESS_COOKIE)?.value || "";
  return /^[a-f0-9]{64}$/i.test(token) ? token.toLowerCase() : "";
}

export async function createMailSettingsAccess(token: string, maxAge: number) {
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error("The backend returned an invalid email-settings token.");
  }

  const cookieStore = await cookies();
  cookieStore.set(MAIL_SETTINGS_ACCESS_COOKIE, token.toLowerCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: Math.min(MAIL_SETTINGS_ACCESS_MAX_AGE, Math.max(1, maxAge)),
    path: "/",
    priority: "high",
  });
}

export async function deleteMailSettingsAccess() {
  const cookieStore = await cookies();
  cookieStore.set(MAIL_SETTINGS_ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
    priority: "high",
  });
}
