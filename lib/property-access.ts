export const PROPERTY_ACCESS_STORAGE_KEY = "keynova_property_access";
export const PROPERTY_ACCESS_CHANGED_EVENT = "keynova-property-access-changed";
const PROPERTY_ACCESS_COOKIE_KEY = "keynova_profile_access";
const PROPERTY_ACCESS_COOKIE_MIGRATED_KEY = "keynova_profile_access_cookie_migrated";
const PROPERTY_ACCESS_BRIDGE_VALUE_KEY = "keynova_profile_access";
const PROPERTY_ACCESS_BRIDGE_STATUS_KEY = "keynova_profile_bridge";
const PROPERTY_ACCESS_BRIDGE_HASH_KEY = "return_hash";
const PROPERTY_ACCESS_BRIDGE_ATTEMPT_KEY = "keynova_profile_bridge_attempted_at";
let propertyAccessBridgeAttempted = false;

export type PropertyAccessVisitor = {
  name: string;
  email: string;
  phone: string;
  profile_image?: string | null;
};

export type StoredPropertyAccess = {
  token: string;
  expiresAt: string;
  visitor: PropertyAccessVisitor;
};

function isVisitor(value: unknown): value is PropertyAccessVisitor {
  if (!value || typeof value !== "object") return false;
  const visitor = value as Partial<PropertyAccessVisitor>;
  return (
    typeof visitor.name === "string" &&
    typeof visitor.email === "string" &&
    typeof visitor.phone === "string" &&
    (visitor.profile_image === undefined ||
      visitor.profile_image === null ||
      typeof visitor.profile_image === "string")
  );
}

function parsePropertyAccess(value: string | null): StoredPropertyAccess | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredPropertyAccess>;
    const expiresAt =
      typeof parsed.expiresAt === "string"
        ? Date.parse(parsed.expiresAt)
        : Number.NaN;
    if (
      typeof parsed.token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(parsed.token) ||
      !Number.isFinite(expiresAt) ||
      !isVisitor(parsed.visitor) ||
      expiresAt <= Date.now()
    ) {
      return null;
    }
    return parsed as StoredPropertyAccess;
  } catch {
    return null;
  }
}

function sharedCookieDomain(): string | null {
  const hostname = window.location.hostname.toLowerCase().replace(/\.$/, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return "localhost";
  }

  const configured = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "keynovagrp.com")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/:\d+$/, "")
    .replace(/\/$/, "");

  return configured &&
    (hostname === configured || hostname.endsWith(`.${configured}`))
    ? configured
    : null;
}

function readSharedCookie(): string | null {
  const prefix = `${PROPERTY_ACCESS_COOKIE_KEY}=`;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!entry) return null;

  try {
    return decodeURIComponent(entry.slice(prefix.length));
  } catch {
    return null;
  }
}

function cookieSecurityAttribute() {
  return window.location.protocol === "https:" ? "; Secure" : "";
}

function writeSharedCookie(access: StoredPropertyAccess): boolean {
  const expiresAt = new Date(access.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) return false;

  try {
    const domain = sharedCookieDomain();
    const domainAttribute = domain ? `; Domain=${domain}` : "";
    document.cookie = `${PROPERTY_ACCESS_COOKIE_KEY}=${encodeURIComponent(
      JSON.stringify(access),
    )}; Path=/; Expires=${expiresAt.toUTCString()}; SameSite=Lax${domainAttribute}${cookieSecurityAttribute()}`;

    return parsePropertyAccess(readSharedCookie())?.token === access.token;
  } catch {
    return false;
  }
}

function clearSharedCookie() {
  try {
    const base = `${PROPERTY_ACCESS_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `${base}${cookieSecurityAttribute()}`;
    const domain = sharedCookieDomain();
    if (domain) {
      document.cookie = `${base}; Domain=${domain}${cookieSecurityAttribute()}`;
    }
  } catch {
    // The localStorage copy is cleared separately.
  }
}

function consumePropertyAccessBridge(): StoredPropertyAccess | null {
  const parameters = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const value = parameters.get(PROPERTY_ACCESS_BRIDGE_VALUE_KEY);
  const status = parameters.get(PROPERTY_ACCESS_BRIDGE_STATUS_KEY);
  if (!value && !status) return null;
  propertyAccessBridgeAttempted = true;

  const returnHash = parameters.get(PROPERTY_ACCESS_BRIDGE_HASH_KEY) || "";
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}${returnHash}`,
  );

  return value ? parsePropertyAccess(value) : null;
}

function isLocalAgentHostname(hostname: string) {
  return hostname.endsWith(".localhost") && hostname !== "localhost";
}

