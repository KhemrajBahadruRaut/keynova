"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  ChevronDown,
  ChevronRight,
  Hammer,
  Maximize2,
  Search,
  X,
} from "lucide-react";
import {
  displayBuildingSize,
  displayPrice,
  fetchListingProperties,
  numericPropertyValue,
  propertyUploadUrl,
  type PropertyRecord,
} from "@/lib/property-data";

const ListingsMap = dynamic(() => import("@/app/listing/ListingsMap"), {
  ssr: false,
});

type CollectionVariant = "grandliving" | "exclusive";

interface PropertyCollectionPageProps {
  variant: CollectionVariant;
}

interface FilterTag {
  id: string;
  label: string;
  clear: () => void;
}

const SORT_OPTIONS = [
  "Featured",
  "Price: Low to High",
  "Price: High to Low",
  "Newest",
] as const;

function rangeLabel(label: string, minimum: string, maximum: string) {
  if (minimum && maximum) return `${label}: ${minimum} - ${maximum}`;
  if (minimum) return `${label}: ${minimum}+`;
  return `${label}: up to ${maximum}`;
}

function FilterMenu({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown
          className="h-3.5 w-3.5 text-gray-400 transition-transform group-open:rotate-180"
          strokeWidth={2}
        />
      </summary>
      <div className="absolute right-0 z-30 mt-2 min-w-56 rounded-md border border-gray-200 bg-white p-3 shadow-lg">
        {children}
      </div>
    </details>
  );
}

function RangeInputs({
  label,
  minimum,
  maximum,
  onMinimumChange,
  onMaximumChange,
}: {
  label: string;
  minimum: string;
  maximum: string;
  onMinimumChange: (value: string) => void;
  onMaximumChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-600">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          inputMode="decimal"
          value={minimum}
          onChange={(event) => onMinimumChange(event.target.value)}
          placeholder="Min"
          aria-label={`Minimum ${label.toLowerCase()}`}
          className="w-24 rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-[#003251] focus:outline-none"
        />
        <span className="text-xs text-gray-400">to</span>
        <input
          type="number"
          min="0"
          inputMode="decimal"
          value={maximum}
          onChange={(event) => onMaximumChange(event.target.value)}
          placeholder="Max"
          aria-label={`Maximum ${label.toLowerCase()}`}
          className="w-24 rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-[#003251] focus:outline-none"
        />
      </div>
    </div>
  );
}

