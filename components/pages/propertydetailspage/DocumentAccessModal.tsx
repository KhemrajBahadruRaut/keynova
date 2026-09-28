"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import {
  hasValidationErrors,
  validateEmail,
  validatePhone,
  validateText,
  validateVerificationCode,
} from "@/lib/validation";
import {
  savePropertyAccess,
  type PropertyAccessVisitor,
  type StoredPropertyAccess,
} from "@/lib/property-access";
import { propertyUploadUrl, type PropertyDocument } from "@/lib/property-data";
import { loginVisitor } from "@/lib/visitor-account";

type DocumentStep = "request" | "login" | "verify" | "setup";
type DocumentField =
  | "name"
  | "email"
  | "phone"
  | "code"
  | "loginPassword"
  | "password"
  | "confirmPassword";

interface DocumentAccessModalProps {
  propertyId: string;
  propertyTitle: string;
  documents: PropertyDocument[];
  open: boolean;
  required?: boolean;
  source?: string;
  verifiedVisitor?: PropertyAccessVisitor | null;
  onVerified?: (access: StoredPropertyAccess) => void;
  onClose: () => void;
}

const API = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";
const ACCENT = "#003251";
const ACCENT_HOVER = "#0c2f4d";

export default function DocumentAccessModal({
  propertyId,
  propertyTitle,
  documents,
  open,
  required = false,
  source = "listing",
  verifiedVisitor,
  onVerified,
  onClose,
}: DocumentAccessModalProps) {
  const [step, setStep] = useState<DocumentStep>("request");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [code, setCode] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<
    Partial<Record<DocumentField, boolean>>
  >({});
  const [unlockedEmail, setUnlockedEmail] = useState<string | null>(null);
  const effectiveUnlockedEmail = unlockedEmail || verifiedVisitor?.email || null;

  const validationErrors = {
    name: validateText(name, "Full name", {
      required: true,
      min: 2,
      max: 80,
    }),
    email: validateEmail(email),
    phone: validatePhone(phone, true),
    code: validateVerificationCode(code),
    loginPassword: loginPassword ? "" : "Password is required.",
    password:
      password.length < 10 || password.length > 128
        ? "Password must be between 10 and 128 characters."
        : "",
    confirmPassword:
      !confirmPassword || confirmPassword !== password
        ? "The passwords do not match."
        : "",
  };

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !required) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open, required]);

  const fieldError = (field: DocumentField) =>
    touched[field] ? validationErrors[field] : "";

  const inputClass = (field: DocumentField, extra = "") =>
    `w-full border-b bg-transparent pb-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none ${extra} ${
      fieldError(field)
        ? "border-red-500"
        : "border-gray-300 focus:border-[#003251]"
    }`;

  const closeModal = () => {
    if (required && !effectiveUnlockedEmail) return;
    setError("");
    setCode("");
    setLoginPassword("");
    setSetupToken("");
    setPassword("");
    setConfirmPassword("");
    setTouched({});
    if (!effectiveUnlockedEmail) setStep("request");
    onClose();
  };

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    const requestErrors = {
      name: validationErrors.name,
      email: validationErrors.email,
      phone: validationErrors.phone,
    };

    if (hasValidationErrors(requestErrors)) {
      setTouched({ name: true, email: true, phone: true });
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
          phone: phone.trim(),
          source,
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

  const finishAccess = (payload: {
    access_token?: string;
    expires_at?: string;
    visitor?: PropertyAccessVisitor;
  }) => {
    if (!payload.access_token || !payload.expires_at || !payload.visitor) {
      throw new Error("Account setup succeeded, but access could not be saved.");
    }

    const access: StoredPropertyAccess = {
      token: payload.access_token,
      expiresAt: payload.expires_at,
      visitor: payload.visitor,
    };
    savePropertyAccess(access);
    setUnlockedEmail(payload.visitor.email);
    setCode("");
    setSetupToken("");
    setLoginPassword("");
    setPassword("");
    setConfirmPassword("");
    setTouched({});
    onVerified?.(access);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (validationErrors.email || validationErrors.loginPassword) {
      setTouched({ email: true, loginPassword: true });
      setError("Enter your account email and password.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const access = await loginVisitor(email.trim(), loginPassword);
      savePropertyAccess(access);
      setUnlockedEmail(access.visitor.email);
      setLoginPassword("");
      setTouched({});
      onVerified?.(access);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in. Please try again.",
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
          source,
        }),
      });
      const payload = (await response.json()) as {
        status?: string;
        message?: string;
        requires_profile_setup?: boolean;
        setup_token?: string;
        access_token?: string;
        expires_at?: string;
        visitor?: PropertyAccessVisitor;
      };

      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Invalid or expired code. Try again.");
      }

      if (payload.requires_profile_setup) {
        if (!payload.setup_token) {
          throw new Error("Email verified, but profile setup could not be started.");
        }
        setSetupToken(payload.setup_token);
        setStep("setup");
        setCode("");
        setTouched({});
        return;
      }

      finishAccess(payload);
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

  const handleProfileSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (validationErrors.password || validationErrors.confirmPassword) {
      setTouched((current) => ({
        ...current,
        password: true,
        confirmPassword: true,
      }));
      setError("Please create and confirm a valid password.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (!API) throw new Error("The profile service is not configured.");
      const response = await fetch(`${API}/user/complete_visitor_profile.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setup_token: setupToken,
          password,
          password_confirmation: confirmPassword,
        }),
      });
      const payload = (await response.json()) as {
        status?: string;
        message?: string;
        access_token?: string;
        expires_at?: string;
        visitor?: PropertyAccessVisitor;
      };

      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to create your profile.");
      }
      finishAccess(payload);
    } catch (setupError) {
      setError(
        setupError instanceof Error
          ? setupError.message
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
        if (!required && event.target === event.currentTarget) closeModal();
      }}
    >
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3
            id="document-modal-title"
            className="text-base font-semibold"
            style={{ color: ACCENT }}
          >
            {effectiveUnlockedEmail
              ? documents.length > 1
                ? "Here are your Documents"
                : "Here is your Document"
              : step === "setup"
                ? "Create Your Profile"
              : step === "login"
                ? "Sign In to View This Property"
              : required
                ? "Verify to View This Property"
                : "Access Secure Documents"}
          </h3>
          {!required && (
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close document access modal"
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {effectiveUnlockedEmail ? (
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
              {required
                ? " view this property and its documents."
                : " unlock the documents for this property."}
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
            <div>
              <input
                id="document-access-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={40}
                className={inputClass("phone")}
                placeholder="Phone Number"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setTouched((current) => ({ ...current, phone: true }));
                  setError("");
                }}
                onBlur={() =>
                  setTouched((current) => ({ ...current, phone: true }))
                }
                aria-invalid={Boolean(fieldError("phone"))}
                aria-describedby="document-access-phone-error"
                required
              />
              <p
                id="document-access-phone-error"
                className="mt-1 min-h-4 text-xs text-red-600"
                aria-live="polite"
              >
                {fieldError("phone")}
              </p>
            </div>
            <button
              type="submit"
              disabled={
                submitting ||
                Boolean(
                  validationErrors.name ||
                    validationErrors.email ||
                    validationErrors.phone,
                )
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
              {submitting ? "Sending code..." : "Email Verification Code"}
            </button>
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-xs uppercase tracking-[0.16em] text-gray-400">or</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setStep("login");
                  setError("");
                  setTouched({});
                }}
                className="font-semibold text-[#003251] underline underline-offset-4"
              >
                Sign in
              </button>
            </p>
          </form>
        ) : step === "login" ? (
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <p className="text-sm leading-6 text-gray-500">
              Sign in with your existing Keynova profile to view {propertyTitle} immediately.
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
                id="document-access-login-email"
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
                aria-describedby="document-access-login-email-error"
                required
              />
              <p
                id="document-access-login-email-error"
                className="mt-1 min-h-4 text-xs text-red-600"
                aria-live="polite"
              >
                {fieldError("email")}
              </p>
            </div>
            <div>
              <input
                id="document-access-login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                maxLength={128}
                className={inputClass("loginPassword")}
                placeholder="Password"
                value={loginPassword}
                onChange={(event) => {
                  setLoginPassword(event.target.value);
                  setTouched((current) => ({ ...current, loginPassword: true }));
                  setError("");
                }}
                onBlur={() =>
                  setTouched((current) => ({ ...current, loginPassword: true }))
                }
                aria-invalid={Boolean(fieldError("loginPassword"))}
                aria-describedby="document-access-login-password-error"
                required
              />
              <p
                id="document-access-login-password-error"
                className="mt-1 min-h-4 text-xs text-red-600"
                aria-live="polite"
              >
                {fieldError("loginPassword")}
              </p>
            </div>
            <button
              type="submit"
              disabled={
                submitting ||
                Boolean(validationErrors.email || validationErrors.loginPassword)
              }
              className="w-full py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
              onMouseEnter={(event) => {
                if (!event.currentTarget.disabled) {
                  event.currentTarget.style.backgroundColor = ACCENT_HOVER;
                }
              }}
              onMouseLeave={(event) => {
                if (!event.currentTarget.disabled) {
                  event.currentTarget.style.backgroundColor = ACCENT;
                }
              }}
            >
              {submitting ? "Signing in..." : "Sign In & View Property"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setLoginPassword("");
                setError("");
                setTouched({});
              }}
              className="w-full text-xs text-gray-400 hover:text-gray-600"
            >
              New visitor? Verify your email instead
            </button>
          </form>
        ) : step === "verify" ? (
          <form onSubmit={handleVerify} className="space-y-5" noValidate>
            <p className="text-sm text-gray-500">
              We sent a verification code to{" "}
              <span className="font-medium text-gray-800">{email}</span>. Enter
              it below to {required ? "continue." : "unlock the documents."}
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
              {submitting
                ? "Verifying..."
                : required
                  ? "Verify & View Property"
                  : "Verify & Unlock"}
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
        ) : (
          <form onSubmit={handleProfileSetup} className="space-y-5" noValidate>
            <div>
              <p className="text-sm font-medium text-gray-800">Your email is verified.</p>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Create a password to finish your profile and view {propertyTitle}. You can use
                this email and password to sign in again later.
              </p>
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
            <div>
              <input
                id="document-access-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                className={inputClass("password")}
                placeholder="Create Password (minimum 10 characters)"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setTouched((current) => ({ ...current, password: true }));
                  setError("");
                }}
                onBlur={() =>
                  setTouched((current) => ({ ...current, password: true }))
                }
                aria-invalid={Boolean(fieldError("password"))}
                aria-describedby="document-access-password-error"
                required
              />
              <p
                id="document-access-password-error"
                className="mt-1 min-h-4 text-xs text-red-600"
                aria-live="polite"
              >
                {fieldError("password")}
              </p>
            </div>
            <div>
              <input
                id="document-access-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                className={inputClass("confirmPassword")}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setTouched((current) => ({ ...current, confirmPassword: true }));
                  setError("");
                }}
                onBlur={() =>
                  setTouched((current) => ({ ...current, confirmPassword: true }))
                }
                aria-invalid={Boolean(fieldError("confirmPassword"))}
                aria-describedby="document-access-confirm-password-error"
                required
              />
              <p
                id="document-access-confirm-password-error"
                className="mt-1 min-h-4 text-xs text-red-600"
                aria-live="polite"
              >
                {fieldError("confirmPassword")}
              </p>
            </div>
            <button
              type="submit"
              disabled={
                submitting ||
                Boolean(validationErrors.password || validationErrors.confirmPassword)
              }
              className="w-full py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: ACCENT }}
              onMouseEnter={(event) => {
                if (!event.currentTarget.disabled) {
                  event.currentTarget.style.backgroundColor = ACCENT_HOVER;
                }
              }}
              onMouseLeave={(event) => {
                if (!event.currentTarget.disabled) {
                  event.currentTarget.style.backgroundColor = ACCENT;
                }
              }}
            >
              {submitting ? "Creating profile..." : "Create Profile & View Property"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
