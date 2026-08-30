"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  LoaderCircle,
  Quote,
  Send,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";

import type { Testimonial } from "@/lib/testimonial-types";

const CLIENT_TYPES = [
  "Buyer",
  "Seller",
  "Buyer & Seller",
  "Investor",
  "Other",
] as const;

type FormState = {
  name: string;
  email: string;
  clientType: (typeof CLIENT_TYPES)[number] | "";
  rating: number;
  quote: string;
  consent: boolean;
  website: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  clientType: "",
  rating: 5,
  quote: "",
  consent: false,
  website: "",
};

type ApiPayload = {
  status?: string;
  message?: string;
  data?: Testimonial[];
};

const fieldClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#003251] outline-none transition placeholder:text-slate-400 focus:border-[#2f87a8] focus:ring-4 focus:ring-[#2f87a8]/10";

function RatingStars({ rating }: { rating: number }) {
  return (
    <div
      className="flex gap-1 text-[#2f87a8]"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className="h-4 w-4"
          fill={index < rating ? "currentColor" : "none"}
          strokeWidth={index < rating ? 0 : 1.75}
        />
      ))}
    </div>
  );
}
export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);

  const closeTestimonial = useCallback(() => {
    setSelectedTestimonial(null);

    const url = new URL(window.location.href);
    url.searchParams.delete("testimonial");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  const openTestimonial = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);

    const url = new URL(window.location.href);
    url.searchParams.set("testimonial", String(testimonial.id));
    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  };

  const loadTestimonials = useCallback(async () => {
    try {
      const response = await fetch("/api/testimonials", { cache: "no-store" });
      const payload = (await response.json()) as ApiPayload;
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to load testimonials.");
      }

      const approvedTestimonials = payload.data || [];
      setTestimonials(approvedTestimonials);

      const requestedId = Number(
        new URLSearchParams(window.location.search).get("testimonial"),
      );
      if (requestedId > 0) {
        setSelectedTestimonial(
          approvedTestimonials.find(
            (testimonial) => testimonial.id === requestedId,
          ) || null,
        );
      }
      setLoadError("");
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load testimonials.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadTestimonials(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadTestimonials]);

  useEffect(() => {
    const handleHistoryChange = () => {
      const requestedId = Number(
        new URLSearchParams(window.location.search).get("testimonial"),
      );
      setSelectedTestimonial(
        testimonials.find((testimonial) => testimonial.id === requestedId) ||
          null,
      );
    };

    window.addEventListener("popstate", handleHistoryChange);
    return () => window.removeEventListener("popstate", handleHistoryChange);
  }, [testimonials]);

  useEffect(() => {
    if (!selectedTestimonial) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTestimonial();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeTestimonial, selectedTestimonial]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          client_type: form.clientType,
          rating: form.rating,
          quote: form.quote,
          consent: form.consent,
          website: form.website,
        }),
      });
      const payload = (await response.json()) as ApiPayload;
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to submit your testimonial.");
      }

      setForm(INITIAL_FORM);
      setSuccessMessage(
        payload.message || "Thank you. Your testimonial has been sent for review.",
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit your testimonial.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white text-[#003251]">
      <section className="relative overflow-hidden bg-[#003251] px-6 pb-20 pt-36 text-white sm:pb-24 sm:pt-44 lg:px-10">
        <div className="absolute -right-28 top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -right-8 top-36 h-56 w-56 rounded-full border border-sky-300/30" />
        <div className="absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-sky-300/10" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-200">
            Client stories
          </p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-20">
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              Real moves. Real experiences.
            </h1>
            <div>
              <p className="max-w-xl text-base leading-8 text-white/75 sm:text-lg">
                Hear from the buyers, sellers, and investors who trusted KeyNova
                to help unlock what came next.
              </p>
              <a
                href="#leave-testimonial"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#2f87a8] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#246f8c] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Share your experience
                <Send aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-28 lg:px-10" aria-labelledby="testimonial-list-heading">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#2f7895]">
                In their words
              </p>
              <h2
                id="testimonial-list-heading"
                className="mt-3 text-3xl font-semibold sm:text-4xl"
              >
                What our clients are saying
              </h2>
            </div>
            {!loading && !loadError && testimonials.length > 0 && (
              <p className="text-sm text-slate-500">
                {testimonials.length} approved {testimonials.length === 1 ? "story" : "stories"}
              </p>
            )}
          </div>

          {loadError ? (
            <div
              role="alert"
              className="mt-10 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700"
            >
              {loadError}
            </div>
          ) : loading ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading testimonials">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-3xl bg-slate-100"
                />
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="mt-10 rounded-3xl bg-[#eef4f7] px-6 py-16 text-center sm:px-10">
              <Quote aria-hidden="true" className="mx-auto h-9 w-9 text-[#2f87a8]" />
              <h3 className="mt-5 text-2xl font-semibold">Be the first to share your story.</h3>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                Approved client testimonials will appear here. Tell us about your
                KeyNova experience below.
              </p>
              <a
                href="#leave-testimonial"
                className="mt-7 inline-flex rounded-full bg-[#003251] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#143c60]"
              >
                Leave a testimonial
              </a>
            </div>
          ) : (
            <div className="mt-10 grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <article
                  key={testimonial.id}
                  className="h-80 overflow-hidden rounded-3xl border border-slate-200 bg-[#f8fafc] shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => openTestimonial(testimonial)}
                    className="flex h-full w-full flex-col p-7 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f87a8] sm:p-8"
                    aria-label={`Read the full testimonial from ${testimonial.name}`}
                  >
                    <span className="flex w-full items-start justify-between gap-5">
                      <Quote
                        aria-hidden="true"
                        className="h-8 w-8 text-[#003251]/25"
                        strokeWidth={1.5}
                      />
                      <RatingStars rating={testimonial.rating} />
                    </span>
                    <span className="mt-5 line-clamp-4 flex-1 whitespace-pre-wrap text-base leading-7 text-slate-600">
                      “{testimonial.quote}”
                    </span>
                    <span className="mt-5 w-full border-t border-slate-200 pt-4">
                      <span className="block font-semibold text-[#003251]">
                        {testimonial.name}
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-3 text-sm text-slate-500">
                        <span>{testimonial.client_type}</span>
                        <span className="font-semibold text-[#2f7895]">
                          Read full
                        </span>
                      </span>
                    </span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        id="leave-testimonial"
        className="scroll-mt-24 bg-[#eef4f7] px-6 py-20 sm:py-28 lg:px-10"
        aria-labelledby="leave-testimonial-heading"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#2f7895]">
              Your experience matters
            </p>
            <h2
              id="leave-testimonial-heading"
              className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl"
            >
              Tell us about your KeyNova journey.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Your feedback helps future clients make their next move with
              confidence. Every submission is reviewed before it appears publicly.
            </p>
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#003251]/10 bg-white/60 p-5">
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#2f87a8]" />
              <p className="text-sm leading-6 text-slate-600">
                Your email is used only to verify and manage your submission. It
                is never shown with your public testimonial.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 lg:p-10"
          >
            {successMessage && (
              <div
                role="status"
                className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {submitError && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {submitError}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#003251]">
                Your name
                <input
                  required
                  minLength={2}
                  maxLength={150}
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className={fieldClassName}
                  placeholder="Full name"
                />
              </label>
              <label className="text-sm font-semibold text-[#003251]">
                Email address
                <input
                  required
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className={fieldClassName}
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <label className="mt-5 block text-sm font-semibold text-[#003251]">
              I worked with KeyNova as a
              <select
                required
                value={form.clientType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    clientType: event.target.value as FormState["clientType"],
                  }))
                }
                className={fieldClassName}
              >
                <option value="" disabled>
                  Select one
                </option>
                {CLIENT_TYPES.map((clientType) => (
                  <option key={clientType} value={clientType}>
                    {clientType}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-[#003251]">Your rating</legend>
              <div className="mt-2 flex w-fit gap-1" aria-label={`${form.rating} out of 5 stars selected`}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, rating: value }))}
                      className="rounded-md p-1 text-[#2f87a8] transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003251]"
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      aria-pressed={value === form.rating}
                    >
                      <Star
                        aria-hidden="true"
                        className="h-7 w-7"
                        fill={value <= form.rating ? "currentColor" : "none"}
                        strokeWidth={value <= form.rating ? 0 : 1.75}
                      />
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="mt-6 block text-sm font-semibold text-[#003251]">
              Your testimonial
              <textarea
                required
                minLength={30}
                maxLength={2000}
                rows={7}
                value={form.quote}
                onChange={(event) => setForm((current) => ({ ...current, quote: event.target.value }))}
                className={`${fieldClassName} resize-y`}
                placeholder="What stood out about your experience?"
              />
              <span className="mt-2 block text-right text-xs font-normal text-slate-400">
                {form.quote.length}/2000
              </span>
            </label>

            <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
              />
            </label>

            <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-slate-600">
              <input
                required
                type="checkbox"
                checked={form.consent}
                onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))}
                className="mt-1 h-4 w-4 shrink-0 accent-[#003251]"
              />
              <span>
                I confirm this reflects my experience and give KeyNova permission
                to publish my name, client type, rating, and testimonial.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#003251] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#143c60] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="h-4 w-4" />
              )}
              {submitting ? "Sending…" : "Submit testimonial"}
            </button>
          </form>
        </div>
      </section>

      {selectedTestimonial && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-[#071a2a]/75 p-4 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeTestimonial();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="testimonial-modal-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <header className="sticky top-0 flex items-start justify-between gap-5 border-b border-slate-100 bg-white px-6 py-5 sm:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2f7895]">
                  Client testimonial
                </p>
                <h2
                  id="testimonial-modal-title"
                  className="mt-1 text-xl font-semibold text-[#003251]"
                >
                  {selectedTestimonial.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedTestimonial.client_type}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTestimonial}
                autoFocus
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#003251] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f87a8]"
                aria-label="Close testimonial"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>

            <div className="px-6 py-7 sm:px-8 sm:py-9">
              <div className="flex items-center justify-between gap-5">
                <Quote
                  aria-hidden="true"
                  className="h-10 w-10 text-[#003251]/20"
                  strokeWidth={1.5}
                />
                <RatingStars rating={selectedTestimonial.rating} />
              </div>
              <blockquote className="mt-7 whitespace-pre-wrap text-base leading-8 text-slate-700 sm:text-lg sm:leading-9">
                “{selectedTestimonial.quote}”
              </blockquote>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
