export const PROPERTY_ACCESS_STORAGE_KEY = "keynova_property_access";

export type PropertyAccessVisitor = {
  name: string;
  email: string;
  phone: string;
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
    typeof visitor.phone === "string"
  );
}

export function readPropertyAccess(): StoredPropertyAccess | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(PROPERTY_ACCESS_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<StoredPropertyAccess>;
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
      clearPropertyAccess();
      return null;
    }
    return parsed as StoredPropertyAccess;
  } catch {
    clearPropertyAccess();
    return null;
  }
}

export function savePropertyAccess(access: StoredPropertyAccess) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROPERTY_ACCESS_STORAGE_KEY, JSON.stringify(access));
  } catch {
    // The current page can still be unlocked when browser storage is disabled.
  }
}

export function clearPropertyAccess() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PROPERTY_ACCESS_STORAGE_KEY);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}
