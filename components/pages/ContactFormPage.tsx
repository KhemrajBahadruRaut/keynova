"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { teamPhotoUrl } from "@/lib/team-data";
import ContactField from "@/components/ui/ContactField";
import PhoneInput from "@/components/ui/PhoneInput";
import { useFormValidation } from "@/lib/use-form-validation";
import { CONTACT_FIELD_VALIDATORS, validateText } from "@/lib/validation";

const BACKGROUND_IMAGE_URL = "/contacts/contact-bg.png";

// Portrait photo of the person, shown on the left.
const PORTRAIT_IMAGE_URL = "/letstalk/image.png";

const HELP_OPTIONS = [
  "Buying a home",
  "Selling a home",
  "Renting",
  "Investment properties",
  "General inquiry",
];

const ACCENT = "#003251";
const ACCENT_HOVER = "#0c2f4d";
const FIELD_CLASS_NAME =
  "w-full border-b border-gray-400 bg-transparent pb-1.5 text-sm text-gray-700 placeholder:text-gray-500 focus:border-[#003251] focus:outline-none aria-invalid:border-red-500 aria-invalid:focus:border-red-500";
const FORM_VALIDATORS = {
  ...CONTACT_FIELD_VALIDATORS,
  subject: (value: string) =>
    validateText(value, "Subject", { required: true, max: 180 }),
  helpWith: (value: string) =>
    HELP_OPTIONS.includes(value) ? "" : "Choose what we can help with.",
};

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  helpWith: string;
  phone: string;
}

const INITIAL_FORM: ContactForm = {
  firstName: "",
  lastName: "",
  email: "",
  subject: "",
  message: "",
  helpWith: "",
  phone: "",
};

type FormStatus = {
  type: "success" | "error";
  message: string;
} | null;

