"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { validateEmail, validatePhone, validateText } from "@/lib/validation";

// ---------------------------------------------------------------------------
// Configuration — swap these for your real assets
// ---------------------------------------------------------------------------

// Background texture behind the whole page (the marble look in the reference).
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

const ACCENT = "#0F3A5F";
const ACCENT_HOVER = "#0c2f4d";

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

export default function LetsTalkPage() {
  const [form, setForm] = useState<ContactForm>(INITIAL_FORM);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<FormStatus>(null);

  function updateField<K extends keyof ContactForm>(field: K, value: ContactForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormStatus(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError =
      validateText(form.firstName, "First name", { required: true, max: 100 }) ||
      validateText(form.lastName, "Last name", { required: true, max: 100 }) ||
      validateEmail(form.email) ||
      validateText(form.subject, "Subject", { required: true, max: 180 }) ||
      validateText(form.message, "Message", { required: true, min: 10, max: 5000 }) ||
      (!form.helpWith ? "Choose what we can help with." : "") ||
      validatePhone(form.phone) ||
      (!agreed ? "Please agree to the contact terms before submitting." : "");

    if (validationError) {
      setFormStatus({ type: "error", message: validationError });
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
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        status?: string;
        message?: string;
      } | null;

      if (!response.ok || payload?.status !== "success") {
        throw new Error(payload?.message || "Your message could not be sent.");
      }

      setForm(INITIAL_FORM);
      setAgreed(false);
      setFormStatus({
        type: "success",
        message: "Thank you. Your message has been sent to the KeyNova team.",
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
      className="min-h-screen bg-gray-100 bg-cover bg-center"
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
            {PORTRAIT_IMAGE_URL ? (
              <img
                src={PORTRAIT_IMAGE_URL}
                alt="Contact"
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white/60 text-sm text-gray-400">
                Portrait image goes here
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div>
          <h1 className="mb-8 text-center text-3xl font-bold text-[#0F3A5F] md:text-left">
            Let&apos;s Talk
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
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
                className="w-full border-b border-gray-400 bg-transparent pb-1.5 text-sm text-gray-700 placeholder:text-gray-500 focus:border-[#0F3A5F] focus:outline-none"
              />
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
                className="w-full border-b border-gray-400 bg-transparent pb-1.5 text-sm text-gray-700 placeholder:text-gray-500 focus:border-[#0F3A5F] focus:outline-none"
              />
            </div>

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
              className="w-full border-b border-gray-400 bg-transparent pb-1.5 text-sm text-gray-700 placeholder:text-gray-500 focus:border-[#0F3A5F] focus:outline-none"
            />

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
              className="w-full border-b border-gray-400 bg-transparent pb-1.5 text-sm text-gray-700 placeholder:text-gray-500 focus:border-[#0F3A5F] focus:outline-none"
            />

            <label htmlFor="contact-message" className="sr-only">
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              placeholder="Type your message here ..."
              required
              minLength={10}
              maxLength={5000}
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
              rows={3}
              className="w-full resize-none border-b border-gray-400 bg-transparent pb-1.5 text-sm text-gray-700 placeholder:text-gray-500 focus:border-[#0F3A5F] focus:outline-none"
            />

            <div>
              <label
                htmlFor="contact-help-with"
                className="mb-2 block text-sm font-semibold text-[#0F3A5F]"
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
                  className="w-full cursor-pointer border-b border-gray-400 bg-transparent pb-1.5 pr-8 text-sm text-gray-700 focus:border-[#0F3A5F] focus:outline-none"
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
                <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0F3A5F]" />
              </div>
            </div>

            <label htmlFor="contact-phone" className="sr-only">
              Phone
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              placeholder="Phone"
              autoComplete="tel"
              maxLength={30}
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full border-b border-gray-400 bg-transparent pb-1.5 text-sm text-gray-700 placeholder:text-gray-500 focus:border-[#0F3A5F] focus:outline-none"
            />

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
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#0F3A5F]"
              />
              I agree to the terms &amp; conditions below
            </label>

            <p className="text-[11px] leading-relaxed text-gray-500">
              I agree to be contacted by KeyNova Group via call, email, and text for
              real estate services. To opt out, you can reply &apos;stop&apos; at any
              time or reply &apos;help&apos; for assistance. You can also click the
              unsubscribe link in the emails. Message and data rates may apply.
              Message frequency may vary.{" "}
              <a href="#" className="text-[#0F3A5F] hover:underline">
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
