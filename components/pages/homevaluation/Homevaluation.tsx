"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import type { HomeValuationContent } from "@/lib/home-valuation-content";
import { resolvePageImage } from "@/lib/page-content";

interface ValuationForm {
  address: string;
  zip: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
}

type ApiPayload = {
  status?: string;
  message?: string;
};

function initialForm(content: HomeValuationContent): ValuationForm {
  const firstRoomOption = content.roomOptions[0] || "1";
  return {
    address: "",
    zip: "",
    propertyType: "",
    bedrooms: firstRoomOption,
    bathrooms: firstRoomOption,
    name: "",
    email: "",
    phone: "",
    consent: false,
  };
}

export default function HomeValuation({
  content,
}: Readonly<{ content: HomeValuationContent }>) {
  const [form, setForm] = useState<ValuationForm>(() => initialForm(content));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const updateField = <Key extends keyof ValuationForm>(
    field: Key,
    value: ValuationForm[Key],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSubmitted(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
    if (!apiBase) {
      setError("The valuation service is not configured. Please contact us directly.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSubmitted(false);
    try {
      const response = await fetch(`${apiBase}/valuation/submit_valuation.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: form.address,
          zip: form.zip,
          property_type: form.propertyType,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          name: form.name,
          email: form.email,
          phone: form.phone,
          consent: form.consent,
        }),
      });
      let payload: ApiPayload = {};
      try {
        payload = (await response.json()) as ApiPayload;
      } catch {
        payload = { message: "The server returned an invalid response." };
      }
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to submit your valuation request.");
      }

      setForm(initialForm(content));
      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit your valuation request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    "w-full border-0 border-b border-[#003251]/30 bg-transparent py-2 text-sm text-[#003251] placeholder:text-[#003251]/50 focus:border-[#003251] focus:outline-none focus:ring-0";

  return (
    <div className="grid grid-cols-1 pt-21 lg:grid-cols-2">
      <div className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvePageImage(content.image)}
          alt={content.imageAlt}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex items-start justify-center px-6 py-12 md:px-16">
        <div className="w-full max-w-md">
          <h1 className="mb-8 text-center text-3xl font-bold text-[#003251]">
            {content.title}
          </h1>

          {submitted && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800" role="status">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{content.successTitle}</p>
                  <p className="mt-1 text-sm leading-6">{content.successText}</p>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              name="address"
              autoComplete="street-address"
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder={content.addressPlaceholder}
              maxLength={255}
              required
              className={fieldClass}
            />

            <input
              type="text"
              name="postal-code"
              autoComplete="postal-code"
              value={form.zip}
              onChange={(event) => updateField("zip", event.target.value)}
              placeholder={content.zipPlaceholder}
              maxLength={20}
              required
              className={fieldClass}
            />

            <div>
              <label htmlFor="valuation-property-type" className="mb-2 block text-sm font-semibold text-[#003251]">
                {content.propertyTypeLabel}
              </label>
              <div className="relative">
                <select
                  id="valuation-property-type"
                  value={form.propertyType}
                  onChange={(event) => updateField("propertyType", event.target.value)}
                  required
                  className={`${fieldClass} appearance-none pr-8`}
                >
                  <option value="" disabled>
                    {content.propertyTypePlaceholder}
                  </option>
                  {content.propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[#003251]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
              {(["bedrooms", "bathrooms"] as const).map((field) => (
                <fieldset key={field}>
                  <legend className="mb-2 text-sm font-semibold text-[#003251]">
                    {field === "bedrooms" ? content.bedroomsLabel : content.bathroomsLabel}
                  </legend>
                  <div className="flex flex-wrap items-center gap-3">
                    {content.roomOptions.map((option) => (
                      <label key={option} className="flex cursor-pointer items-center gap-1.5 text-sm text-[#003251]">
                        <input
                          type="radio"
                          name={field}
                          value={option}
                          checked={form[field] === option}
                          onChange={(event) => updateField(field, event.target.value)}
                          className="h-4 w-4 accent-[#003251]"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            <input
              type="text"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder={content.namePlaceholder}
              maxLength={150}
              required
              className={fieldClass}
            />
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder={content.emailPlaceholder}
              maxLength={254}
              required
              className={fieldClass}
            />
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder={content.phonePlaceholder}
              maxLength={40}
              required
              className={fieldClass}
            />

            <label className="flex cursor-pointer gap-3">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(event) => updateField("consent", event.target.checked)}
                required
                className="mt-1 h-4 w-4 shrink-0 accent-[#003251]"
              />
              <span className="text-xs leading-relaxed text-[#003251]">
                {content.consentText}
              </span>
            </label>

            <p className="text-xs leading-relaxed text-[#003251]">
              {content.privacyText}
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#003251] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {submitting ? "Submitting…" : content.submitButtonLabel}
            </button>

            <p className="text-xs leading-relaxed text-[#003251]">
              {content.footerDisclosure}{" "}
              <a
                href={content.privacyPolicyHref}
                className="underline hover:text-[#003251]/80"
                {...(/^https?:\/\//i.test(content.privacyPolicyHref)
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {content.privacyPolicyLabel}
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