export default function LetsTalkPage({
  agent = null,
  initialSubject = "",
}: Readonly<{
  agent?: { slug: string; name: string; photo: string | null } | null;
  initialSubject?: string;
}>) {
  const portraitUrl = agent ? teamPhotoUrl(agent.photo) : PORTRAIT_IMAGE_URL;
  const [form, setForm] = useState<ContactForm>(() => ({
    ...INITIAL_FORM,
    subject: initialSubject,
  }));
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>(null);
  const { errors, validateField, validateForm, resetValidation } =
    useFormValidation(form, FORM_VALIDATORS);

  function updateField<K extends keyof ContactForm>(field: K, value: ContactForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    validateField(field);
    setFormStatus(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setFormStatus(null);
    if (!validateForm()) return;
    if (!agreed) {
      setFormStatus({
        type: "error",
        message: "Please agree to the contact terms before submitting.",
      });
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
    if (!apiBase) {
      setFormStatus({
        type: "error",
        message: "The contact service is not configured. Please try again later.",
      });
      return;
    }

    setSubmitting(true);
    setFormStatus(null);

    try {
      const response = await fetch(`${apiBase}/contact/submit_contact.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          help_with: form.helpWith,
          consent: true,
          ...(agent ? { agent_slug: agent.slug } : {}),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        status?: string;
        message?: string;
      } | null;

      if (!response.ok || payload?.status !== "success") {
        throw new Error(payload?.message || "Your message could not be sent.");
      }

      setForm({ ...INITIAL_FORM, subject: initialSubject });
      resetValidation();
      setAgreed(false);
      setFormStatus({
        type: "success",
        message: agent
          ? `Thank you. Your message has been sent directly to ${agent.name}.`
          : "Thank you. Your message has been sent to the KeyNova team.",
      });
    } catch (submissionError) {
      setFormStatus({
        type: "error",
        message:
          submissionError instanceof Error
            ? submissionError.message
            : "Your message could not be sent.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className=" bg-gray-100 bg-cover bg-center"
      style={
        BACKGROUND_IMAGE_URL
          ? { backgroundImage: `url(${BACKGROUND_IMAGE_URL})` }
          : undefined
      }
    >
      <div className="mx-auto pt-30 grid  max-w-6xl grid-cols-1 items-center gap-10 px-6  md:grid-cols-[1fr_1.2fr] md:px-10">
        {/* Portrait */}
        <div className="flex justify-center md:justify-start">
          <div className="h-105 w-full max-w-md overflow-hidden md:h-178">
            {portraitUrl ? (
              <img
                src={portraitUrl}
                alt={agent ? `${agent.name}, KeyNova Group` : "Contact KeyNova Group"}
                className="h-full w-full object-cover object-top"
              />
            ) : agent ? (
              <div
                className="flex h-full w-full items-center justify-center bg-[#edf5f6] text-6xl font-semibold text-[#003251]"
                aria-label={agent.name}
                role="img"
              >
                {agent.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white/60 text-sm text-gray-400">
                Portrait image goes here
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div>
          <h1 className="mb-8 text-center text-3xl font-bold text-[#003251] md:text-left">
            {agent ? `Talk with ${agent.name}` : "Let's Talk"}
          </h1>

          {agent && (
            <p className="-mt-5 mb-8 text-center text-sm text-slate-600 md:text-left">
              This form is routed to {agent.name}&apos;s KeyNova inbox.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-2 gap-6">
              <ContactField error={errors.firstName} errorId="contact-first-name-error">
                <label htmlFor="contact-first-name" className="sr-only">
                  First name
                </label>
                <input
                  id="contact-first-name"
                  name="firstName"
                  type="text"
                  placeholder="First Name"
                  autoComplete="given-name"
                  required
                  maxLength={100}
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  onBlur={() => validateField("firstName")}
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby="contact-first-name-error"
                  className={FIELD_CLASS_NAME}
                />
              </ContactField>
              <ContactField error={errors.lastName} errorId="contact-last-name-error">
                <label htmlFor="contact-last-name" className="sr-only">
                  Last name
                </label>
                <input
                  id="contact-last-name"
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                  autoComplete="family-name"
                  required
                  maxLength={100}
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  onBlur={() => validateField("lastName")}
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby="contact-last-name-error"
                  className={FIELD_CLASS_NAME}
                />
              </ContactField>
            </div>

            <ContactField error={errors.email} errorId="contact-email-error">
              <label htmlFor="contact-email" className="sr-only">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                required
                maxLength={254}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                onBlur={() => validateField("email")}
                aria-invalid={Boolean(errors.email)}
                aria-describedby="contact-email-error"
                className={FIELD_CLASS_NAME}
              />
            </ContactField>

            <ContactField error={errors.subject} errorId="contact-subject-error">
              <label htmlFor="contact-subject" className="sr-only">
                Subject
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                placeholder="Subject"
                required
                maxLength={180}
                value={form.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                onBlur={() => validateField("subject")}
                aria-invalid={Boolean(errors.subject)}
                aria-describedby="contact-subject-error"
                className={FIELD_CLASS_NAME}
              />
            </ContactField>

            <ContactField error={errors.message} errorId="contact-message-error">
              <label htmlFor="contact-message" className="sr-only">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                placeholder="Type your message here (at least 10 words) ..."
                required
                maxLength={5000}
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                onBlur={() => validateField("message")}
                aria-invalid={Boolean(errors.message)}
                aria-describedby="contact-message-error"
                rows={3}
                className={`${FIELD_CLASS_NAME} resize-none`}
              />
            </ContactField>

            <ContactField error={errors.helpWith} errorId="contact-help-with-error">
              <label
                htmlFor="contact-help-with"
                className="mb-2 block text-sm font-semibold text-[#003251]"
              >
                What Can We Help With?
              </label>
              <div className="relative">
                <select
                  id="contact-help-with"
                  name="helpWith"
                  required
                  value={form.helpWith}
                  onChange={(e) => updateField("helpWith", e.target.value)}
                  onBlur={() => validateField("helpWith")}
                  aria-invalid={Boolean(errors.helpWith)}
                  aria-describedby="contact-help-with-error"
                  className={`${FIELD_CLASS_NAME} cursor-pointer pr-8`}
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                >
                  <option value="" disabled>
                    Choose One
                  </option>
                  {HELP_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[#003251]" />
              </div>
            </ContactField>

            <ContactField error={errors.phone} errorId="contact-phone-error">
              <label htmlFor="contact-phone" className="sr-only">
                Phone
              </label>
              <PhoneInput
                id="contact-phone"
                name="phone"
                autoComplete="tel"
                required
                value={form.phone}
                onValueChange={(value) => updateField("phone", value)}
                onBlur={() => validateField("phone")}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby="contact-phone-error"
                className={FIELD_CLASS_NAME}
              />
            </ContactField>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                id="contact-consent"
                name="consent"
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  setFormStatus(null);
                }}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#003251]"
              />
              I agree to the terms &amp; conditions below
            </label>

            <p className="text-[11px] leading-relaxed text-gray-500">
              I agree to be contacted by KeyNova Group via call, email, and text for
              real estate services. To opt out, you can reply &apos;stop&apos; at any
              time or reply &apos;help&apos; for assistance. You can also click the
              unsubscribe link in the emails. Message and data rates may apply.
              Message frequency may vary.{" "}
              <a href="#" className="text-[#003251] hover:underline">
                Privacy Policy
              </a>
            </p>

            {formStatus && (
              <p
                role={formStatus.type === "error" ? "alert" : "status"}
                aria-live="polite"
                className={`rounded-md px-3 py-2 text-sm ${
                  formStatus.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {formStatus.message}
              </p>
            )}

            <button
              type="submit"
              disabled={!agreed || submitting}
              className="w-full rounded-md py-3 mb-5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
              {submitting ? "Sending…" : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
