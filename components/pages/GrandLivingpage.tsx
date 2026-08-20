"use client";
import React, { useRef } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  BedDouble,
  Bath,
} from "lucide-react";

interface Property {
  id: string;
  image: string;
  sqft: number;
  beds: number;
  baths: number;
  address: string;
  price: number;
}

const properties: Property[] = [
  {
    id: "gl-1",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80",
    sqft: 4200,
    beds: 3,
    baths: 3,
    address: "202 Oregon Rd, Ashland, MA 01721",
    price: 678900,
  },
  {
    id: "gl-2",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    sqft: 4200,
    beds: 3,
    baths: 3,
    address: "202 Oregon Rd, Ashland, MA 01721",
    price: 678900,
  },
  {
    id: "gl-3",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80",
    sqft: 4200,
    beds: 3,
    baths: 3,
    address: "202 Oregon Rd, Ashland, MA 01721",
    price: 678900,
  },
];

const currency = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const GrandLivingPage: React.FC = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: "left" | "right") => {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = node.clientWidth * 0.9;
    node.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className=" flex">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between shrink-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-[#0F3D5C]">
              Discover the Finest Homes for
              <br className="hidden sm:block" /> Grand Living
            </h1>
            <p className="mt-3 max-w-xl text-slate-500">
              Explore distinguished residences that blend timeless architecture,
              exceptional craftsmanship, and modern luxury.
            </p>
          </div>
        </div>

        <div className="flex-1 flex items-end justify-end">
          <a
            href="/listings"
            className="inline-flex items-center gap-2 border border-[#0F3D5C] px-4 py-2 text-sm font-semibold text-[#0F3D5C] transition-colors hover:bg-[#0F3D5C] hover:text-white"
          >
            Grand Living Listings
            <ArrowRight size={16} />
          </a>
        </div>
      </div>

      <div className="relative mt-10">
        <div
          ref={scrollerRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {properties.map((property) => (
            <div key={property.id} className="w-[320px] shrink-0 sm:w-95">
              <div className="group flex flex-col">
                <div className="relative overflow-hidden rounded-xl aspect-4/3">
                  <img
                    src={property.image}
                    alt={property.address}
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

                <p className="mt-2 text-sm text-slate-500">
                  {property.address}
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {currency(property.price)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollBy("left")}
          aria-label="Scroll to previous properties"
          className="absolute -left-4 top-[38%] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50 sm:flex"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollBy("right")}
          aria-label="Scroll to next properties"
          className="absolute -right-4 top-[38%] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50 sm:flex"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
};

export default GrandLivingPage;
