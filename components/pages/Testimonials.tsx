"use client";
import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Quote,
  ArrowRight,
} from "lucide-react";

interface Testimonial {
  id: string;
  author: string;
  rating: number;
  quote: string;
}

const testimonials: Testimonial[] = [
  {
    id: "r-1",
    author: "Anonymous",
    rating: 5,
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
  {
    id: "r-2",
    author: "Anonymous",
    rating: 5,
    quote:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  },
  {
    id: "r-3",
    author: "Anonymous",
    rating: 5,
    quote:
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt, neque porro quisquam est.",
  },
  {
    id: "r-4",
    author: "Anonymous",
    rating: 5,
    quote:
      "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati.",
  },
];

const TestimonialsPage: React.FC = () => {
  const [index, setIndex] = useState(0);

  const goTo = (i: number) =>
    setIndex((i + testimonials.length) % testimonials.length);

  const current = testimonials[index];

  return (
    <section className="bg-[#3A6178] px-4 py-12 text-white sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(14rem,0.8fr)_minmax(0,1.4fr)] lg:gap-14 xl:gap-20">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold leading-snug sm:text-4xl">
            What KeyNova
            <br /> buyers &amp; sellers
            <br /> are saying.
          </h1>
          <a
            href="/testimonials"
            className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-white/90 transition-colors hover:text-white"
          >
            See All
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2  sm:gap-5">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous testimonial"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="min-w-0">
            <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-[minmax(7rem,auto)_minmax(0,1fr)] sm:gap-8 xl:gap-10">
              <div className="shrink-0">
                <Quote size={28} className="text-white/70" strokeWidth={1.5} />
                <p className="mt-2 text-sm text-white/90">{current.author}</p>
                <div className="mt-1 flex gap-0.5 text-amber-300">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  ))}
                </div>
              </div>
              <p className="min-w-0 text-sm leading-relaxed text-white/85">
                {current.quote}
              </p>
            </div>
            <div className="mt-7 flex items-center justify-center sm:mt-8">
              <div className="flex gap-4 sm:gap-5">
                {testimonials.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                    className={`h-3 w-3 transition-colors ${
                      i === index ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next testimonial"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsPage;
