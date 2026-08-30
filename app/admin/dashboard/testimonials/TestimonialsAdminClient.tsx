"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Quote,
  Star,
  XCircle,
} from "lucide-react";

import type {
  AdminTestimonial,
  TestimonialStatus,
} from "@/lib/testimonial-types";

const LIST_ENDPOINT = "/api/admin/testimonials/get_admin_testimonials.php";
const UPDATE_ENDPOINT = "/api/admin/testimonials/update_testimonial_status.php";

const FILTERS: Array<{ label: string; value: "all" | TestimonialStatus }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Declined", value: "declined" },
];

const STATUS_STYLES: Record<TestimonialStatus, string> = {
  pending: "bg-sky-50 text-sky-700 ring-sky-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  declined: "bg-red-50 text-red-700 ring-red-200",
};

type ApiPayload = {
  status?: string;
  message?: string;
  data?: AdminTestimonial[];
};

function formatDate(value: string) {
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function StatusIcon({ status }: { status: TestimonialStatus }) {
  if (status === "approved") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === "declined") return <XCircle className="h-3.5 w-3.5" />;
  return <Clock3 className="h-3.5 w-3.5" />;
}

export default function TestimonialsAdminClient() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([]);
  const [filter, setFilter] = useState<"all" | TestimonialStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadTestimonials = useCallback(async () => {
    try {
      const response = await fetch(LIST_ENDPOINT, { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/admin");
        router.refresh();
        return;
      }

      const payload = (await response.json()) as ApiPayload;
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to load testimonials.");
      }

      setTestimonials(payload.data || []);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load testimonials.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadTestimonials(), 0);
    const refresh = window.setInterval(() => loadTestimonials(), 10_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refresh);
    };
  }, [loadTestimonials]);

  const counts = useMemo(
    () => ({
      all: testimonials.length,
      pending: testimonials.filter((testimonial) => testimonial.status === "pending").length,
      approved: testimonials.filter((testimonial) => testimonial.status === "approved").length,
      declined: testimonials.filter((testimonial) => testimonial.status === "declined").length,
    }),
    [testimonials],
  );

  const filteredTestimonials = useMemo(
    () =>
      filter === "all"
        ? testimonials
        : testimonials.filter((testimonial) => testimonial.status === filter),
    [filter, testimonials],
  );

  const updateStatus = async (id: number, status: "approved" | "declined") => {
    setUpdatingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(UPDATE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (response.status === 401) {
        router.replace("/admin");
        router.refresh();
        return;
      }

      const payload = (await response.json()) as ApiPayload;
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to update the testimonial.");
      }

      setTestimonials((current) =>
        current.map((testimonial) =>
          testimonial.id === id
            ? {
                ...testimonial,
                status,
                reviewed_at: new Date().toISOString(),
              }
            : testimonial,
        ),
      );
      setNotice(payload.message || `Testimonial ${status}.`);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update the testimonial.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f7895]">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#003251] sm:text-3xl">
            Testimonials
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review client submissions before they appear on the public website.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <Clock3 aria-hidden="true" className="h-4 w-4" />
          <span className="font-semibold">{counts.pending}</span>
          pending review
        </div>
      </div>

      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-100 bg-red-50 text-red-700"
              : "border-emerald-100 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || notice}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-[#dbe5ea] bg-white shadow-sm shadow-[#003251]/5">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter testimonials">
            {FILTERS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === value
                    ? "bg-[#003251] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    filter === value ? "bg-white/15 text-white" : "bg-white text-slate-500"
                  }`}
                >
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
              <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
              Loading testimonials…
            </div>
          ) : filteredTestimonials.length === 0 ? (
            <div className="py-16 text-center">
              <Quote aria-hidden="true" className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-500">
                No {filter === "all" ? "" : `${filter} `}testimonials found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTestimonials.map((testimonial) => (
                <article
                  key={testimonial.id}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-[#003251]">{testimonial.name}</h2>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${STATUS_STYLES[testimonial.status]}`}
                        >
                          <StatusIcon status={testimonial.status} />
                          {testimonial.status}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          {testimonial.client_type}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <a
                          href={`mailto:${testimonial.email}`}
                          className="text-[#2f7895] hover:underline"
                        >
                          {testimonial.email}
                        </a>
                        <span aria-hidden="true">•</span>
                        <time dateTime={testimonial.created_at}>
                          Submitted {formatDate(testimonial.created_at)}
                        </time>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {testimonial.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(testimonial.id, "approved")}
                          disabled={updatingId !== null}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingId === testimonial.id ? (
                            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                          )}
                          Approve
                        </button>
                      )}
                      {testimonial.status !== "declined" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(testimonial.id, "declined")}
                          disabled={updatingId !== null}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingId === testimonial.id ? (
                            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle aria-hidden="true" className="h-4 w-4" />
                          )}
                          Decline
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-1 text-[#2f87a8]" aria-label={`${testimonial.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill={index < testimonial.rating ? "currentColor" : "none"}
                        strokeWidth={index < testimonial.rating ? 0 : 1.75}
                      />
                    ))}
                  </div>
                  <blockquote className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    “{testimonial.quote}”
                  </blockquote>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
