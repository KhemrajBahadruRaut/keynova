"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  hasValidationErrors,
  validateBuildingSize,
  validateEmail,
  validatePhone,
  validatePrice,
  validateText,
  validateUnits,
  validateYearBuilt,
} from "@/lib/validation";

interface Property {
  id: number;
  title: string;
  address: string;
  price: string;
  building_size: string;
  units: string;
  year_built: string;
  description: string;
  highlights: string;
  agent_name: string;
  agent_title: string;
  agent_phone: string;
  agent_email: string;
  created_at: string;
  show_on_listing: boolean;
  show_off_market: boolean;
}

interface DocumentRequest {
  id: number;
  property_id: number;
  property_title: string;
  name: string;
  email: string;
  requested_at: string;
  status: string;
}

interface Inquiry {
  id: number;
  property_title: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
}

type PropertyForm = {
  title: string;
  address: string;
  price: string;
  building_size: string;
  units: string;
  year_built: string;
  description: string;
  highlights: string;
  agent_name: string;
  agent_title: string;
  agent_phone: string;
  agent_email: string;
};

type PropertyFormField = keyof PropertyForm;

type PropertyMutationResponse = {
  status?: string;
  message?: string;
  id?: number | string;
};

type PropertyAttachment = {
  field: "images[]" | "documents[]" | "agent_photo";
  file: File;
  kind: "image" | "document" | "agentPhoto";
};

const INITIAL_PROPERTY_FORM: PropertyForm = {
  title: "",
  address: "",
  price: "",
  building_size: "",
  units: "",
  year_built: "",
  description: "",
  highlights: "",
  agent_name: "",
  agent_title: "",
  agent_phone: "",
  agent_email: "",
};

const PROPERTY_FORM_FIELDS = Object.keys(
  INITIAL_PROPERTY_FORM,
) as PropertyFormField[];

const EMPTY_FILE_ERRORS = { images: "", agentPhoto: "", documents: "" };
// Vercel Functions reject request bodies above 4.5 MB. Attachments are sent
// one at a time, and this leaves room for multipart fields and boundaries.
const MAX_PROXIED_FILE_SIZE = 4 * 1024 * 1024;
const MAX_IMAGE_SIZE = MAX_PROXIED_FILE_SIZE;
const MAX_DOCUMENT_SIZE = MAX_PROXIED_FILE_SIZE;
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx"];

function getPropertyFormErrors(form: PropertyForm) {
  return {
    title: validateText(form.title, "Property title", {
      required: true,
      min: 3,
      max: 120,
    }),
    address: validateText(form.address, "Address", {
      required: true,
      min: 8,
      max: 250,
    }),
    price: validatePrice(form.price),
    building_size: validateBuildingSize(form.building_size),
    units: validateUnits(form.units),
    year_built: validateYearBuilt(form.year_built),
    description: validateText(form.description, "Description", { max: 5000 }),
    highlights: validateText(form.highlights, "Highlights", { max: 3000 }),
    agent_name: validateText(form.agent_name, "Agent name", {
      min: 2,
      max: 80,
    }),
    agent_title: validateText(form.agent_title, "Agent title", { max: 100 }),
    agent_phone: validatePhone(form.agent_phone),
    agent_email: validateEmail(form.agent_email, false),
  };
}

function getFileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() || "";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validateImageFile(file: File) {
  if (!IMAGE_EXTENSIONS.includes(getFileExtension(file))) {
    return `"${file.name}" was rejected. Use a JPG, PNG, WebP, or GIF image.`;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return `"${file.name}" is ${formatFileSize(file.size)}. Images must be 4 MB or smaller.`;
  }
  return "";
}

function validateDocumentFile(file: File) {
  if (!DOCUMENT_EXTENSIONS.includes(getFileExtension(file))) {
    return `"${file.name}" was rejected. Use a PDF, DOC, or DOCX document.`;
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return `"${file.name}" is ${formatFileSize(file.size)}. Documents must be 4 MB or smaller.`;
  }
  return "";
}

function createPropertyFormData({
  form,
  showOnListing,
  showOffMarket,
  propertyId,
  lat,
  lng,
  attachment,
}: {
  form: PropertyForm;
  showOnListing: boolean;
  showOffMarket: boolean;
  propertyId?: number;
  lat: number | null;
  lng: number | null;
  attachment?: PropertyAttachment;
}) {
  const formData = new FormData();
  Object.entries(form).forEach(([key, value]) =>
    formData.append(key, value.trim()),
  );
  formData.append("show_on_listing", showOnListing ? "1" : "0");
  formData.append("show_off_market", showOffMarket ? "1" : "0");
  if (propertyId !== undefined) formData.append("id", String(propertyId));
  if (lat !== null) formData.append("lat", String(lat));
  if (lng !== null) formData.append("lng", String(lng));
  if (attachment) formData.append(attachment.field, attachment.file);
  return formData;
}

