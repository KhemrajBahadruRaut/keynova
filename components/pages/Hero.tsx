"use client"
import React, { useState, useEffect, useRef } from "react";
import { KeyRound } from "lucide-react";
import Navbar from "../navbar/Navbar";


export default function Hero() {

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Navbar/>
      {/* HERO */}
      <section className="relative w-full h-screen min-h-160 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1920&q=80"
          alt="Modern luxury home exterior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 h-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-white font-semibold leading-[1.05] text-4xl sm:text-5xl lg:text-6xl">
            Unlock Your Future in Homeownership.
          </h1>
          <p className="text-white/90 text-lg mt-6">
            Simplifying your path to homeownership.
          </p>
          <button className="mt-8 px-8 py-3 rounded-full border border-white text-white text-sm font-semibold tracking-wide hover:bg-white hover:text-[#0b2540] transition-colors">
            Start Your Journey
          </button>
        </div>

        {/* Carousel dots */}
        <div className="absolute bottom-8 right-8 flex gap-2 z-10">
          {[0, 1, 2, 3].map((dot) => (
            <span
              key={dot}
              className={`w-2 h-2 rounded-sm ${
                dot === 3 ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
