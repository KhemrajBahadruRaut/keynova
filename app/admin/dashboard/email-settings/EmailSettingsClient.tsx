"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LockKeyhole,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { ToastNotice } from "@/components/ui/FeedbackProvider";

import { validateEmail, validatePassword } from "@/lib/validation";
import FieldError from "@/components/ui/FieldError";
import { validateRecipientEmail } from "@/lib/admin-validation";
import { useFormValidation } from "@/lib/use-form-validation";

const UNLOCK_VALIDATORS = { password: validatePassword };

const GET_SETTINGS_ENDPOINT = "/api/admin/settings/get_mail_settings.php";
const UPDATE_SETTINGS_ENDPOINT = "/api/admin/settings/update_mail_settings.php";
const UNLOCK_ENDPOINT = "/api/admin/mail-settings/unlock";
const LOCK_ENDPOINT = "/api/admin/mail-settings/lock";
const MAX_RECIPIENTS = 5;

type AccessState = "checking" | "locked" | "unlocked" | "error";
type RecipientGroup = "contact" | "property";

type ApiPayload = {
  status?: string;
  code?: string;
  message?: string;
  retry_after?: number;
  data?: {
    contact_recipients?: string[];
    property_recipients?: string[];
  };
};

async function readPayload(response: Response): Promise<ApiPayload> {
  try {
    return (await response.json()) as ApiPayload;
  } catch {
    return { status: "error", message: "The server returned an invalid response." };
  }
}

function listError(recipients: string[], label: string) {
  if (recipients.length < 1) return `${label} needs at least one recipient.`;
  if (recipients.length > MAX_RECIPIENTS) {
    return `${label} can contain no more than ${MAX_RECIPIENTS} recipients.`;
  }

  const normalized = recipients.map((email) => email.trim().toLowerCase());
  for (const email of normalized) {
    const error = validateEmail(email);
    if (error) return `${label}: ${error}`;
  }
  if (new Set(normalized).size !== normalized.length) {
    return `${label} cannot contain duplicate addresses.`;
  }
  return "";
}

