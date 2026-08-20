"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Maximize2, BedDouble, Bath } from "lucide-react";

interface Property {
  id: string;
  image: string;
  sqft: number;
  beds: number;
  baths: number;
  title: string;
  address: string;
  price: number;
}

const properties: Property[] = [
  {
    id: "ex-1",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
    sqft: 4200,
    beds: 3,
    baths: 3,
    title: "Charming 3 bedroom home",
    address: "202 Oregon Rd, Ashland, MA 01721",
    price: 678900,
  },
  {
    id: "ex-2",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    sqft: 4200,
    beds: 3,
    baths: 3,
    title: "Charming 3 bedroom home",
    address: "202 Oregon Rd, Ashland, MA 01721",
    price: 678900,
  },
  {
    id: "ex-3",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80",
    sqft: 4200,
    beds: 3,
    baths: 3,
    title: "Charming 3 bedroom home",
    address: "202 Oregon Rd, Ashland, MA 01721",
    price: 678900,
  },
  {
    id: "ex-4",
    image:
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=900&q=80",
    sqft: 4200,
    beds: 3,
    baths: 3,
    title: "Charming 3 bedroom home",
    address: "202 Oregon Rd, Ashland, MA 01721",
    price: 678900,
  },
];

const carouselProperties = [...properties, ...properties];

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const ExclusiveListingsPage: React.FC = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollPaused = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let animationFrameId = 0;
    let previousTime: number | null = null;
    let loopPoint = 0;

    const updateLoopPoint = () => {
      const firstCard = node.children[0] as HTMLElement | undefined;
      const firstDuplicate = node.children[properties.length] as HTMLElement | undefined;

      loopPoint =
        firstCard && firstDuplicate
          ? firstDuplicate.offsetLeft - firstCard.offsetLeft
          : 0;
    };

    const animate = (time: number) => {
      if (previousTime === null) previousTime = time;

      const elapsed = Math.min(time - previousTime, 50);
      previousTime = time;

      if (!isAutoScrollPaused.current) {
        node.scrollLeft += elapsed * 0.035;

        if (loopPoint > 0 && node.scrollLeft >= loopPoint) {
          node.scrollLeft -= loopPoint;
        }
      }

      animationFrameId = window.requestAnimationFrame(animate);
    };

    updateLoopPoint();
    window.addEventListener("resize", updateLoopPoint);
    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateLoopPoint);

      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const scrollNext = () => {
    const node = scrollerRef.current;
    if (!node) return;

    isAutoScrollPaused.current = true;
    node.scrollBy({ left: node.clientWidth * 0.9, behavior: "smooth" });

    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = window.setTimeout(() => {
      isAutoScrollPaused.current = false;
    }, 700);
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-[#0F3D5C] px-4 py-2 text-sm font-semibold text-[#0F3D5C] transition-colors hover:bg-[#0F3D5C] hover:text-white sm:order-2"
        >
          Exclusive Listings
          <ArrowRight size={16} />
        </Link>

        <div className="sm:order-1 sm:text-right sm:ml-auto">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-[#0F3D5C]">
            Explore Our Most Exclusive
            <br className="hidden sm:block" /> Property Listings
          </h1>
          <p className="mt-3 max-w-xl text-slate-500 sm:ml-auto">
            Discover a handpicked collection of premium homes available through our exclusive
            network.
          </p>
        </div>
      </div>

      <div className="relative mt-10">
        <div
          ref={scrollerRef}
          onPointerDown={() => {
            isAutoScrollPaused.current = true;
          }}
          onPointerUp={() => {
            isAutoScrollPaused.current = false;
          }}
          onPointerCancel={() => {
            isAutoScrollPaused.current = false;
          }}
          className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-6 overflow-x-auto pb-2 sm:auto-cols-[calc(33.333%-1rem)] scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {carouselProperties.map((property, propertyIndex) => (
            <div
              key={`${property.id}-${propertyIndex}`}
              aria-hidden={propertyIndex >= properties.length}
              className="group flex flex-col"
            >
              <div className="relative overflow-hidden rounded-xl aspect-4/3">
                <img
                  src={property.image}
                  alt={property.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Maximize2 size={15} strokeWidth={1.75} />
                  {property.sqft.toLocaleString()} sq. ft
                </span>
                <span className="inline-flex items-center gap-1">
                  <BedDouble size={15} strokeWidth={1.75} />
                  {property.beds}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bath size={15} strokeWidth={1.75} />
                  {property.baths}
                </span>
              </div>

              <p className="mt-2 font-semibold text-[#0F3D5C]">{property.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{property.address}</p>
              <p className="mt-1 font-semibold text-slate-900">{currency(property.price)}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollNext}
          aria-label="Show more listings"
          className="absolute -right-4 top-[32%] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50 sm:flex"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
};

export default ExclusiveListingsPage;