async function readPropertyMutationResponse(response: Response) {
  const responseText = await response.text();
  let data: PropertyMutationResponse = {};

  try {
    data = JSON.parse(responseText) as PropertyMutationResponse;
  } catch {
    // Vercel's payload-limit response is plain text rather than JSON.
  }

  if (response.status === 413) {
    return {
      status: "error",
      message:
        "The upload is too large for Vercel. Use files no larger than 4 MB.",
    } satisfies PropertyMutationResponse;
  }

  if (!data.message && !response.ok) {
    data.message = `The server returned an error (${response.status}).`;
  }

  return data;
}

const API = process.env.NEXT_PUBLIC_API_BASE;
const ADMIN_API = "/api/admin";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "properties" | "requests" | "inquiries"
  >("properties");
  const [properties, setProperties] = useState<Property[]>([]);
  const [docRequests, setDocRequests] = useState<DocumentRequest[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<
    { name: string; file: string }[]
  >([]);

  // Form state
  const [form, setForm] = useState<PropertyForm>(INITIAL_PROPERTY_FORM);
  const [showOnListing, setShowOnListing] = useState(true);
  const [showOffMarket, setShowOffMarket] = useState(false);
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<PropertyFormField, boolean>>
  >({});

  // Geocoding state — resolved silently in the background
  const [geocodedLat, setGeocodedLat] = useState<number | null>(null);
  const [geocodedLng, setGeocodedLng] = useState<number | null>(null);
  const [geocodeStatus, setGeocodeStatus] = useState<
    "idle" | "loading" | "ok" | "fail"
  >("idle");

  const [images, setImages] = useState<File[]>([]);
  const [agentPhoto, setAgentPhoto] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState(EMPTY_FILE_ERRORS);
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: "", text: "" });

  const formErrors = getPropertyFormErrors(form);
  const formHasErrors =
    hasValidationErrors(formErrors) ||
    hasValidationErrors(fileErrors) ||
    (!showOnListing && !showOffMarket);

  useEffect(() => {
    if (!formMsg.text) return;

    const timer = window.setTimeout(() => {
      setFormMsg({ type: "", text: "" });
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [formMsg.text, formMsg.type]);

  // ── Auto-geocode whenever address changes ─────────────────────────────────
  useEffect(() => {
    const address = form.address.trim();
    if (address.length < 8) {
      return;
    }

    const timer = setTimeout(async () => {
      setGeocodeStatus("loading");
      try {
        const url =
          "https://nominatim.openstreetmap.org/search?" +
          new URLSearchParams({
            q: address,
            format: "json",
            limit: "1",
            addressdetails: "0",
          });

        const res = await fetch(url, {
          headers: {
            "User-Agent": "PropertyListingsApp/1.0",
          },
        });
        const data = await res.json();

        if (data && data.length > 0) {
          setGeocodedLat(parseFloat(data[0].lat));
          setGeocodedLng(parseFloat(data[0].lon));
          setGeocodeStatus("ok");
        } else {
          setGeocodedLat(null);
          setGeocodedLng(null);
          setGeocodeStatus("fail");
        }
      } catch {
        setGeocodedLat(null);
        setGeocodedLng(null);
        setGeocodeStatus("fail");
      }
    }, 800); // debounce 800 ms

    return () => clearTimeout(timer);
  }, [form.address]);
  // ──────────────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [pRes, dRes, iRes] = await Promise.all([
        fetch(`${ADMIN_API}/property/get_properties.php?destination=all`, { cache: "no-store" }),
        fetch(`${ADMIN_API}/property/get_doc_requests.php`, { cache: "no-store" }),
        fetch(`${ADMIN_API}/property/get_inquiries.php`, { cache: "no-store" }),
      ]);
      if ([pRes, dRes, iRes].some((response) => response.status === 401)) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      const [pData, dData, iData] = await Promise.all([
        pRes.json(),
        dRes.json(),
        iRes.json(),
      ]);
      if (pData.status === "success") setProperties(pData.data || []);
      if (dData.status === "success") setDocRequests(dData.data || []);
      if (iData.status === "success") setInquiries(iData.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin");
    router.refresh();
  };

  const resetForm = () => {
    setForm(INITIAL_PROPERTY_FORM);
    setShowOnListing(true);
    setShowOffMarket(false);
    setTouchedFields({});
    setImages([]);
    setAgentPhoto(null);
    setDocuments([]);
    setFileErrors(EMPTY_FILE_ERRORS);
    setFormMsg({ type: "", text: "" });
    setExistingImages([]);
    setExistingDocuments([]);
    setGeocodedLat(null);
    setGeocodedLng(null);
    setGeocodeStatus("idle");
  };

  const updateFormField = (field: PropertyFormField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setTouchedFields((current) => ({ ...current, [field]: true }));
    setFormMsg({ type: "", text: "" });
    if (field === "address" && value.trim().length < 8) {
      setGeocodedLat(null);
      setGeocodedLng(null);
      setGeocodeStatus("idle");
    } else if (field === "address") {
      setGeocodeStatus("loading");
    }
  };

  const markFieldTouched = (field: PropertyFormField) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  const fieldError = (field: PropertyFormField) =>
    touchedFields[field] ? formErrors[field] : "";

  const fieldClass = (field: PropertyFormField, resize = false) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
      resize ? "resize-none " : ""
    }${
      fieldError(field)
        ? "border-red-500 focus:ring-red-200"
        : "border-gray-200 focus:ring-[#c8862a]"
    }`;

  const openCreateForm = () => {
    setEditProperty(null);
    resetForm();
    setShowForm(true);
  };

  const openEditForm = async (p: Property) => {
    setEditProperty(p);
    resetForm();
    setForm({
      title: p.title,
      address: p.address,
      price: p.price,
      building_size: p.building_size,
      units: p.units,
      year_built: p.year_built,
      description: p.description,
      highlights: p.highlights,
      agent_name: p.agent_name,
      agent_title: p.agent_title,
      agent_phone: p.agent_phone,
      agent_email: p.agent_email,
    });
    setShowOnListing(p.show_on_listing);
    setShowOffMarket(p.show_off_market);

    try {
      const res = await fetch(
        `${ADMIN_API}/property/get_property.php?id=${p.id}`,
        { cache: "no-store" },
      );
      if (res.status === 401) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      const d = await res.json();
      if (d.status === "success") {
        const item = Array.isArray(d.data) ? d.data[0] : d.data;
        setExistingImages(
          Array.isArray(item.images)
            ? item.images.filter((img: string) => img && img.trim() !== "")
            : []
        );
        setExistingDocuments(
          Array.isArray(item.documents) ? item.documents : []
        );
        setShowOnListing(Boolean(item.show_on_listing));
        setShowOffMarket(Boolean(item.show_off_market));
        // Pre-fill geocoords if already stored on the property
        if (item.lat && item.lng) {
          setGeocodedLat(parseFloat(item.lat));
          setGeocodedLng(parseFloat(item.lng));
          setGeocodeStatus("ok");
        }
      }
    } catch (err) {
      console.error("Failed to load existing images/documents", err);
    }

    setShowForm(true);
  };

  const submitPropertyForm = async (url: string, body: FormData) => {
    const response = await fetch(url, { method: "POST", body });
    if (response.status === 401) {
      router.replace("/admin");
      router.refresh();
      return null;
    }

    const data = await readPropertyMutationResponse(response);
    if (!response.ok || data.status !== "success") {
      throw new Error(data.message || "The property could not be saved.");
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formHasErrors) {
      setTouchedFields(
        Object.fromEntries(
          PROPERTY_FORM_FIELDS.map((field) => [field, true]),
        ) as Record<PropertyFormField, boolean>,
      );
      setFormMsg({
        type: "error",
        text: "Please correct the highlighted fields before saving.",
      });
      return;
    }

    setFormLoading(true);
    setFormMsg({ type: "", text: "" });

    const initialUrl = editProperty
      ? `${ADMIN_API}/property/update_property.php`
      : `${ADMIN_API}/property/create_property.php`;
    const attachments: PropertyAttachment[] = [
      ...(agentPhoto
        ? [
            {
              field: "agent_photo" as const,
              file: agentPhoto,
              kind: "agentPhoto" as const,
            },
          ]
        : []),
      ...images.map((file) => ({
        field: "images[]" as const,
        file,
        kind: "image" as const,
      })),
      ...documents.map((file) => ({
        field: "documents[]" as const,
        file,
        kind: "document" as const,
      })),
    ];
    let propertyId = editProperty?.id;
    let propertySaved = false;

    try {
      const initialResult = await submitPropertyForm(
        initialUrl,
        createPropertyFormData({
          form,
          showOnListing,
          showOffMarket,
          propertyId,
          lat: geocodedLat,
          lng: geocodedLng,
        }),
      );
      if (!initialResult) return;
      propertySaved = true;

      if (propertyId === undefined) {
        propertyId = Number(initialResult.id);
        if (!Number.isSafeInteger(propertyId) || propertyId <= 0) {
          throw new Error("The backend did not return the new property ID.");
        }
      }

      for (const attachment of attachments) {
        try {
          const attachmentResult = await submitPropertyForm(
            `${ADMIN_API}/property/update_property.php`,
            createPropertyFormData({
              form,
              showOnListing,
              showOffMarket,
              propertyId,
              lat: geocodedLat,
              lng: geocodedLng,
              attachment,
            }),
          );
          if (!attachmentResult) return;
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : "Please try again.";
          throw new Error(
            `"${attachment.file.name}" could not be uploaded. ${reason}`,
          );
        }

        if (attachment.kind === "image") {
          setImages((current) =>
            current.filter((file) => file !== attachment.file),
          );
        } else if (attachment.kind === "document") {
          setDocuments((current) =>
            current.filter((file) => file !== attachment.file),
          );
        } else {
          setAgentPhoto(null);
        }
      }

      setFormMsg({
        type: "success",
        text: editProperty ? "Property updated!" : "Property created!",
      });
      void loadData();
      setTimeout(() => {
        setShowForm(false);
      }, 1500);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Please try again.";

      if (propertySaved && propertyId !== undefined && !editProperty) {
        setEditProperty({
          id: propertyId,
          ...form,
          created_at: new Date().toISOString(),
          show_on_listing: showOnListing,
          show_off_market: showOffMarket,
        });
      }

      if (propertySaved) void loadData();
      setFormMsg({
        type: "error",
        text: propertySaved
          ? `The property was saved, but ${reason} Press Save Property to retry the remaining file(s).`
          : reason,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this property?")) return;
    const response = await fetch(`${ADMIN_API}/property/delete_property.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.status === 401) {
      router.replace("/admin");
      router.refresh();
      return;
    }
    loadData();
  };

  const handleDeleteExistingImage = async (filename: string) => {
    if (!confirm("Remove this image?")) return;
    try {
      const response = await fetch(`${ADMIN_API}/property/delete_property_image.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: editProperty?.id, filename }),
      });
      if (response.status === 401) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      setExistingImages((prev) => prev.filter((img) => img !== filename));
    } catch (err) {
      console.error("Failed to delete image", err);
    }
  };

  const handleDeleteExistingDocument = async (filename: string) => {
    if (!confirm("Remove this document?")) return;
    try {
      const response = await fetch(`${ADMIN_API}/property/delete_property_document.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: editProperty?.id, filename }),
      });
      if (response.status === 401) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      setExistingDocuments((prev) =>
        prev.filter((doc) => doc.file !== filename)
      );
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const nextImages = [...images, ...newFiles];
    const validationError = newFiles.map(validateImageFile).find(Boolean) || "";

    if (nextImages.length > 20) {
      setFileErrors((current) => ({
        ...current,
        images: `Files were rejected. You selected ${nextImages.length} images; the maximum is 20.`,
      }));
    } else if (validationError) {
      setFileErrors((current) => ({
        ...current,
        images: validationError,
      }));
    } else {
      setImages(nextImages);
      setFileErrors((current) => ({ ...current, images: "" }));
    }
    e.target.value = "";
  };

  const handleAgentPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const validationError = file ? validateImageFile(file) : "";

    if (validationError) {
      setAgentPhoto(null);
      setFileErrors((current) => ({
        ...current,
        agentPhoto: validationError,
      }));
      e.target.value = "";
      return;
    }

    setAgentPhoto(file);
    setFileErrors((current) => ({
      ...current,
      agentPhoto: "",
    }));
  };

  const handleDocuments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextDocuments = Array.from(e.target.files || []);
    const validationError =
      nextDocuments.map(validateDocumentFile).find(Boolean) || "";

    if (validationError) {
      setDocuments([]);
      setFileErrors((current) => ({
        ...current,
        documents: validationError,
      }));
      e.target.value = "";
      return;
    }

    setDocuments(nextDocuments);
    setFileErrors((current) => ({
      ...current,
      documents: "",
    }));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setFileErrors((current) => ({ ...current, images: "" }));
  };

  const tabs = [
    { key: "properties", label: "Properties", count: properties.length },
    {
      key: "requests",
      label: "Doc Requests",
      count: docRequests.filter((d) => d.status !== "verified").length,
    },
    { key: "inquiries", label: "Inquiries", count: inquiries.length },
  ] as const;

  // Geocode status badge shown below the address field
  const geocodeBadge = () => {
    if (form.address.trim().length < 8) return null;
    if (geocodeStatus === "loading")
      return (
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          Locating address…
        </p>
      );
    if (geocodeStatus === "ok")
      return (
        <p className="text-xs text-green-600 mt-1">
          ✓ Location found — pin will appear on map
        </p>
      );
    if (geocodeStatus === "fail")
      return (
        <p className="text-xs text-amber-500 mt-1">
          ⚠ Address not found on map — property will still be saved
        </p>
      );
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      {formMsg.text && (
        <div
          role={formMsg.type === "error" ? "alert" : "status"}
          aria-live={formMsg.type === "error" ? "assertive" : "polite"}
          aria-atomic="true"
          className={`fixed right-4 top-4 z-100 flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg sm:right-6 sm:top-6 ${
            formMsg.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
              formMsg.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {formMsg.type === "success" ? "\u2713" : "!"}
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium">{formMsg.text}</p>
          <button
            type="button"
            onClick={() => setFormMsg({ type: "", text: "" })}
            className="shrink-0 rounded p-0.5 text-current/70 hover:bg-black/5 hover:text-current focus:outline-none focus:ring-2 focus:ring-current/30"
            aria-label="Dismiss notification"
          >
            <span aria-hidden="true">{"\u00d7"}</span>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#c8862a] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <span className="font-semibold text-gray-900">Keynova Admin</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700 font-medium"
        >
          Logout
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Properties", value: properties.length, icon: "🏢" },
            {
              label: "Verified Doc Requests",
              value: docRequests.filter((d) => d.status === "verified").length,
              icon: "📄",
            },
            { label: "Total Inquiries", value: inquiries.length, icon: "✉️" },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4"
            >
              <div className="text-3xl">{icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === key
                    ? "border-b-2 border-[#c8862a] text-[#c8862a] bg-orange-50"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === key
                        ? "bg-[#c8862a] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Properties Tab */}
            {activeTab === "properties" && (
              <div>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-semibold text-gray-900">
                    All Properties
                  </h2>
                  <button
                    onClick={openCreateForm}
                    className="bg-[#c8862a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b5721f] transition-colors flex items-center gap-2"
                  >
                    + Add Property
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-400">
                    Loading…
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🏢</div>
                    <p className="text-gray-500">
                      No properties yet. Add your first listing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {properties.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {p.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {p.address}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-semibold text-[#c8862a]">
                              {p.price}
                            </span>
                            <span className="text-xs text-gray-400">
                              {p.building_size} · {p.units} units
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Link
                            href={`/listing/${p.id}`}
                            target="_blank"
                            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => openEditForm(p)}
                            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Doc Requests Tab */}
            {activeTab === "requests" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Document Access Requests
                </h2>
                <p className="text-xs text-gray-400 mb-5">
                  Read-only log. Visitors unlock documents themselves by
                  verifying the code sent to their email — no action needed
                  here.
                </p>
                {docRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No document requests yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-gray-100">
                          <th className="pb-3 font-medium text-gray-600">Name</th>
                          <th className="pb-3 font-medium text-gray-600">Email</th>
                          <th className="pb-3 font-medium text-gray-600">Property</th>
                          <th className="pb-3 font-medium text-gray-600">Date</th>
                          <th className="pb-3 font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {docRequests.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="py-3 font-medium text-gray-900">
                              {r.name}
                            </td>
                            <td className="py-3 text-[#c8862a]">{r.email}</td>
                            <td className="py-3 text-gray-600 max-w-32 truncate">
                              {r.property_title}
                            </td>
                            <td className="py-3 text-gray-400">
                              {new Date(r.requested_at).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  r.status === "verified"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {r.status === "verified" ? "Verified" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Inquiries Tab */}
            {activeTab === "inquiries" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-5">
                  Contact Inquiries
                </h2>
                {inquiries.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No inquiries yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="border border-gray-100 rounded-xl p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-gray-900">
                              {inq.name}
                            </span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-[#c8862a] text-sm">
                              {inq.email}
                            </span>
                            {inq.phone && (
                              <>
                                <span className="text-gray-400 mx-2">·</span>
                                <span className="text-gray-500 text-sm">
                                  {inq.phone}
                                </span>
                              </>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(inq.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#c8862a] mb-1">
                          Re: {inq.property_title}
                        </p>
                        <p className="text-sm text-gray-600">{inq.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4 flex items-start justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editProperty ? "Edit Property" : "Add New Property"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
              noValidate
            >
              <fieldset>
                <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Publish To *
                </legend>
                <p className="mt-1 text-xs text-gray-500">
                  Select one page or both pages for this property.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                      showOnListing
                        ? "border-[#c8862a] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="show_on_listing"
                      checked={showOnListing}
                      onChange={(event) => {
                        setShowOnListing(event.target.checked);
                        setFormMsg({ type: "", text: "" });
                      }}
                      className="mt-0.5 h-4 w-4 accent-[#c8862a]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        Property Listing
                      </span>
                      <span className="block text-xs text-gray-500">
                        Show on the main listings page.
                      </span>
                    </span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                      showOffMarket
                        ? "border-[#c8862a] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="show_off_market"
                      checked={showOffMarket}
                      onChange={(event) => {
                        setShowOffMarket(event.target.checked);
                        setFormMsg({ type: "", text: "" });
                      }}
                      className="mt-0.5 h-4 w-4 accent-[#c8862a]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        Off Market
                      </span>
                      <span className="block text-xs text-gray-500">
                        Show on the Off Market page.
                      </span>
                    </span>
                  </label>
                </div>
                {!showOnListing && !showOffMarket && (
                  <p className="mt-2 text-xs text-red-600" role="alert">
                    Select at least one page.
                  </p>
                )}
              </fieldset>

              {/* Property Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Property Info
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label htmlFor="property-title" className="block text-xs font-medium text-gray-600 mb-1">
                      Property Title *
                    </label>
                    <input
                      id="property-title"
                      name="title"
                      required
                      minLength={3}
                      maxLength={120}
                      className={fieldClass("title")}
                      value={form.title}
                      onChange={(e) => updateFormField("title", e.target.value)}
                      onBlur={() => markFieldTouched("title")}
                      aria-invalid={Boolean(fieldError("title"))}
                      aria-describedby="property-title-error"
                      placeholder="South End Plaza"
                    />
                    <p
                      id="property-title-error"
                      className="mt-1 min-h-4 text-xs text-red-600"
                      aria-live="polite"
                    >
                      {fieldError("title")}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="property-address" className="block text-xs font-medium text-gray-600 mb-1">
                      Address *
                    </label>
                    <input
                      id="property-address"
                      name="address"
                      required
                      minLength={8}
                      maxLength={250}
                      autoComplete="street-address"
                      className={fieldClass("address")}
                      value={form.address}
                      onChange={(e) =>
                        updateFormField("address", e.target.value)
                      }
                      onBlur={() => markFieldTouched("address")}
                      aria-invalid={Boolean(fieldError("address"))}
                      aria-describedby="property-address-error property-geocode-status"
                      placeholder="310 S Main St, Thomaston, CT 06787"
                    />

                    <p
                      id="property-address-error"
                      className="mt-1 min-h-4 text-xs text-red-600"
                      aria-live="polite"
                    >
                      {fieldError("address")}
                    </p>

                    {/* Geocode status badge */}
                    <div id="property-geocode-status" aria-live="polite">
                      {geocodeBadge()}
                    </div>

                    {/* Map preview — only shown once geocode succeeds */}
                    {geocodeStatus === "ok" &&
                      geocodedLat &&
                      geocodedLng && (
                        <div className="mt-2 rounded-lg overflow-hidden h-40 border border-gray-200">
                          <iframe
                            title="Address preview"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={`https://www.google.com/maps?q=${geocodedLat},${geocodedLng}&z=14&output=embed`}
                          />
                        </div>
                      )}
                  </div>

                  <div>
                    <label htmlFor="property-price" className="block text-xs font-medium text-gray-600 mb-1">
                      Sale Price *
                    </label>
                    <input
                      id="property-price"
                      name="price"
                      required
                      inputMode="decimal"
                      maxLength={24}
                      pattern="\$?[\d,]+(\.\d{1,2})?"
                      className={fieldClass("price")}
                      value={form.price}
                      onChange={(e) => updateFormField("price", e.target.value)}
                      onBlur={() => markFieldTouched("price")}
                      aria-invalid={Boolean(fieldError("price"))}
                      aria-describedby="property-price-error"
                      placeholder="$2,450,000"
                    />
                    <p
                      id="property-price-error"
                      className="mt-1 min-h-4 text-xs text-red-600"
                      aria-live="polite"
                    >
                      {fieldError("price")}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="property-building-size" className="block text-xs font-medium text-gray-600 mb-1">
                      Building Size
                    </label>
                    <input
                      id="property-building-size"
                      name="building_size"
                      inputMode="decimal"
                      maxLength={24}
                      className={fieldClass("building_size")}
                      value={form.building_size}
                      onChange={(e) =>
                        updateFormField("building_size", e.target.value)
                      }
                      onBlur={() => markFieldTouched("building_size")}
                      aria-invalid={Boolean(fieldError("building_size"))}
                      aria-describedby="property-building-size-error"
                      placeholder="14,614 SF"
                    />
                    <p
                      id="property-building-size-error"
                      className="mt-1 min-h-4 text-xs text-red-600"
                      aria-live="polite"
                    >
                      {fieldError("building_size")}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="property-units" className="block text-xs font-medium text-gray-600 mb-1">
                      Units
                    </label>
                    <input
                      id="property-units"
                      name="units"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      className={fieldClass("units")}
                      value={form.units}
                      onChange={(e) => updateFormField("units", e.target.value)}
                      onBlur={() => markFieldTouched("units")}
                      aria-invalid={Boolean(fieldError("units"))}
                      aria-describedby="property-units-error"
                      placeholder="17"
                    />
                    <p
                      id="property-units-error"
                      className="mt-1 min-h-4 text-xs text-red-600"
                      aria-live="polite"
                    >
                      {fieldError("units")}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="property-year-built" className="block text-xs font-medium text-gray-600 mb-1">
                      Year Built
                    </label>
                    <input
                      id="property-year-built"
                      name="year_built"
                      inputMode="numeric"
                      pattern="[0-9]{4}"
                      maxLength={4}
                      className={fieldClass("year_built")}
                      value={form.year_built}
                      onChange={(e) =>
                        updateFormField("year_built", e.target.value)
                      }
                      onBlur={() => markFieldTouched("year_built")}
                      aria-invalid={Boolean(fieldError("year_built"))}
                      aria-describedby="property-year-built-error"
                      placeholder="1971"
                    />
                    <p
                      id="property-year-built-error"
                      className="mt-1 min-h-4 text-xs text-red-600"
                      aria-live="polite"
                    >
                      {fieldError("year_built")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description & Highlights */}
              <div>
                <label htmlFor="property-description" className="block text-xs font-medium text-gray-600 mb-1">
                  Property Description
                </label>
                <textarea
                  id="property-description"
                  name="description"
                  rows={4}
                  maxLength={5000}
                  className={fieldClass("description", true)}
                  value={form.description}
                  onChange={(e) =>
                    updateFormField("description", e.target.value)
                  }
                  onBlur={() => markFieldTouched("description")}
                  aria-invalid={Boolean(fieldError("description"))}
                  aria-describedby="property-description-error"
                  placeholder="Describe the property…"
                />
                <p
                  id="property-description-error"
                  className="mt-1 min-h-4 text-xs text-red-600"
                  aria-live="polite"
                >
                  {fieldError("description")}
                </p>
              </div>
              <div>
                <label htmlFor="property-highlights" className="block text-xs font-medium text-gray-600 mb-1">
                  Highlights (one per line)
                </label>
                <textarea
                  id="property-highlights"
                  name="highlights"
                  rows={4}
                  maxLength={3000}
                  className={fieldClass("highlights", true)}
                  value={form.highlights}
                  onChange={(e) =>
                    updateFormField("highlights", e.target.value)
                  }
                  onBlur={() => markFieldTouched("highlights")}
                  aria-invalid={Boolean(fieldError("highlights"))}
                  aria-describedby="property-highlights-error"
                  placeholder={
                    "Residential Rents Below Achievable Levels\nCommercial Lease-Up and Mark-to-Market"
                  }
                />
                <p
                  id="property-highlights-error"
                  className="mt-1 min-h-4 text-xs text-red-600"
                  aria-live="polite"
                >
                  {fieldError("highlights")}
                </p>
              </div>

              {/* Agent Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Agent Info
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="agent-name" className="block text-xs font-medium text-gray-600 mb-1">
                      Agent Name
                    </label>
                    <input
                      id="agent-name"
                      name="agent_name"
                      autoComplete="name"
                      maxLength={80}
                      className={fieldClass("agent_name")}
                      value={form.agent_name}
                      onChange={(e) =>
                        updateFormField("agent_name", e.target.value)
                      }
                      onBlur={() => markFieldTouched("agent_name")}
                      aria-invalid={Boolean(fieldError("agent_name"))}
                      aria-describedby="agent-name-error"
                      placeholder="Brad Balletto"
                    />
                    <p id="agent-name-error" className="mt-1 min-h-4 text-xs text-red-600" aria-live="polite">
                      {fieldError("agent_name")}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="agent-title" className="block text-xs font-medium text-gray-600 mb-1">
                      Title
                    </label>
                    <input
                      id="agent-title"
                      name="agent_title"
                      maxLength={100}
                      className={fieldClass("agent_title")}
                      value={form.agent_title}
                      onChange={(e) =>
                        updateFormField("agent_title", e.target.value)
                      }
                      onBlur={() => markFieldTouched("agent_title")}
                      aria-invalid={Boolean(fieldError("agent_title"))}
                      aria-describedby="agent-title-error"
                      placeholder="Managing Director"
                    />
                    <p id="agent-title-error" className="mt-1 min-h-4 text-xs text-red-600" aria-live="polite">
                      {fieldError("agent_title")}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="agent-phone" className="block text-xs font-medium text-gray-600 mb-1">
                      Phone
                    </label>
                    <input
                      id="agent-phone"
                      name="agent_phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={30}
                      className={fieldClass("agent_phone")}
                      value={form.agent_phone}
                      onChange={(e) =>
                        updateFormField("agent_phone", e.target.value)
                      }
                      onBlur={() => markFieldTouched("agent_phone")}
                      aria-invalid={Boolean(fieldError("agent_phone"))}
                      aria-describedby="agent-phone-error"
                      placeholder="860.420.9775"
                    />
                    <p id="agent-phone-error" className="mt-1 min-h-4 text-xs text-red-600" aria-live="polite">
                      {fieldError("agent_phone")}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="agent-email" className="block text-xs font-medium text-gray-600 mb-1">
                      Email
                    </label>
                    <input
                      id="agent-email"
                      name="agent_email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      className={fieldClass("agent_email")}
                      value={form.agent_email}
                      onChange={(e) =>
                        updateFormField("agent_email", e.target.value)
                      }
                      onBlur={() => markFieldTouched("agent_email")}
                      aria-invalid={Boolean(fieldError("agent_email"))}
                      aria-describedby="agent-email-error"
                      placeholder="agent@firm.com"
                    />
                    <p id="agent-email-error" className="mt-1 min-h-4 text-xs text-red-600" aria-live="polite">
                      {fieldError("agent_email")}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="agent-photo" className="block text-xs font-medium text-gray-600 mb-1">
                      Agent Photo
                    </label>
                    <p id="agent-photo-help" className="mb-2 text-xs text-gray-500">
                      JPG, PNG, WebP, or GIF. Maximum file size: 4 MB.
                    </p>
                    <input
                      id="agent-photo"
                      name="agent_photo"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.gif"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-[#c8862a] hover:file:bg-orange-100"
                      onChange={handleAgentPhoto}
                      onClick={() =>
                        setFileErrors((current) => ({
                          ...current,
                          agentPhoto: "",
                        }))
                      }
                      aria-invalid={Boolean(fileErrors.agentPhoto)}
                      aria-describedby="agent-photo-help agent-photo-error"
                    />
                    <p id="agent-photo-error" className="mt-1 min-h-4 text-xs text-red-600" aria-live="polite">
                      {fileErrors.agentPhoto}
                    </p>
                    {agentPhoto && (
                      <p className="mt-1 text-xs text-green-700">
                        Selected: {agentPhoto.name} ({formatFileSize(agentPhoto.size)})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Files */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Files
                </h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="property-images" className="block text-xs font-medium text-gray-600 mb-1">
                      Property Images
                    </label>
                    <p id="property-images-help" className="mb-2 text-xs text-gray-500">
                      JPG, PNG, WebP, or GIF. Maximum 20 images and 4 MB per image.
                    </p>
                    {editProperty && existingImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {existingImages.map((img) => (
                          <div
                            key={img}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                          >
                            <img
                              src={`${API}/uploads/${img}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingImage(img)}
                              className="absolute top-0 right-0 bg-black/60 text-white text-xs w-4 h-4 flex items-center justify-center rounded-bl-md"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      id="property-images"
                      name="images"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.gif"
                      multiple
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-[#c8862a] hover:file:bg-orange-100"
                      onChange={handleAddImages}
                      onClick={() =>
                        setFileErrors((current) => ({
                          ...current,
                          images: "",
                        }))
                      }
                      aria-invalid={Boolean(fileErrors.images)}
                      aria-describedby="property-images-help property-images-error"
                    />
                    <p id="property-images-error" className="mt-1 min-h-4 text-xs text-red-600" aria-live="polite">
                      {fileErrors.images}
                    </p>
                    {images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {images.map((file, i) => (
                          <div
                            key={i}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute inset-x-0 bottom-0 bg-black/65 px-1 py-0.5 text-center text-[9px] text-white">
                              {formatFileSize(file.size)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-0 right-0 bg-black/60 text-white text-xs w-4 h-4 flex items-center justify-center rounded-bl-md"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <p className="w-full text-xs text-gray-400 mt-1">
                          {images.length} new image(s), {formatFileSize(
                            images.reduce((total, file) => total + file.size, 0),
                          )} total
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="property-documents" className="block text-xs font-medium text-gray-600 mb-1">
                      Secure Documents
                    </label>
                    <p id="property-documents-help" className="mb-2 text-xs text-gray-500">
                      PDF, DOC, or DOCX. Maximum file size: 4 MB per document.
                    </p>
                    {editProperty && existingDocuments.length > 0 && (
                      <ul className="space-y-1 mb-3">
                        {existingDocuments.map((doc) => (
                          <li
                            key={doc.file}
                            className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded-lg"
                          >
                            <span className="text-gray-700 truncate">
                              📄 {doc.name}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteExistingDocument(doc.file)
                              }
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <input
                      id="property-documents"
                      name="documents"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-[#c8862a] hover:file:bg-orange-100"
                      onChange={handleDocuments}
                      onClick={() =>
                        setFileErrors((current) => ({
                          ...current,
                          documents: "",
                        }))
                      }
                      aria-invalid={Boolean(fileErrors.documents)}
                      aria-describedby="property-documents-help property-documents-error"
                    />
                    <p id="property-documents-error" className="mt-1 min-h-4 text-xs text-red-600" aria-live="polite">
                      {fileErrors.documents}
                    </p>
                    {documents.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {documents.map((file) => (
                          <li
                            key={`${file.name}-${file.lastModified}`}
                            className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-2 py-1.5"
                          >
                            <span className="min-w-0 truncate">{file.name}</span>
                            <span className="shrink-0 text-gray-400">
                              {formatFileSize(file.size)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || formHasErrors}
                  className="flex-1 py-2.5 bg-[#c8862a] text-white rounded-lg text-sm font-medium hover:bg-[#b5721f] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {formLoading
                    ? "Saving…"
                    : editProperty
                      ? "Update Property"
                      : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
