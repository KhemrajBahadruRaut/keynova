"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bath,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";

import {
  displayBuildingSize,
  displayPrice,
  fetchListingProperties,
  propertyUploadUrl,
  type PropertyDestination,
  type PropertyRecord,
} from "@/lib/property-data";

type CollectionVariant = "grandliving" | "exclusive";

interface ShowcaseConfig {
  buttonLabel: string;
  description: string;
  destination: PropertyDestination;
  emptyMessage: string;
  href: string;
  source: CollectionVariant;
  title: string;
}

const SHOWCASE_CONFIG: Record<CollectionVariant, ShowcaseConfig> = {
  grandliving: {
    buttonLabel: "Grand Living",
    description:
      "Explore distinguished residences that blend timeless architecture, exceptional craftsmanship, and modern luxury.",
    destination: "listing",
    emptyMessage: "New Grand Living properties are being curated.",
    href: "/grandliving",
    source: "grandliving",
    title: "Discover the Finest Homes for Grand Living",
  },
  exclusive: {
    buttonLabel: "Exclusive",
    description:
      "Discover a handpicked collection of premium homes available through our exclusive network.",
    destination: "off_market",
    emptyMessage: "New exclusive opportunities are coming soon.",
    href: "/exclusive",
    source: "exclusive",
    title: "Explore Our Most Exclusive Property",
  },
};

function PropertyCard({
  duplicate = false,
  property,
  source,
}: {
  duplicate?: boolean;
  property: PropertyRecord;
  source: CollectionVariant;
}) {
  const imageUrl = propertyUploadUrl(property.cover_image);
  const roomCount = property.bedrooms || property.units;
  const roomLabel = property.bedrooms ? "beds" : "units";

  return (
    <Link
      href={`/details?id=${property.id}&source=${source}`}
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
      className="group flex w-72.5 shrink-0 flex-col rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003251] focus-visible:ring-offset-4 sm:w-90"
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={
              duplicate
                ? ""
                : property.title || property.address || "KeyNova property"
            }
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#eef3f5] px-6 text-center text-sm text-slate-400">
            Property image coming soon
          </div>
        )}
      </div>

      <div className="mt-4 flex min-h-5 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
        {property.building_size && (
          <span className="inline-flex items-center gap-1.5">
            <Maximize2 aria-hidden="true" size={15} strokeWidth={1.75} />
            {displayBuildingSize(property.building_size)}
          </span>
        )}
        {roomCount && (
          <span className="inline-flex items-center gap-1.5">
            <BedDouble aria-hidden="true" size={15} strokeWidth={1.75} />
            {roomCount} {roomLabel}
          </span>
        )}
        {property.bathrooms && (
          <span className="inline-flex items-center gap-1.5">
            <Bath aria-hidden="true" size={15} strokeWidth={1.75} />
            {property.bathrooms} baths
          </span>
        )}
      </div>

      <h3 className="mt-3 font-semibold text-[#003251] transition-colors group-hover:text-[#1c878f]">
        {property.title || property.address || "KeyNova property"}
      </h3>
      {property.address && property.address !== property.title && (
        <p className="mt-1 text-sm text-slate-500">{property.address}</p>
      )}
      <p className="mt-1 font-semibold text-slate-900">
        {displayPrice(property.price)}
      </p>
    </Link>
  );
}

function LoadingCards() {
  return Array.from({ length: 3 }, (_, index) => (
    <div
      key={index}
      className="w-72.5 shrink-0 animate-pulse sm:w-90"
      aria-hidden="true"
    >
      <div className="aspect-4/3 rounded-xl bg-slate-200" />
      <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
      <div className="mt-3 h-5 w-4/5 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
    </div>
  ));
}