export function redirectToPropertyAccessBridge(): boolean {
  if (typeof window === "undefined" || !isLocalAgentHostname(window.location.hostname)) {
    return false;
  }
  if (propertyAccessBridgeAttempted) return false;

  let lastAttempt = 0;
  try {
    lastAttempt = Number(
      window.sessionStorage.getItem(PROPERTY_ACCESS_BRIDGE_ATTEMPT_KEY) || "0",
    );
  } catch {
    // The in-memory guard below still prevents a redirect loop.
  }
  if (Number.isFinite(lastAttempt) && Date.now() - lastAttempt < 10_000) {
    return false;
  }

  propertyAccessBridgeAttempted = true;
  try {
    window.sessionStorage.setItem(PROPERTY_ACCESS_BRIDGE_ATTEMPT_KEY, String(Date.now()));
  } catch {
    // Continue with the one-time bridge when sessionStorage is unavailable.
  }
  const rootOrigin = `${window.location.protocol}//localhost${
    window.location.port ? `:${window.location.port}` : ""
  }`;
  const bridgeUrl = new URL("/profile-session-bridge", rootOrigin);
  bridgeUrl.searchParams.set("return_to", window.location.href);
  window.location.replace(bridgeUrl.toString());
  return true;
}

export function completePropertyAccessBridge(returnTo: string): boolean {
  if (typeof window === "undefined") return false;

  let destination: URL;
  try {
    destination = new URL(returnTo);
  } catch {
    return false;
  }

  if (
    destination.protocol !== window.location.protocol ||
    destination.port !== window.location.port ||
    !isLocalAgentHostname(destination.hostname) ||
    destination.username ||
    destination.password
  ) {
    return false;
  }

  const originalHash = destination.hash;
  const access = readPropertyAccess();
  const parameters = new URLSearchParams();
  if (access) {
    parameters.set(PROPERTY_ACCESS_BRIDGE_VALUE_KEY, JSON.stringify(access));
  } else {
    parameters.set(PROPERTY_ACCESS_BRIDGE_STATUS_KEY, "missing");
  }
  if (originalHash) {
    parameters.set(PROPERTY_ACCESS_BRIDGE_HASH_KEY, originalHash);
  }
  destination.hash = parameters.toString();
  window.location.replace(destination.toString());
  return true;
}

export function readPropertyAccess(): StoredPropertyAccess | null {
  if (typeof window === "undefined") return null;

  try {
    const bridgedAccess = consumePropertyAccessBridge();
    if (bridgedAccess) {
      try {
        localStorage.setItem(PROPERTY_ACCESS_STORAGE_KEY, JSON.stringify(bridgedAccess));
      } catch {
        // The shared cookie can still keep this browser session available.
      }
      if (writeSharedCookie(bridgedAccess)) {
        try {
          localStorage.setItem(PROPERTY_ACCESS_COOKIE_MIGRATED_KEY, "1");
        } catch {
          // Cookie storage is sufficient when localStorage is unavailable.
        }
      }
      return bridgedAccess;
    }

    const cookieValue = readSharedCookie();
    const cookieAccess = parsePropertyAccess(cookieValue);
    if (cookieAccess) {
      try {
        localStorage.setItem(PROPERTY_ACCESS_STORAGE_KEY, JSON.stringify(cookieAccess));
        localStorage.setItem(PROPERTY_ACCESS_COOKIE_MIGRATED_KEY, "1");
      } catch {
        // The cookie remains usable even if localStorage is disabled.
      }
      return cookieAccess;
    }

    if (cookieValue !== null) clearSharedCookie();

    const storedValue = localStorage.getItem(PROPERTY_ACCESS_STORAGE_KEY);
    const storedAccess = parsePropertyAccess(storedValue);
    if (!storedAccess) {
      localStorage.removeItem(PROPERTY_ACCESS_STORAGE_KEY);
      return null;
    }

    // A missing shared cookie after migration means the visitor signed out on
    // another Keynova subdomain. Before the first migration, preserve the
    // existing localStorage session and promote it to the shared cookie.
    if (localStorage.getItem(PROPERTY_ACCESS_COOKIE_MIGRATED_KEY) === "1") {
      localStorage.removeItem(PROPERTY_ACCESS_STORAGE_KEY);
      return null;
    }

    if (writeSharedCookie(storedAccess)) {
      try {
        localStorage.setItem(PROPERTY_ACCESS_COOKIE_MIGRATED_KEY, "1");
      } catch {
        // The shared cookie has already been written successfully.
      }
    }
    return storedAccess;
  } catch {
    return null;
  }
}

export function savePropertyAccess(access: StoredPropertyAccess) {
  if (typeof window === "undefined") return;
  let cookieSaved = false;
  try {
    cookieSaved = writeSharedCookie(access);
  } catch {
    // Fall back to this origin's localStorage session.
  }
  try {
    localStorage.setItem(PROPERTY_ACCESS_STORAGE_KEY, JSON.stringify(access));
    if (cookieSaved) {
      localStorage.setItem(PROPERTY_ACCESS_COOKIE_MIGRATED_KEY, "1");
    }
  } catch {
    // The current page can still be unlocked when browser storage is disabled.
  }
  window.dispatchEvent(new Event(PROPERTY_ACCESS_CHANGED_EVENT));
}

export function clearPropertyAccess() {
  if (typeof window === "undefined") return;
  try {
    clearSharedCookie();
  } catch {
    // Continue clearing this origin's localStorage session.
  }
  try {
    localStorage.removeItem(PROPERTY_ACCESS_STORAGE_KEY);
    localStorage.setItem(PROPERTY_ACCESS_COOKIE_MIGRATED_KEY, "1");
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
  window.dispatchEvent(new Event(PROPERTY_ACCESS_CHANGED_EVENT));
}
