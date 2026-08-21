"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Hammer,
  MapPin,
  Maximize2,
  Navigation,
} from "lucide-react";
import {
  displayBuildingSize,
  displayPrice,
  fetchListingProperties,
  fetchProperty,
  propertyUploadUrl,
  type PropertyRecord,
} from "@/lib/property-data";
import DocumentAccessModal from "./DocumentAccessModal";

interface PropertyDetailsPageProps {
  propertyId?: string;
  source?: string;
}

interface FactRow {
  label: string;
  value: string;
}

interface FactsSection {
  primary: FactRow[];
  secondary: FactRow[];
  highlights: string[];
}

function FactColumn({ rows }: { rows: FactRow[] }) {
  return (
    <div className="space-y-2 text-sm">
      {rows.map((row) => (
        <p key={row.label} className="text-gray-600">
          <span className="font-semibold text-[#003251]">{row.label}:</span>{" "}
          {row.value}
        </p>
      ))}
    </div>
  );
}

function FactsBlock({ heading, facts }: { heading: string; facts: FactsSection }) {
  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-[#003251]">{heading}</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <FactColumn rows={facts.primary} />
        <FactColumn rows={facts.secondary} />
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-[#003251]">Highlights:</span>{" "}
          {facts.highlights.join(", ")}
        </div>
      </div>
    </div>
  );
}

function sourceDetails(source?: string) {
  if (source === "exclusive") {
    return { label: "Exclusive", href: "/exclusive" };
  }
  if (source === "grandliving") {
    return { label: "Grand Living", href: "/grandliving" };
  }
  return { label: "Property Listings", href: "/listing" };
}

function formatDate(value: string) {
  if (!value) return "Not listed";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export default function PropertyDetailsPage({
  propertyId,
  source,
}: PropertyDetailsPageProps) {
  const [property, setProperty] = useState<PropertyRecord | null>(null);
  const [similarListings, setSimilarListings] = useState<PropertyRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(propertyId));
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showMoreFacts, setShowMoreFacts] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
    phone: "",
  });
  const [formStatus, setFormStatus] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [carouselStart, setCarouselStart] = useState(0);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(3);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  useEffect(() => {
    if (!propertyId) return;

    const controller = new AbortController();
    const destination = source === "exclusive" ? "off_market" : "listing";

    Promise.allSettled([
      fetchProperty(propertyId, controller.signal),
      fetchListingProperties(destination, controller.signal),
    ])
      .then(([propertyResult, listingsResult]) => {
        if (propertyResult.status === "rejected") {
          throw propertyResult.reason;
        }

        const selectedProperty = propertyResult.value;
        setProperty(selectedProperty);

        if (listingsResult.status === "fulfilled") {
          setSimilarListings(
            listingsResult.value.filter((item) => item.id !== selectedProperty?.id),
          );
        } else {
          setSimilarListings([]);
        }
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load this property.",
        );
        setProperty(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [propertyId, source]);

  const galleryImages = useMemo(() => {
    if (!property) return [];
    const files = property.images.length
      ? property.images
      : property.cover_image
        ? [property.cover_image]
        : [];
    return files.map(propertyUploadUrl).filter(Boolean);
  }, [property]);

  const visibleListings = similarListings.slice(carouselStart, carouselStart + 3);
  const mobileVisibleListings = similarListings.slice(0, mobileVisibleCount);
  const canScrollPrevious = carouselStart > 0;
  const canScrollNext = carouselStart + 3 < similarListings.length;
  const canLoadMoreListings = mobileVisibleCount < similarListings.length;
  const sourceInfo = sourceDetails(source);

  function updateField(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFormStatus("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!property) return;

    setFormSubmitting(true);
    setFormStatus("");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
      if (!apiBase) throw new Error("The inquiry service is not configured.");

      const response = await fetch(`${apiBase}/property/contact_inquiry.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          consent: true,
        }),
      });

      if (!response.ok) throw new Error("The inquiry could not be sent.");
      const payload = (await response.json()) as {
        status?: string;
        message?: string;
      };
      if (payload.status !== "success") {
        throw new Error(payload.message || "The inquiry could not be sent.");
      }

      setForm({ firstName: "", lastName: "", email: "", message: "", phone: "" });
      setAgreed(false);
      setFormStatus("Your inquiry has been sent.");
    } catch (submissionError) {
      setFormStatus(
        submissionError instanceof Error
          ? submissionError.message
          : "The inquiry could not be sent.",
      );
    } finally {
      setFormSubmitting(false);
    }
  }

  if (!propertyId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 pt-30 text-center">
        <div>
          <p className="text-gray-600">Select a property to view its details.</p>
          <Link
            href="/listing"
            className="mt-3 inline-block text-sm font-medium text-[#003251] hover:underline"
          >
            Browse property listings
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white pt-30">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#003251] border-t-transparent" />
          <p className="text-sm text-gray-500">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 pt-30 text-center">
        <div>
          <p className="text-gray-600">{error || "Property not found."}</p>
          <Link
            href={sourceInfo.href}
            className="mt-3 inline-block text-sm font-medium text-[#003251] hover:underline"
          >
            Back to {sourceInfo.label}
          </Link>
        </div>
      </div>
    );
  }

  const description = property.description || "No description has been added for this property.";
  const descriptionPreview = description.length > 430 ? description.slice(0, 430).trimEnd() : description;
  const hasMoreDescription = descriptionPreview.length < description.length;
  const mapQuery =
    property.lat !== null && property.lng !== null
      ? `${property.lat},${property.lng}`
      : property.address;
  const encodedMapQuery = encodeURIComponent(mapQuery);
  const propertyFacts: FactsSection = {
    primary: [
      { label: "Units", value: property.units || "Not listed" },
      { label: "Year built", value: property.year_built || "Not listed" },
      { label: "Property type", value: property.property_type || "Not listed" },
    ],
    secondary: [
      {
        label: "Building size",
        value: displayBuildingSize(property.building_size),
      },
      { label: "Price", value: displayPrice(property.price) },
      { label: "Address", value: property.address || "Not listed" },
    ],
    highlights: property.highlights.length
      ? property.highlights
      : ["No highlights have been added"],
  };
  const listingFacts: FactsSection = {
    primary: [
      { label: "Agent", value: property.agent_name || "Not listed" },
      { label: "Agent title", value: property.agent_title || "Not listed" },
      { label: "Agent phone", value: property.agent_phone || "Not listed" },
    ],
    secondary: [
      { label: "Agent email", value: property.agent_email || "Not listed" },
      { label: "Listed", value: formatDate(property.created_at) },
      { label: "Documents", value: String(property.documents.length) },
    ],
    highlights: [property.title || property.address || "Property listing"],
  };

  return (
    <div className="min-h-screen bg-white px-6 py-6 pt-30 md:px-10">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-4 flex items-center gap-1 text-xs text-gray-400">
          <Link href="/">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={sourceInfo.href}>{sourceInfo.label}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-gray-500">{property.title || property.address}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
              {galleryImages.length ? (
                <img
                  src={galleryImages[Math.min(activeImage, galleryImages.length - 1)]}
                  alt={property.title || property.address}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No image available
                </div>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`aspect-4/3 overflow-hidden rounded-md ring-offset-2 focus:outline-none ${
                      activeImage === index ? "ring-2 ring-[#003251]" : ""
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${property.title || "Property"} view ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <h1 className="mt-6 text-xl font-semibold text-[#003251]">
              {property.title || property.address}
            </h1>
            {property.title && property.address && (
              <p className="mt-1 text-sm text-gray-500">{property.address}</p>
            )}
            <p className="mt-2 text-2xl font-semibold text-gray-800">
              {displayPrice(property.price)}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Maximize2 className="h-4 w-4" strokeWidth={2} />
                {displayBuildingSize(property.building_size)}
              </span>
              <span className="flex items-center gap-1.5">
                <BedDouble className="h-4 w-4" strokeWidth={2} />
                {property.units || "—"} units
              </span>
              {property.bathrooms && (
                <span className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4" strokeWidth={2} />
                  {property.bathrooms}
                </span>
              )}
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1.5">
                <Hammer className="h-4 w-4" strokeWidth={2} />
                Built in {property.year_built || "—"}
              </span>
            </div>

            <div className="mt-8">
              <h2 className="mb-3 text-lg font-semibold text-[#003251]">Description</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {showFullDescription ? description : descriptionPreview}
                {!showFullDescription && hasMoreDescription ? "..." : ""}
              </p>
              {hasMoreDescription && (
                <button
                  type="button"
                  onClick={() => setShowFullDescription((visible) => !visible)}
                  className="mt-2 text-sm font-medium text-[#003251] hover:underline"
                >
                  {showFullDescription ? "Read less" : "Read more ..."}
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              {property.agent_photo ? (
                <img
                  src={propertyUploadUrl(property.agent_photo)}
                  alt={property.agent_name || "Property agent"}
                  className="h-14 w-14 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-100 text-lg font-semibold text-[#003251]">
                  {(property.agent_name || "K").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[#003251]">
                  {property.agent_name || "KeyNova Group"}
                </p>
                <p className="text-xs text-gray-500">{property.agent_title}</p>
                <p className="text-xs text-gray-500">{property.agent_phone}</p>
                {property.agent_email && (
                  <a
                    href={`mailto:${property.agent_email}`}
                    className="text-xs text-[#003251] hover:underline"
                  >
                    {property.agent_email}
                  </a>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDocumentModal(true)}
              className="mt-4 block w-full bg-[#003251] py-2.5 text-center text-sm font-medium text-white hover:bg-[#0c2f4d]"
            >
              Request Document
            </button>

            <form onSubmit={handleSubmit} className="mt-8">
              <h3 className="mb-4 text-base font-semibold text-[#003251]">Interested?</h3>

              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  className="border-b border-gray-300 pb-1.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#003251] focus:outline-none"
                />
                <input
                  required
                  type="text"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  className="border-b border-gray-300 pb-1.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#003251] focus:outline-none"
                />
              </div>

              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="mt-5 w-full border-b border-gray-300 pb-1.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#003251] focus:outline-none"
              />

              <textarea
                placeholder="Type your message here ..."
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                rows={3}
                className="mt-5 w-full resize-none border-b border-gray-300 pb-1.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#003251] focus:outline-none"
              />

              <input
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="mt-5 w-full border-b border-gray-300 pb-1.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#003251] focus:outline-none"
              />

              <label className="mt-5 flex items-start gap-2 text-xs text-gray-600">
                <input
                  required
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#003251]"
                />
                I agree to the terms &amp; conditions below
              </label>

              <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
                I agree to be contacted by KeyNova Group via call, email, and text for real
                estate services. To opt out, you can reply &quot;Stop&quot; at any time or reply
                &quot;Help&quot; for assistance. Message and data rates may apply. Message frequency
                may vary. <a href="#" className="text-[#003251] hover:underline">Privacy Policy</a>
              </p>

              {formStatus && (
                <p className="mt-3 text-xs text-gray-600" role="status">
                  {formStatus}
                </p>
              )}

              <button
                type="submit"
                disabled={!agreed || formSubmitting}
                className="mt-5 w-full rounded-md border border-[#003251] py-2.5 text-sm font-medium text-[#003251] transition-colors hover:bg-[#003251] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#003251]"
              >
                {formSubmitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="mb-4 text-lg font-semibold text-[#003251]">Location</h2>

          <div className="relative aspect-12/6 w-200 overflow-hidden  border border-gray-200 bg-[#EAEDF0]">
            <iframe
              title={`Map of ${property.address || property.title}`}
              src={`https://www.google.com/maps?q=${encodedMapQuery}&z=14&output=embed`}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="absolute left-3 top-3 w-64 rounded-md bg-white p-3 shadow-md">
              <p className="text-sm font-semibold text-[#003251]">
                {property.title || property.address}
              </p>
              <p className="mt-1 text-xs text-gray-500">{property.address}</p>
              <div className="mt-2 flex gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open in Maps"
                  className="rounded-full border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodedMapQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Get directions"
                  className="rounded-full bg-[#003251] p-1.5 text-white hover:bg-[#0c2f4d]"
                >
                  <Navigation className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {property.lat !== null && property.lng !== null && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                <MapPin className="h-8 w-8 fill-red-500 text-red-500 drop-shadow" strokeWidth={1.5} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-14">
          <h2 className="mb-5 text-lg font-semibold text-[#003251]">Facts &amp; features</h2>

          <div className="space-y-8">
            <FactsBlock heading="Property" facts={propertyFacts} />
            {showMoreFacts && <FactsBlock heading="Listing" facts={listingFacts} />}
          </div>

          <button
            type="button"
            onClick={() => setShowMoreFacts((visible) => !visible)}
            className="mt-5 flex items-center gap-1 text-sm font-medium text-[#003251] hover:underline"
          >
            {showMoreFacts ? (
              <>
                See less <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                See more <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {similarListings.length > 0 && (
          <div className="mb-10 mt-14">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#003251]">Similar Listings</h2>
            </div>

            <div className="relative hidden sm:block">
              <button
                type="button"
                disabled={!canScrollPrevious}
                onClick={() =>
                  setCarouselStart((start) => Math.max(0, start - 1))
                }
                aria-label="Previous listings"
                className="absolute -left-4 top-1/3 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-500 shadow-md hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="grid grid-cols-3 gap-6">
                {visibleListings.map((listing) => {
                  const imageUrl = propertyUploadUrl(listing.cover_image);
                  return (
                    <Link
                      key={listing.id}
                      href={`/details?id=${listing.id}&source=${source || "listing"}`}
                      className="group text-left"
                    >
                      <div className="aspect-7/5 overflow-hidden rounded-lg bg-gray-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={listing.title || listing.address}
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
                          {displayBuildingSize(listing.building_size)}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-4 w-4" strokeWidth={2} />
                          {listing.units || "—"} units
                        </span>
                        {listing.year_built && (
                          <span className="flex items-center gap-1">
                            <Hammer className="h-4 w-4" strokeWidth={2} />
                            {listing.year_built}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm font-semibold text-[#003251]">
                        {listing.title}
                      </p>
                      <p className="text-sm text-gray-600">{listing.address}</p>
                      <p className="mt-1 text-base font-semibold text-gray-800">
                        {displayPrice(listing.price)}
                      </p>
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!canScrollNext}
                onClick={() =>
                  setCarouselStart((start) =>
                    Math.min(start + 1, Math.max(0, similarListings.length - 3)),
                  )
                }
                aria-label="Next listings"
                className="absolute -right-10 top-1/3 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-500 shadow-md hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="sm:hidden">
              <div className="grid grid-cols-1 gap-6">
                {mobileVisibleListings.map((listing) => {
                  const imageUrl = propertyUploadUrl(listing.cover_image);
                  return (
                    <Link
                      key={listing.id}
                      href={`/details?id=${listing.id}&source=${source || "listing"}`}
                      className="group text-left"
                    >
                      <div className="aspect-7/5 overflow-hidden rounded-lg bg-gray-100">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={listing.title || listing.address}
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
                          {displayBuildingSize(listing.building_size)}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-4 w-4" strokeWidth={2} />
                          {listing.units || "—"} units
                        </span>
                        {listing.year_built && (
                          <span className="flex items-center gap-1">
                            <Hammer className="h-4 w-4" strokeWidth={2} />
                            {listing.year_built}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm font-semibold text-[#003251]">
                        {listing.title}
                      </p>
                      <p className="text-sm text-gray-600">{listing.address}</p>
                      <p className="mt-1 text-base font-semibold text-gray-800">
                        {displayPrice(listing.price)}
                      </p>
                    </Link>
                  );
                })}
              </div>

              {canLoadMoreListings && (
                <button
                  type="button"
                  onClick={() =>
                    setMobileVisibleCount((count) =>
                      Math.min(count + 3, similarListings.length),
                    )
                  }
                  className="mx-auto mt-6 block rounded-md border border-[#003251] px-5 py-2.5 text-sm font-medium text-[#003251] transition-colors hover:bg-[#003251] hover:text-white"
                >
                  Load more
                </button>
              )}
            </div>
          </div>
        )}

        <DocumentAccessModal
          propertyId={property.id}
          propertyTitle={property.title || property.address}
          documents={property.documents}
          open={showDocumentModal}
          onClose={() => setShowDocumentModal(false)}
        />
      </div>
    </div>
  );
}
