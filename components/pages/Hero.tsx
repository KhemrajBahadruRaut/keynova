"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../navbar/Navbar";
import { Search } from "lucide-react";
import Link from "next/link";

const MASSACHUSETTS_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1553734021-17c8ee5de759?auto=format&fit=crop&w=1920&q=85",
    alt: "Beacon Hill neighborhood in Boston, Massachusetts",
    location: "Beacon Hill, Boston",
  },
  {
    src: "https://images.unsplash.com/photo-1599136115254-f3fa567872ae?auto=format&fit=crop&w=1920&q=85",
    alt: "Historic brick homes along a Beacon Hill street in Boston",
    location: "Beacon Hill, Boston",
  },
  {
    src: "https://images.unsplash.com/photo-1766381854360-e4ab2f8f7291?auto=format&fit=crop&w=1920&q=85",
    alt: "Historic row homes on Acorn Street in Boston, Massachusetts",
    location: "Acorn Street, Boston",
  },
  {
    src: "https://images.unsplash.com/photo-1563772030906-5837787ca892?auto=format&fit=crop&w=1920&q=85",
    alt: "Brick-lined residential lane in Beacon Hill, Massachusetts",
    location: "Beacon Hill, Boston",
  },
] as const;

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % MASSACHUSETTS_SLIDES.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Navbar />
      {/* HERO */}
      <section className="relative w-full h-screen min-h-160 overflow-hidden">
        {MASSACHUSETTS_SLIDES.map((slide, index) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={index === activeSlide ? slide.alt : ""}
            aria-hidden={index !== activeSlide}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-[#001d2f]/45" />

        <div className="relative z-10 h-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-white font-semibold leading-[1.05] text-4xl sm:text-5xl lg:text-6xl">
            Make the Unattainable Attainable{" "}
          </h1>
          <p className="text-white/90 text-lg mt-6">
            Simplifying your path to homeownership.
          </p>
          <div className="mt-8 w-full max-w-xl">
            <form
              action="/listing"
              method="get"
              className="flex min-w-0 flex-col gap-3"
            >
              <label htmlFor="hero-property-search" className="sr-only">
                Search properties by address, city, state, or ZIP code
              </label>
              <div className="relative min-w-0 flex-1 rounded-2xl  bg-white/12 p-1.5 shadow-2xl shadow-slate-950/20 backdrop-blur-sm transition focus-within:border-white/60 focus-within:bg-white/20">
                <input
                  id="hero-property-search"
                  name="search"
                  type="search"
                  maxLength={120}
                  placeholder="Address, city, state, or ZIP code"
                  className="h-11 w-full rounded-xl bg-transparent pl-4 pr-28 text-sm text-white outline-none placeholder:text-white/40"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-2 rounded-xl bg-[#003251] px-5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:translate-y-[-52%] hover:bg-[#143c60] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Search aria-hidden="true" className="h-4 w-4" />
                  Search
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/listing"
                  aria-label="Browse all properties"
                  className="inline-flex h-9 items-center justify-center rounded-full border border-white/35 bg-white/15 px-5 text-xs font-semibold tracking-wide text-white shadow-lg shadow-slate-950/10 backdrop-blur-xl transition hover:bg-white hover:text-[#003251] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Properties
                </Link>

                <Link
                  href="/meet-the-team"
                  aria-label="Find an agent"
                  className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/15 px-5 text-xs font-semibold tracking-wide text-white shadow-lg shadow-slate-950/10 backdrop-blur-xl transition hover:bg-white hover:text-[#003251] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Agents
                </Link>
              </div>
            </form>
          </div>
        </div>

        <p className="absolute bottom-8 left-8 z-10 hidden text-xs font-semibold uppercase tracking-[0.2em] text-white/85 sm:block">
          {MASSACHUSETTS_SLIDES[activeSlide].location}
        </p>

        <div
          className="absolute bottom-8 right-8 z-10 flex gap-2"
          aria-label="Hero images"
        >
          {MASSACHUSETTS_SLIDES.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`Show image ${index + 1}: ${slide.location}`}
              aria-current={index === activeSlide ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all ${
                index === activeSlide
                  ? "w-8 bg-white"
                  : "w-2.5 bg-white/45 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