export default function EmailSettingsClient() {
  const router = useRouter();
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contactRecipients, setContactRecipients] = useState<string[]>([]);
  const [propertyRecipients, setPropertyRecipients] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [touchedRecipients, setTouchedRecipients] = useState<Record<RecipientGroup, boolean[]>>({
    contact: [],
    property: [],
  });
  const {
    errors: unlockErrors,
    validateField: validateUnlockField,
    validateForm: validateUnlockForm,
    resetValidation: resetUnlockValidation,
    fieldAttributes: unlockFieldAttributes,
  } = useFormValidation({ password }, UNLOCK_VALIDATORS);

  const handleUnauthorized = useCallback(() => {
    router.replace("/admin");
    router.refresh();
  }, [router]);

  const loadSettings = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(GET_SETTINGS_ENDPOINT, { cache: "no-store" });
      const payload = await readPayload(response);
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (response.status === 403 && payload.code === "verification_required") {
        setContactRecipients([]);
        setPropertyRecipients([]);
        setAccessState("locked");
        return;
      }
      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message || "Unable to load email settings.");
      }

      setContactRecipients(payload.data.contact_recipients || []);
      setPropertyRecipients(payload.data.property_recipients || []);
      setTouchedRecipients({
        contact: (payload.data.contact_recipients || []).map(() => false),
        property: (payload.data.property_recipients || []).map(() => false),
      });
      setSubmitted(false);
      setAccessState("unlocked");
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load email settings.",
      );
      setAccessState("error");
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadSettings(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadSettings]);

  async function unlockSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!validateUnlockForm()) return;

    setUnlocking(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(UNLOCK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = await readPayload(response);
      if (response.status === 401 && payload.message === "Your session has expired.") {
        handleUnauthorized();
        return;
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to unlock email settings.");
      }

      setPassword("");
      resetUnlockValidation();
      setAccessState("checking");
      await loadSettings();
    } catch (unlockError) {
      setError(
        unlockError instanceof Error
          ? unlockError.message
          : "Unable to unlock email settings.",
      );
    } finally {
      setUnlocking(false);
    }
  }

  async function lockSettings() {
    setError("");
    setNotice("");
    try {
      await fetch(LOCK_ENDPOINT, { method: "POST" });
    } finally {
      setPassword("");
      resetUnlockValidation();
      setContactRecipients([]);
      setPropertyRecipients([]);
      setAccessState("locked");
    }
  }

  function recipientsFor(group: RecipientGroup) {
    return group === "contact" ? contactRecipients : propertyRecipients;
  }

  function setRecipientsFor(group: RecipientGroup, recipients: string[]) {
    if (group === "contact") setContactRecipients(recipients);
    else setPropertyRecipients(recipients);
    setError("");
    setNotice("");
  }

  function updateRecipient(group: RecipientGroup, index: number, value: string) {
    markRecipientTouched(group, index);
    setRecipientsFor(
      group,
      recipientsFor(group).map((email, emailIndex) =>
        emailIndex === index ? value : email,
      ),
    );
  }

  function markRecipientTouched(group: RecipientGroup, index: number) {
    setTouchedRecipients((current) => {
      const touched = [...current[group]];
      touched[index] = true;
      return { ...current, [group]: touched };
    });
  }

  function addRecipient(group: RecipientGroup) {
    const recipients = recipientsFor(group);
    if (recipients.length >= MAX_RECIPIENTS) return;
    setRecipientsFor(group, [...recipients, ""]);
    setTouchedRecipients((current) => ({ ...current, [group]: [...current[group], false] }));
  }

  function removeRecipient(group: RecipientGroup, index: number) {
    const recipients = recipientsFor(group);
    if (recipients.length <= 1) return;
    setRecipientsFor(
      group,
      recipients.filter((_, emailIndex) => emailIndex !== index),
    );
    setTouchedRecipients((current) => ({
      ...current,
      [group]: recipients
        .map((_, emailIndex) => current[group][emailIndex] || false)
        .filter((_, emailIndex) => emailIndex !== index),
    }));
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const validationError =
      listError(contactRecipients, "Main contact recipients") ||
      listError(propertyRecipients, "Property inquiry recipients");
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(UPDATE_SETTINGS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_recipients: contactRecipients.map((email) => email.trim()),
          property_recipients: propertyRecipients.map((email) => email.trim()),
        }),
      });
      const payload = await readPayload(response);
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (response.status === 403 && payload.code === "verification_required") {
        setContactRecipients([]);
        setPropertyRecipients([]);
        setAccessState("locked");
        setError("Your secure access expired. Enter your password again.");
        return;
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to save email settings.");
      }

      setContactRecipients(payload.data?.contact_recipients || contactRecipients);
      setPropertyRecipients(payload.data?.property_recipients || propertyRecipients);
      setSubmitted(false);
      setTouchedRecipients({
        contact: (payload.data?.contact_recipients || contactRecipients).map(() => false),
        property: (payload.data?.property_recipients || propertyRecipients).map(() => false),
      });
      setNotice(payload.message || "Email recipients updated.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save email settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  function recipientSection(
    group: RecipientGroup,
    title: string,
    description: string,
  ) {
    const recipients = recipientsFor(group);
    return (
      <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="font-semibold text-[#003251]">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-slate-400">
            {recipients.length} / {MAX_RECIPIENTS}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {recipients.map((email, index) => {
            const inputError = submitted || touchedRecipients[group][index]
              ? validateRecipientEmail(email, recipients, index)
              : "";
            return (
              <div key={`${group}-${index}`}>
                <div className="flex items-center gap-2">
                  <label htmlFor={`${group}-recipient-${index}`} className="sr-only">
                    {title} recipient {index + 1}
                  </label>
                  <input
                    id={`${group}-recipient-${index}`}
                    type="email"
                    autoComplete="off"
                    inputMode="email"
                    maxLength={254}
                    value={email}
                    onChange={(event) => updateRecipient(group, index, event.target.value)}
                    onBlur={() => markRecipientTouched(group, index)}
                    aria-describedby={`${group}-recipient-${index}-error`}
                    className={`min-w-0 flex-1 rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#2f87a8]/25 ${
                      inputError
                        ? "border-red-300 focus:border-red-400"
                        : "border-slate-200 focus:border-[#2f87a8]"
                    }`}
                    placeholder={`recipient${index + 1}@example.com`}
                    aria-invalid={Boolean(inputError)}
                  />
                  <button
                    type="button"
                    onClick={() => removeRecipient(group, index)}
                    disabled={recipients.length <= 1}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
                    aria-label={`Remove recipient ${index + 1} from ${title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <FieldError id={`${group}-recipient-${index}-error`} error={inputError} />
              </div>
            );
          })}
        </div>

        {recipients.length < MAX_RECIPIENTS && (
          <button
            type="button"
            onClick={() => addRecipient(group)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#2f87a8]/25 bg-white px-3 py-2 text-sm font-semibold text-[#2f7895] transition hover:border-[#2f87a8] hover:bg-sky-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add recipient
          </button>
        )}
      </section>
    );
  }

  return (
    <>
      <ToastNotice message={error} kind="error" />
      <ToastNotice message={notice} kind="success" />

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f7895]">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#003251] sm:text-3xl">
            Email settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose who receives website contact and property inquiry notifications.
          </p>
        </div>
        {accessState === "unlocked" && (
          <button
            type="button"
            onClick={lockSettings}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            Lock settings
          </button>
        )}
      </div>

      {accessState === "checking" && (
        <section className="flex min-h-72 items-center justify-center rounded-xl border border-[#dbe5ea] bg-white">
          <div className="text-center text-sm text-slate-500">
            <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#2f87a8]" aria-hidden="true" />
            Checking secure access…
          </div>
        </section>
      )}

      {accessState === "error" && (
        <section className="rounded-xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Unable to load secure settings.</p>
          <button
            type="button"
            onClick={() => {
              setAccessState("checking");
              loadSettings();
            }}
            className="mt-4 rounded-lg bg-[#003251] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </section>
      )}

      {accessState === "locked" && (
        <section className="mx-auto max-w-lg rounded-xl border border-[#dbe5ea] bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-[#2f7895]">
            <LockKeyhole className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="mt-5 text-center">
            <h2 className="text-xl font-semibold text-[#003251]">Password required</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Re-enter your current admin password to view or change email recipients.
              Access remains unlocked for 10 minutes.
            </p>
          </div>

          <form onSubmit={unlockSettings} className="mt-6" noValidate>
            <label htmlFor="email-settings-password" className="text-sm font-medium text-slate-700">
              Admin password
            </label>
            <input
              id="email-settings-password"
              {...unlockFieldAttributes("password", "email-settings-password-error")}
              type="password"
              autoComplete="current-password"
              maxLength={128}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                validateUnlockField("password");
                setError("");
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#2f87a8] focus:ring-2 focus:ring-[#2f87a8]/25 aria-invalid:border-red-500 aria-invalid:focus:border-red-500"
              autoFocus
            />
            <FieldError id="email-settings-password-error" error={unlockErrors.password} />
            <button
              type="submit"
              disabled={unlocking}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#003251] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b2e4c] disabled:cursor-wait disabled:opacity-60"
            >
              {unlocking ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              )}
              {unlocking ? "Verifying…" : "Unlock email settings"}
            </button>
          </form>
        </section>
      )}

      {accessState === "unlocked" && (
        <form onSubmit={saveSettings} className="rounded-xl border border-[#dbe5ea] bg-white p-4 shadow-sm shadow-[#003251]/5 sm:p-6" noValidate>
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              Secure access is active. Recipient addresses are protected and can only be
              changed during this verified session.
            </p>
          </div>

          <div className="space-y-5">
            {recipientSection(
              "contact",
              "Main contact form",
              "These addresses receive submissions from the main Contact page. Agent-profile forms continue to use the selected agent’s email when one is available.",
            )}
            {recipientSection(
              "property",
              "Property details inquiries",
              "These addresses receive inquiries submitted from individual property details pages.",
            )}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#2f7895]" aria-hidden="true" />
            <p>
              This page controls recipients only. The outgoing sender and SMTP credentials
              remain securely configured on the server.
            </p>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#003251] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b2e4c] disabled:cursor-wait disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {saving ? "Saving…" : "Save email recipients"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
