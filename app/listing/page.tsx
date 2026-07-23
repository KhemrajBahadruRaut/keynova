"use client";
import dynamic from "next/dynamic";
import Link from "next/link";

const ListingsMap = dynamic(() => import("./ListingsMap"), { ssr: false });
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { validateNonNegativeNumber } from "@/lib/validation";

interface Property {
  id: number;
  title: string;
  address: string;
  price: string;
  building_size: string;
  units: string;
  year_built: string;
  agent_name: string;
  agent_photo: string;
  cover_image: string | null;
  // Optional fields used by the new list/map layout — supply these from
  // the API if available; the UI degrades gracefully if they're missing.
  property_type?: string; // e.g. "Retail", "Multifamily", "Mixed-Use"
  status?: string; // e.g. "Subject To Offer"
  lat?: number;
  lng?: number;
}

const API = process.env.NEXT_PUBLIC_API_BASE;
const PAGE_SIZE = 30;

export default function ListingsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const isOffMarket = pathname === "/off-market";
  const destination = isOffMarket ? "off_market" : "listing";
  const pageTitle = isOffMarket ? "Off Market" : "Property Listings";
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All Property Types");
  const [minUnits, setMinUnits] = useState("");
  const [maxUnits, setMaxUnits] = useState("");
  const [minSize, setMinSize] = useState("");
  const [maxSize, setMaxSize] = useState("");
  const [sortBy, setSortBy] = useState("date_updated");
  const [page, setPage] = useState(1);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const minUnitsError = validateNonNegativeNumber(
    minUnits,
    "Minimum units",
    true,
  );
  const maxUnitsError = validateNonNegativeNumber(
    maxUnits,
    "Maximum units",
    true,
  );
  const unitsRangeError =
    !minUnitsError &&
    !maxUnitsError &&
    minUnits !== "" &&
    maxUnits !== "" &&
    Number(minUnits) > Number(maxUnits)
      ? "Minimum units cannot exceed maximum units."
      : "";

  const minSizeError = validateNonNegativeNumber(minSize, "Minimum size");
  const maxSizeError = validateNonNegativeNumber(maxSize, "Maximum size");
  const sizeRangeError =
    !minSizeError &&
    !maxSizeError &&
    minSize !== "" &&
    maxSize !== "" &&
    Number(minSize) > Number(maxSize)
      ? "Minimum size cannot exceed maximum size."
      : "";

  const unitsError = minUnitsError || maxUnitsError || unitsRangeError;
  const sizeError = minSizeError || maxSizeError || sizeRangeError;

  useEffect(() => {
    fetch(`${API}/property/get_properties.php?destination=${destination}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") setProperties(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [destination]);

  const propertyTypes = useMemo(() => {
    const set = new Set<string>();
    properties.forEach((p) => p.property_type && set.add(p.property_type));
    return Array.from(set);
  }, [properties]);

  const filtered = useMemo(() => {
    let list = [...properties];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q),
      );
    }

    if (type !== "All Property Types") {
      list = list.filter((p) => p.property_type === type);
    }

    const toNum = (v: string) => parseFloat((v || "").replace(/[^0-9.]/g, ""));

    if (minUnits && !unitsError)
      list = list.filter((p) => toNum(p.units) >= parseFloat(minUnits));
    if (maxUnits && !unitsError)
      list = list.filter((p) => toNum(p.units) <= parseFloat(maxUnits));
    if (minSize && !sizeError)
      list = list.filter((p) => toNum(p.building_size) >= parseFloat(minSize));
    if (maxSize && !sizeError)
      list = list.filter((p) => toNum(p.building_size) <= parseFloat(maxSize));

    if (sortBy === "price_high") {
      list.sort((a, b) => toNum(b.price) - toNum(a.price));
    } else if (sortBy === "price_low") {
      list.sort((a, b) => toNum(a.price) - toNum(b.price));
    } else if (sortBy === "name") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    // "date_updated" — assume API already returns properties in that order

    return list;
  }, [
    properties,
    search,
    type,
    minUnits,
    maxUnits,
    minSize,
    maxSize,
    sortBy,
    unitsError,
    sizeError,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearch("");
    setType("All Property Types");
    setMinUnits("");
    setMaxUnits("");
    setMinSize("");
    setMaxSize("");
    setPage(1);
  };

  // Build a simple Google Maps embed URL. If we have lat/lng for the
  // hovered or first property, center on it; otherwise just show a
  // generic search of the addresses we have.
  const mapSrc = useMemo(() => {
    const focused =
      (hoveredId && pageItems.find((p) => p.id === hoveredId)) || pageItems[0];
    if (focused?.lat && focused?.lng) {
      return `https://www.google.com/maps?q=${focused.lat},${focused.lng}&z=8&output=embed`;
    }
    if (focused?.address) {
      return `https://www.google.com/maps?q=${encodeURIComponent(
        focused.address,
      )}&output=embed`;
    }
    return `https://www.google.com/maps?q=Connecticut&z=7&output=embed`;
  }, [hoveredId, pageItems]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#c8862a] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading listings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-2">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c8862a]">
              Explore Properties
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              {pageTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label htmlFor="listing-search" className="text-[11px] font-semibold text-gray-500 tracking-wide mb-1">
              SEARCH
            </label>
            <input
              id="listing-search"
              name="search"
              type="search"
              maxLength={120}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by address, city, state, or zip"
              className="w-72 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="listing-type" className="text-[11px] font-semibold text-gray-500 tracking-wide mb-1">
              TYPES
            </label>
            <select
              id="listing-type"
              name="property_type"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a] bg-white"
            >
              <option>All Property Types</option>
              {propertyTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide mb-1">
              NO. OF UNITS
            </label>
            <div className="flex items-center gap-2">
              <input
                id="minimum-units"
                name="min_units"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={minUnits}
                onChange={(e) => {
                  setMinUnits(e.target.value);
                  setPage(1);
                }}
                placeholder="Min"
                className={`w-20 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 ${
                  unitsError
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:ring-[#c8862a]"
                }`}
                aria-invalid={Boolean(unitsError)}
                aria-describedby="units-filter-error"
                aria-label="Minimum number of units"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                id="maximum-units"
                name="max_units"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={maxUnits}
                onChange={(e) => {
                  setMaxUnits(e.target.value);
                  setPage(1);
                }}
                placeholder="Max"
                className={`w-20 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 ${
                  unitsError
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:ring-[#c8862a]"
                }`}
                aria-invalid={Boolean(unitsError)}
                aria-describedby="units-filter-error"
                aria-label="Maximum number of units"
              />
            </div>
            <p id="units-filter-error" className="mt-1 max-w-44 text-xs text-red-600" aria-live="polite">
              {unitsError}
            </p>
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide mb-1">
              BUILDING SIZE
            </label>
            <div className="flex items-center gap-2">
              <input
                id="minimum-size"
                name="min_size"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={minSize}
                onChange={(e) => {
                  setMinSize(e.target.value);
                  setPage(1);
                }}
                placeholder="Min SF"
                className={`w-24 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 ${
                  sizeError
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:ring-[#c8862a]"
                }`}
                aria-invalid={Boolean(sizeError)}
                aria-describedby="size-filter-error"
                aria-label="Minimum building size"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                id="maximum-size"
                name="max_size"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={maxSize}
                onChange={(e) => {
                  setMaxSize(e.target.value);
                  setPage(1);
                }}
                placeholder="Max SF"
                className={`w-24 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 ${
                  sizeError
                    ? "border-red-500 focus:ring-red-200"
                    : "border-gray-200 focus:ring-[#c8862a]"
                }`}
                aria-invalid={Boolean(sizeError)}
                aria-describedby="size-filter-error"
                aria-label="Maximum building size"
              />
            </div>
            <p id="size-filter-error" className="mt-1 max-w-52 text-xs text-red-600" aria-live="polite">
              {sizeError}
            </p>
          </div>

          <div className="ml-auto flex gap-2">
            <button className="bg-[#c8862a] hover:bg-[#b5721f] transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg">
              ☰ More Filters
            </button>
            <button
              onClick={resetFilters}
              className="bg-[#c8862a] hover:bg-[#b5721f] transition-colors text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results header */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <p className="text-xs text-gray-500 tracking-wide">
            {filtered.length === 0
              ? "0 RESULTS"
              : `${(page - 1) * PAGE_SIZE + 1} - ${Math.min(
                  page * PAGE_SIZE,
                  filtered.length,
                )} RESULTS OUT OF ${filtered.length} LISTINGS`}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <label htmlFor="listing-sort">Sort:</label>
            <select
              id="listing-sort"
              name="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value="date_updated">Date Updated</option>
              <option value="price_high">Price: High to Low</option>
              <option value="price_low">Price: Low to High</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* List + Map */}
      <div className="flex max-w-300 w-full mx-auto flex-col lg:flex-row">
        {/* List */}
        <div className="lg:w-105 xl:w-120 shrink-0 border-r border-gray-200 bg-white overflow-y-auto max-h-[calc(100vh-150px)]">
          {pageItems.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="text-5xl mb-4">🏢</div>
              <p className="text-gray-500 text-sm">
                {isOffMarket
                  ? "No off-market properties match your filters."
                  : "No properties match your filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-px bg-gray-100">
              {pageItems.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/listing/${p.id}`)}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="bg-white cursor-pointer group relative"
                >
                  <div className="h-32 bg-gray-100 relative overflow-hidden">
                    {p.cover_image ? (
                      <img
                        src={`${API}/uploads/${p.cover_image}`}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🏢
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                      {p.status || "FOR SALE"}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {p.title}
                    </h3>
                    <p className="text-gray-500 text-xs truncate mt-0.5">
                      {p.address}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {[
                        p.property_type,
                        p.price,
                        p.building_size && `${p.building_size} SF`,
                      ]
                        .filter(Boolean)
                        .join(" - ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-7 h-7 text-xs rounded-full flex items-center justify-center transition-colors ${
                    page === n
                      ? "bg-[#c8862a] text-white font-semibold"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 min-h-100 relative">
          <ListingsMap
            properties={filtered}
            hoveredId={hoveredId}
            onMarkerClick={(id) => router.push(`/listing/${id}`)}
          />
        </div>
      </div>
    </div>
  );
}