export default function PropertyCollectionPage({
  variant,
}: PropertyCollectionPageProps) {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minimumUnits, setMinimumUnits] = useState("");
  const [maximumUnits, setMaximumUnits] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [minimumArea, setMinimumArea] = useState("");
  const [maximumArea, setMaximumArea] = useState("");
  const [sortValue, setSortValue] = useState<(typeof SORT_OPTIONS)[number]>(
    "Featured",
  );
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const destination = variant === "exclusive" ? "off_market" : "listing";

    fetchListingProperties(destination, controller.signal)
      .then((items) => {
        setProperties(items);
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
  }, [variant]);

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(properties.map((property) => property.property_type).filter(Boolean)),
      ).sort(),
    [properties],
  );

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    const minUnits = numericPropertyValue(minimumUnits);
    const maxUnits = numericPropertyValue(maximumUnits);
    const minPrice = numericPropertyValue(minimumPrice);
    const maxPrice = numericPropertyValue(maximumPrice);
    const minArea = numericPropertyValue(minimumArea);
    const maxArea = numericPropertyValue(maximumArea);

    const filtered = properties.filter((property) => {
      const searchableText = [
        property.title,
        property.address,
        property.property_type,
        property.agent_name,
      ]
        .join(" ")
        .toLowerCase();
      const units = numericPropertyValue(property.units);
      const price = numericPropertyValue(property.price);
      const area = numericPropertyValue(property.building_size);

      return (
        (!query || searchableText.includes(query)) &&
        (!propertyType || property.property_type === propertyType) &&
        (!minimumUnits || units >= minUnits) &&
        (!maximumUnits || units <= maxUnits) &&
        (!minimumPrice || price >= minPrice) &&
        (!maximumPrice || price <= maxPrice) &&
        (!minimumArea || area >= minArea) &&
        (!maximumArea || area <= maxArea)
      );
    });

    if (sortValue === "Price: Low to High") {
      filtered.sort(
        (first, second) =>
          numericPropertyValue(first.price) - numericPropertyValue(second.price),
      );
    } else if (sortValue === "Price: High to Low") {
      filtered.sort(
        (first, second) =>
          numericPropertyValue(second.price) - numericPropertyValue(first.price),
      );
    } else if (sortValue === "Newest") {
      filtered.sort(
        (first, second) =>
          new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
      );
    }

    return filtered;
  }, [
    maximumArea,
    maximumPrice,
    maximumUnits,
    minimumArea,
    minimumPrice,
    minimumUnits,
    properties,
    propertyType,
    search,
    sortValue,
  ]);

  const filterTags: FilterTag[] = [
    ...(propertyType
      ? [
          {
            id: "type",
            label: propertyType,
            clear: () => setPropertyType(""),
          },
        ]
      : []),
    ...(minimumUnits || maximumUnits
      ? [
          {
            id: "units",
            label: rangeLabel("Units", minimumUnits, maximumUnits),
            clear: () => {
              setMinimumUnits("");
              setMaximumUnits("");
            },
          },
        ]
      : []),
    ...(minimumPrice || maximumPrice
      ? [
          {
            id: "price",
            label: rangeLabel("Price", minimumPrice, maximumPrice),
            clear: () => {
              setMinimumPrice("");
              setMaximumPrice("");
            },
          },
        ]
      : []),
    ...(minimumArea || maximumArea
      ? [
          {
            id: "area",
            label: rangeLabel("Sq. area", minimumArea, maximumArea),
            clear: () => {
              setMinimumArea("");
              setMaximumArea("");
            },
          },
        ]
      : []),
  ];

  const resetFilters = () => {
    setSearch("");
    setPropertyType("");
    setMinimumUnits("");
    setMaximumUnits("");
    setMinimumPrice("");
    setMaximumPrice("");
    setMinimumArea("");
    setMaximumArea("");
    setSortValue("Featured");
  };

  const detailsUrl = useCallback(
    (id: string | number) => `/details?id=${id}&source=${variant}`,
    [variant],
  );

  const handleMarkerClick = useCallback(
    (id: number) => router.push(detailsUrl(id)),
    [detailsUrl, router],
  );

  const breadcrumb = variant === "exclusive" ? "Exclusive" : "Grand Living";
  const title =
    variant === "exclusive"
      ? "Homes For Sale Exclusively by KeyNova"
      : "Luxury Homes For Sale in Massachusetts";
  const gridClass =
    variant === "exclusive"
      ? "grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2"
      : "grid grid-cols-1 gap-y-8";

  return (
    <div className="min-h-screen bg-white px-6 py-6 md:px-10 pt-25">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-2 flex items-center gap-1 text-xs text-gray-400">
          <Link href="/">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-500">{breadcrumb}</span>
        </nav>

        <h1 className="mb-5 text-2xl font-bold text-[#003251] md:text-3xl">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-55 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by address, city or zip..."
              aria-label="Search properties"
              className="w-full rounded-md border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#003251] focus:outline-none focus:ring-1 focus:ring-[#003251]"
            />
          </div>

          <FilterMenu label="Type">
            <label className="text-xs font-medium text-gray-600" htmlFor={`${variant}-type`}>
              Property type
            </label>
            <select
              id={`${variant}-type`}
              value={propertyType}
              onChange={(event) => setPropertyType(event.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-[#003251] focus:outline-none"
            >
              <option value="">All property types</option>
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FilterMenu>

          <FilterMenu label="No. of units">
            <RangeInputs
              label="Number of units"
              minimum={minimumUnits}
              maximum={maximumUnits}
              onMinimumChange={setMinimumUnits}
              onMaximumChange={setMaximumUnits}
            />
          </FilterMenu>

          <FilterMenu label="Price">
            <RangeInputs
              label="Price"
              minimum={minimumPrice}
              maximum={maximumPrice}
              onMinimumChange={setMinimumPrice}
              onMaximumChange={setMaximumPrice}
            />
          </FilterMenu>

          <FilterMenu label="Sq. Area">
            <RangeInputs
              label="Square area"
              minimum={minimumArea}
              maximum={maximumArea}
              onMinimumChange={setMinimumArea}
              onMaximumChange={setMaximumArea}
            />
          </FilterMenu>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-md bg-[#003251] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0c2f4d]"
          >
            Reset filters
          </button>
        </div>

        {filterTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filterTags.map((tag) => (
              <span
                key={tag.id}
                className="flex items-center gap-1.5 rounded-full bg-[#6E9CAE] px-3 py-1 text-xs font-medium text-white"
              >
                {tag.label}
                <button
                  type="button"
                  onClick={tag.clear}
                  aria-label={`Remove ${tag.label} filter`}
                  className="rounded-full hover:bg-white/20"
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredProperties.length > 0 ? 1 : 0} - {filteredProperties.length}{" "}
            results out of {properties.length} Listings
          </p>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Sort:</span>
              <div className="relative">
                <select
                  value={sortValue}
                  onChange={(event) =>
                    setSortValue(event.target.value as (typeof SORT_OPTIONS)[number])
                  }
                  className="appearance-none rounded-md border-none bg-transparent pr-5 font-medium text-gray-900 focus:outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Map</span>
              <button
                type="button"
                role="switch"
                aria-checked={showMap}
                onClick={() => setShowMap((visible) => !visible)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  showMap ? "bg-[#003251]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    showMap ? "translate-x-0.2" : "-translate-x-4"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div
          className={`mt-5 grid gap-8 ${
            showMap ? "md:grid-cols-[1fr_420px]" : "md:grid-cols-1"
          }`}
        >
          <div className={gridClass}>
            {loading && (
              <div className="col-span-full flex min-h-64 items-center justify-center text-sm text-gray-500">
                Loading properties...
              </div>
            )}

            {!loading && error && (
              <div className="col-span-full flex min-h-64 items-center justify-center text-center text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && filteredProperties.length === 0 && (
              <div className="col-span-full flex min-h-64 items-center justify-center text-sm text-gray-500">
                No properties match your filters.
              </div>
            )}

            {!loading &&
              !error &&
              filteredProperties.map((property) => {
                const imageUrl = propertyUploadUrl(property.cover_image);
                const detailHref = detailsUrl(property.id);

                return (
                  <Link
                    key={property.id}
                    href={detailHref}
                    className="group w-full rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003251] focus-visible:ring-offset-2"
                  >
                    <div className="aspect-4/3 overflow-hidden rounded-lg bg-gray-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={property.title || property.address}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                          No image available
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Maximize2 className="h-3.5 w-3.5" strokeWidth={2} />
                        {displayBuildingSize(property.building_size)}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-4 w-4" strokeWidth={2} />
                        {property.units || "—"} units
                      </span>
                      {property.bathrooms ? (
                        <span className="flex items-center gap-1">
                          <Bath className="h-4 w-4" strokeWidth={2} />
                          {property.bathrooms}
                        </span>
                      ) : property.year_built ? (
                        <span className="flex items-center gap-1">
                          <Hammer className="h-4 w-4" strokeWidth={2} />
                          {property.year_built}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-sm text-gray-700">
                      {property.address || property.title}
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#003251]">
                      {displayPrice(property.price)}
                    </p>
                  </Link>
                );
              })}
          </div>

          {showMap && (
            <div className="relative isolate z-0 hidden md:block">
              <div className="relative isolate z-0 aspect-5/6 w-full overflow-hidden rounded-lg border border-gray-200 bg-[#EAEFE4]">
                <ListingsMap
                  properties={filteredProperties.map((property) => ({
                    id: Number(property.id),
                    title: property.title,
                    address: property.address,
                    price: displayPrice(property.price),
                    lat: property.lat ?? undefined,
                    lng: property.lng ?? undefined,
                  }))}
                  hoveredId={null}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
