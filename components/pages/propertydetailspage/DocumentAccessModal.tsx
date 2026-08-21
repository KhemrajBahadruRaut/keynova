"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import {
  hasValidationErrors,
  validateEmail,
  validateText,
  validateVerificationCode,
} from "@/lib/validation";
import { propertyUploadUrl, type PropertyDocument } from "@/lib/property-data";

type DocumentStep = "request" | "verify";
type DocumentField = "name" | "email" | "code";

interface DocumentAccessModalProps {
  propertyId: string;
  propertyTitle: string;
  documents: PropertyDocument[];
  open: boolean;
  onClose: () => void;
}

const API = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const ACCENT = "#0F3A5F";
const ACCENT_HOVER = "#0c2f4d";

export default function DocumentAccessModal({
  propertyId,
  propertyTitle,
  documents,
  open,
  onClose,
}: DocumentAccessModalProps) {
  const [step, setStep] = useState<DocumentStep>("request");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<
    Partial<Record<DocumentField, boolean>>
  >({});
  const [unlockedEmail, setUnlockedEmail] = useState<string | null>(null);

  const storageKey = `doc_unlock_property_${propertyId}`;
  const validationErrors = {
    name: validateText(name, "Full name", {
      required: true,
      min: 2,
      max: 80,
    }),
    email: validateEmail(email),
    code: validateVerificationCode(code),
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (!saved) return;

        const parsed = JSON.parse(saved) as {
          email?: string;
          unlockedAt?: number;
        };
        if (
          parsed.email &&
          parsed.unlockedAt &&
          Date.now() - parsed.unlockedAt < THIRTY_DAYS
        ) {
          setUnlockedEmail(parsed.email);
          setEmail(parsed.email);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  const fieldError = (field: DocumentField) =>
    touched[field] ? validationErrors[field] : "";

  const inputClass = (field: DocumentField, extra = "") =>
    `w-full border-b bg-transparent pb-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none ${extra} ${
      fieldError(field)
        ? "border-red-500"
        : "border-gray-300 focus:border-[#0F3A5F]"
    }`;

  const closeModal = () => {
    setError("");
    setCode("");
    setTouched({});
    if (!unlockedEmail) setStep("request");
    onClose();
  };

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    const requestErrors = {
      name: validationErrors.name,
      email: validationErrors.email,
    };

    if (hasValidationErrors(requestErrors)) {
      setTouched({ name: true, email: true });
      setError("Please correct the highlighted fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (!API) throw new Error("The document service is not configured.");
      const response = await fetch(`${API}/property/request_document.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          name: name.trim(),
          email: email.trim(),
        }),
      });
      const payload = (await response.json()) as {
        status?: string;
        message?: string;
      };

      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to send the verification code.");
      }

      setStep("verify");
      setTouched({});
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Network error. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (validationErrors.code) {
      setTouched((current) => ({ ...current, code: true }));
      setError("Enter the 6-digit verification code.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (!API) throw new Error("The document service is not configured.");
      const response = await fetch(`${API}/property/verify_document_code.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          email: email.trim(),
          code,
        }),
      });
      const payload = (await response.json()) as {
        status?: string;
        message?: string;
      };

      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Invalid or expired code. Try again.");
      }

      const verifiedEmail = email.trim();
      setUnlockedEmail(verifiedEmail);
      setCode("");
      setTouched({});
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ email: verifiedEmail, unlockedAt: Date.now() }),
        );
      } catch {
        // Access still remains unlocked for the current page session.
      }
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Network error. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const singleDocument = documents.length === 1 ? documents[0] : null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div className="w-full max-w-lg  bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3
            id="document-modal-title"
            className="text-base font-semibold"
            style={{ color: ACCENT }}
          >
            {unlockedEmail
              ? documents.length > 1
                ? "Here are your Documents"
                : "Here is your Document"
              : "Access Secure Documents"}
          </h3>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close document access modal"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {unlockedEmail ? (
          <div>
            {singleDocument ? (
              <>
                <p className="mb-5 text-sm text-gray-500">
                  Click the button below to start the download
                </p>
                <a
                  href={propertyUploadUrl(singleDocument.file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: ACCENT }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = ACCENT_HOVER)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = ACCENT)
                  }
                >
                  <Download className="h-4 w-4" />
                  Download Document
                </a>
              </>
            ) : documents.length > 1 ? (
              <>
                <p className="mb-5 text-sm text-gray-500">
                  Click a button below to start each download
                </p>
                <div className="space-y-3">
                  {documents.map((document) => (
                    <a
                      key={document.file}
                      href={propertyUploadUrl(document.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-between gap-3 rounded-lg py-2.5 px-4 text-sm font-medium text-white transition-colors"
                      style={{ backgroundColor: ACCENT }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = ACCENT_HOVER)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = ACCENT)
                      }
                    >
                      <span className="min-w-0 truncate">{document.name}</span>
                      <Download className="h-4 w-4 shrink-0" />
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <p className="rounded-lg bg-gray-50 px-3 py-4 text-sm text-gray-500">
                No documents have been added for {propertyTitle} yet.
              </p>
            )}
          </div>
        ) : step === "request" ? (
          <form onSubmit={handleRequest} className="space-y-5" noValidate>
            <p className="text-sm text-gray-500">
              Enter your details and we&apos;ll email you a verification code to
              unlock the documents for this property.
            </p>
            {error && (
              <p
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500"
                role="alert"
              >
                {error}
              </p>
            )}
            <div>
              <input
                id="document-access-name"
                name="name"
                type="text"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                className={inputClass("name")}
                placeholder="Full Name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setTouched((current) => ({ ...current, name: true }));
                  setError("");
                }}
                onBlur={() =>
                  setTouched((current) => ({ ...current, name: true }))
                }
                aria-invalid={Boolean(fieldError("name"))}
                aria-describedby="document-access-name-error"
                required
              />
              <p
                id="document-access-name-error"
                className="mt-1 min-h-4 text-xs text-red-600"
                aria-live="polite"
              >
                {fieldError("name")}
              </p>
            </div>
            <div>
              <input
                id="document-access-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                className={inputClass("email")}
                placeholder="Email Address"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setTouched((current) => ({ ...current, email: true }));
                  setError("");
                }}
                onBlur={() =>
                  setTouched((current) => ({ ...current, email: true }))
                }
                aria-invalid={Boolean(fieldError("email"))}
                aria-describedby="document-access-email-error"
                required
              />
              <p
                id="document-access-email-error"
                className="mt-1 min-h-4 text-xs text-red-600"
                aria-live="polite"
              >
                {fieldError("email")}
              </p>
            </div>
            <button
              type="submit"
              disabled={
                submitting || Boolean(validationErrors.name || validationErrors.email)
              }
              className="w-full py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.backgroundColor = ACCENT_HOVER;
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.backgroundColor = ACCENT;
              }}
            >
              {submitting ? "Sending code..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-5" noValidate>
            <p className="text-sm text-gray-500">
              We sent a verification code to{" "}
              <span className="font-medium text-gray-800">{email}</span>. Enter
              it below to unlock the documents.
            </p>
            {error && (
              <p
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500"
                role="alert"
              >
                {error}
              </p>
            )}
            <div>
              <input
                id="document-access-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                className={inputClass(
                  "code",
                  "text-center font-semibold tracking-[0.3em]",
                )}
                placeholder="••••••"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setTouched((current) => ({ ...current, code: true }));
                  setError("");
                }}
                onBlur={() =>
                  setTouched((current) => ({ ...current, code: true }))
                }
                aria-invalid={Boolean(fieldError("code"))}
                aria-describedby="document-access-code-error"
                required
              />
              <p
                id="document-access-code-error"
                className="mt-1 min-h-4 text-center text-xs text-red-600"
                aria-live="polite"
              >
                {fieldError("code")}
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting || Boolean(validationErrors.code)}
              className="w-full py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.backgroundColor = ACCENT_HOVER;
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.backgroundColor = ACCENT;
              }}
            >
              {submitting ? "Verifying..." : "Verify & Unlock"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setError("");
                setCode("");
                setTouched((current) => ({ ...current, code: false }));
              }}
              className="w-full text-xs text-gray-400 hover:text-gray-600"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}