export default function PropertyShowcaseSection({
  variant,
}: {
  variant: CollectionVariant;
}) {
  const config = SHOWCASE_CONFIG[variant];
  const isExclusive = variant === "exclusive";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const autoScrollPausedRef = useRef(false);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetchListingProperties(config.destination, controller.signal)
      .then((items) => {
        setProperties(items.slice(0, 6));
        setError("");
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load properties.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [config.destination]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (
      !isExclusive ||
      loading ||
      properties.length === 0 ||
      !node ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let animationFrameId = 0;
    let previousTime: number | null = null;
    let loopPoint = 0;

    const updateLoopPoint = () => {
      const firstCard = node.children[0] as HTMLElement | undefined;
      const firstDuplicate = node.children[properties.length] as
        | HTMLElement
        | undefined;

      loopPoint =
        firstCard && firstDuplicate
          ? firstDuplicate.offsetLeft - firstCard.offsetLeft
          : 0;
    };

    const animate = (time: number) => {
      if (previousTime === null) previousTime = time;

      const elapsed = Math.min(time - previousTime, 50);
      previousTime = time;

      if (!autoScrollPausedRef.current && loopPoint > 0) {
        node.scrollLeft += elapsed * 0.035;

        if (node.scrollLeft >= loopPoint) {
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
    };
  }, [isExclusive, loading, properties.length]);

  const scrollBy = (direction: "left" | "right") => {
    const node = scrollerRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction === "left" ? -node.clientWidth * 0.9 : node.clientWidth * 0.9,
      behavior: "smooth",
    });
  };

  const carouselProperties = isExclusive
    ? Array.from({ length: 6 }, () => properties).flat()
    : properties;

  return (
    <section className="px-6 py-16 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div
          className={`flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between ${
            isExclusive ? "sm:flex-row-reverse" : ""
          }`}
        >
          <div className={isExclusive ? "sm:text-right" : ""}>
            {/* <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#c8862a]">
              {isExclusive ? "Privately presented" : "Elevated living"}
            </p> */}
            <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight text-[#003251] sm:text-4xl">
              {config.title}
            </h2>
            <p
              className={`mt-3 max-w-2xl leading-7 text-slate-500 ${
                isExclusive ? "sm:ml-auto" : ""
              }`}
            >
              {config.description}
            </p>
          </div>

          <Link
            href={config.href}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#003251] px-5 py-2.5 text-sm font-semibold text-[#003251] transition-colors hover:bg-[#003251] hover:text-white sm:self-auto"
          >
            {config.buttonLabel}
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>

        <div className="relative mt-10">
          <div
            ref={scrollerRef}
            onMouseEnter={() => {
              autoScrollPausedRef.current = true;
            }}
            onMouseLeave={() => {
              autoScrollPausedRef.current = false;
            }}
            onFocusCapture={() => {
              autoScrollPausedRef.current = true;
            }}
            onBlurCapture={() => {
              autoScrollPausedRef.current = false;
            }}
            className={`flex gap-6 overflow-x-auto pb-3 scrollbar-none [&::-webkit-scrollbar]:hidden ${
              isExclusive ? "scroll-auto" : "scroll-smooth"
            }`}
            aria-busy={loading}
            aria-label={`${config.buttonLabel} carousel`}
          >
            {loading ? (
              <LoadingCards />
            ) : properties.length > 0 ? (
              carouselProperties.map((property, propertyIndex) => (
                <PropertyCard
                  key={`${property.id}-${propertyIndex}`}
                  duplicate={isExclusive && propertyIndex >= properties.length}
                  property={property}
                  source={config.source}
                />
              ))
            ) : (
              <div className="flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                <p className="font-semibold text-[#003251]">
                  {error ? "Listings are temporarily unavailable." : config.emptyMessage}
                </p>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  {error
                    ? "Please visit the full collection or try again shortly."
                    : "Check back soon, or explore the full collection for the latest availability."}
                </p>
                <Link
                  href={config.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#003251] hover:text-[#c8862a]"
                >
                  View full collection
                  <ArrowRight aria-hidden="true" size={15} />
                </Link>
              </div>
            )}
          </div>

          {!isExclusive && !loading && properties.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollBy("left")}
                aria-label={`Show previous ${config.buttonLabel.toLowerCase()}`}
                className="absolute -left-4 top-[33%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#003251] shadow-md transition hover:bg-slate-50 sm:flex"
              >
                <ChevronLeft aria-hidden="true" size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollBy("right")}
                aria-label={`Show more ${config.buttonLabel.toLowerCase()}`}
                className="absolute -right-4 top-[33%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[#003251] shadow-md transition hover:bg-slate-50 sm:flex"
              >
                <ChevronRight aria-hidden="true" size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
