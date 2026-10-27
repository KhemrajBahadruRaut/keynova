"use client";

import { useEffect, useRef, useState } from "react";

import OptimizedImage from "@/components/ui/OptimizedImage";
import { resolveHeroImage, type HeroSlide } from "@/lib/hero-content";

function isUploadedHeroImage(source: string) {
  return /(?:^|\/)page_content_homehero_[a-f0-9]{32}\.(?:jpe?g|png|webp|gif)(?:$|[?#])/i.test(
    source,
  );
}

export default function HeroSlideshow({ slides }: Readonly<{ slides: HeroSlide[] }>) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [requestedSlides, setRequestedSlides] = useState([0]);
  const [firstSlideReady, setFirstSlideReady] = useState(false);
  const loadedSlides = useRef(new Set<number>());
  const pendingSlide = useRef<number | null>(null);

  function showSlide(index: number) {
    pendingSlide.current = index;
    if (loadedSlides.current.has(index)) {
      setActiveSlide(index);
      pendingSlide.current = null;
    } else {
      setRequestedSlides((current) => current.includes(index) ? current : [...current, index]);
    }
  }

  function handleImageLoaded(index: number) {
    loadedSlides.current.add(index);
    if (index === 0) setFirstSlideReady(true);
    if (pendingSlide.current === index) {
      setActiveSlide(index);
      pendingSlide.current = null;
    }
  }

  useEffect(() => {
    if (
      !firstSlideReady ||
      slides.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const nextSlide = (activeSlide + 1) % slides.length;
    // Give the first image time to paint before preparing one upcoming slide.
    const prepareNext = window.setTimeout(() => {
      if (document.hidden) return;
      setRequestedSlides((current) => current.includes(nextSlide) ? current : [...current, nextSlide]);
    }, 1500);
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      pendingSlide.current = nextSlide;
      if (loadedSlides.current.has(nextSlide)) {
        setActiveSlide(nextSlide);
        pendingSlide.current = null;
      } else {
        setRequestedSlides((current) => current.includes(nextSlide) ? current : [...current, nextSlide]);
      }
    }, 6000);

    return () => {
      window.clearTimeout(prepareNext);
      window.clearInterval(interval);
    };
  }, [activeSlide, firstSlideReady, slides.length]);

  return (
    <>
      {slides.map((slide, index) => requestedSlides.includes(index) && (
        <OptimizedImage
          key={`${slide.image}-${index}`}
          src={resolveHeroImage(slide.image)}
          alt={index === activeSlide ? slide.alt : ""}
          aria-hidden={index !== activeSlide}
          fill
          quality={90}
          unoptimized={isUploadedHeroImage(resolveHeroImage(slide.image))}
          sizes="100vw"
          loading="eager"
          fetchPriority={index === 0 ? "high" : "low"}
          onLoad={() => handleImageLoaded(index)}
          className={`object-cover transition-opacity duration-1000 motion-reduce:transition-none ${
            index === activeSlide ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute bottom-8 right-8 z-20 flex gap-2" aria-label="Hero images">
        {slides.map((slide, index) => (
          <button
            key={`${slide.image}-${index}`}
            type="button"
            onClick={() => showSlide(index)}
            aria-label={`Show hero image ${index + 1}`}
            aria-current={index === activeSlide ? "true" : undefined}
            className={`h-2.5 rounded-full transition-all ${
              index === activeSlide ? "w-8 bg-white" : "w-2.5 bg-white/45 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </>
  );
}
