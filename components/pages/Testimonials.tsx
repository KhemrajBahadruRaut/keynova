"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  Quote,
  Star,
} from "lucide-react";

import type { Testimonial } from "@/lib/testimonial-types";

type TestimonialsPayload = {
  status?: string;
  data?: Testimonial[];
};

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTestimonials() {
      try {
        const response = await fetch("/api/testimonials", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as TestimonialsPayload;
        if (response.ok && payload.status === "success") {
          setTestimonials(payload.data || []);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Unable to load homepage testimonials:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadTestimonials();
    return () => controller.abort();
  }, []);

  const goTo = (nextIndex: number) => {
    if (testimonials.length === 0) return;
    setIndex((nextIndex + testimonials.length) % testimonials.length);
  };

  const current = testimonials[index];

  return (
    <section className="bg-[#3A6178] px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.4fr)] lg:gap-14 xl:gap-20">
        <div className="min-w-0">
           <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-200">
            Client stories
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-snug sm:text-4xl">
            What KeyNova
            <br /> buyers &amp; sellers
            <br /> are saying.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/testimonials"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-[#003251]"
            >
              See all
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              href="/testimonials#leave-testimonial"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#176f91] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#105d79]"
            >
              Leave a testimonial
              <MessageSquarePlus aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="h-48 animate-pulse rounded-3xl bg-white/10" aria-label="Loading testimonials" />
        ) : current ? (
          <div className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2 sm:gap-5">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous testimonial"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/50 text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
              disabled={testimonials.length < 2}
            >
              <ChevronLeft size={22} />
            </button>
            <Link
              href={`/testimonials?testimonial=${current.id}`}
              className="flex h-60 min-w-0 flex-col rounded-3xl bg-white/7 p-5 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:p-7"
              aria-label={`Read the full testimonial from ${current.name}`}
            >
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden sm:grid-cols-[minmax(8rem,auto)_minmax(0,1fr)] sm:gap-8 xl:gap-10">
                <div className="shrink-0">
                  <Quote size={28} className="text-white/70" strokeWidth={1.5} />
                  <p className="mt-3 text-sm font-semibold text-white">{current.name}</p>
                  <p className="mt-1 text-xs text-white/60">{current.client_type}</p>
                  <div
                    className="mt-3 flex gap-0.5 text-sky-200"
                    aria-label={`${current.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        aria-hidden="true"
                        size={14}
                        fill={starIndex < current.rating ? "currentColor" : "none"}
                        strokeWidth={starIndex < current.rating ? 0 : 1.5}
                      />
                    ))}
                  </div>
                </div>
                <div className="group min-h-0 min-w-0 text-left">
                  <blockquote className="line-clamp-5 whitespace-pre-wrap text-sm leading-7 text-white/85">
                    “{current.quote}”
                  </blockquote>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-200 transition group-hover:text-white">
                    Read full testimonial
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
              {testimonials.length > 1 && (
                <div className="mt-5 flex items-center justify-center border-t border-white/10 pt-4">
                  <span className="text-xs font-medium tabular-nums text-white/55">
                    {index + 1} / {testimonials.length}
                  </span>
                </div>
              )}
            </Link>
           <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next testimonial"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/50 text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
              disabled={testimonials.length < 2}
            >
              <ChevronRight size={22} />
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/15 bg-white/7 px-7 py-12 text-center sm:px-10">
            <Quote aria-hidden="true" className="mx-auto h-8 w-8 text-white/50" />
            <p className="mt-5 text-lg font-semibold">Client stories are coming soon.</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/65">
              Have you worked with KeyNova? Be the first to share your experience.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

