"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  ImageUp,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
} from "lucide-react";

import {
  cloneHomeValuationContent,
  type HomeValuationContent,
} from "@/lib/home-valuation-content";
import { resolvePageImage } from "@/lib/page-content";

type AdminTab = "requests" | "content";
type RequestStatus = "new" | "contacted" | "completed" | "archived";

interface ValuationRequest {
  id: number;
  address: string;
  zip: string;
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  name: string;
  email: string;
  phone: string;
  consent_given: boolean;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

interface ContentRecord {
  page_key: "homevaluation";
  content: HomeValuationContent;
  updated_at: string;
}

type ApiPayload<T = unknown> = {
  status?: string;
  message?: string;
  data?: T;
};

const STATUS_OPTIONS: Array<{ value: RequestStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1c878f] focus:ring-2 focus:ring-[#1c878f]/15";

async function readPayload<T>(response: Response): Promise<ApiPayload<T>> {
  try {
    return (await response.json()) as ApiPayload<T>;
  } catch {
    return { status: "error", message: "The server returned an invalid response." };
  }
}

function validateContent(content: HomeValuationContent) {
  for (const [field, value] of Object.entries(content)) {
    if (Array.isArray(value)) {
      if (!value.length || value.some((item) => !item.trim())) {
        return `${field === "propertyTypes" ? "Property types" : "Room options"} cannot contain blank lines.`;
      }
    } else if (!value.trim()) {
      return "All page-content fields are required.";
    }
  }
  return "";
}

export default function HomeValuationsAdminClient() {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("requests");
  const [requests, setRequests] = useState<ValuationRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [content, setContent] = useState<HomeValuationContent>(() =>
    cloneHomeValuationContent(),
  );
  const [baseline, setBaseline] = useState("");
  const [contentLoading, setContentLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const dirty = useMemo(
    () => baseline !== "" && JSON.stringify(content) !== baseline,
    [baseline, content],
  );

  const handleUnauthorized = useCallback(() => {
    router.replace("/admin");
    router.refresh();
  }, [router]);

  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/valuation/get_requests.php", {
        cache: "no-store",
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      const payload = await readPayload<ValuationRequest[]>(response);
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to load valuation requests.");
      }
      setRequests(payload.data || []);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load valuation requests.",
      );
    } finally {
      setRequestsLoading(false);
    }
  }, [handleUnauthorized]);

  const loadContent = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/admin/content/get_admin_content.php?page_key=homevaluation",
        { cache: "no-store" },
      );
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      const payload = await readPayload<ContentRecord | null>(response);
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to load home valuation content.");
      }
      const nextContent = payload.data?.content || cloneHomeValuationContent();
      setContent(nextContent);
      setBaseline(JSON.stringify(nextContent));
      setUpdatedAt(payload.data?.updated_at || "");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load home valuation content.",
      );
    } finally {
      setContentLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      loadRequests();
      loadContent();
    }, 0);
    const refresh = window.setInterval(() => loadRequests(), 15000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refresh);
    };
  }, [loadContent, loadRequests]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  const selectTab = (nextTab: AdminTab) => {
    if (tab === "content" && nextTab !== tab && dirty) {
      if (!window.confirm("Leave the editor and keep these changes unpublished?")) return;
    }
    setTab(nextTab);
    setError("");
    setNotice("");
  };

  const updateStatus = async (requestId: number, status: RequestStatus) => {
    setUpdatingId(requestId);
    setError("");
    try {
      const response = await fetch(
        "/api/admin/valuation/update_request_status.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: requestId, status }),
        },
      );
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      const payload = await readPayload(response);
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to update request status.");
      }
      setRequests((current) =>
        current.map((request) =>
          request.id === requestId ? { ...request, status } : request,
        ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update request status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const updateContent = <Key extends keyof HomeValuationContent>(
    field: Key,
    value: HomeValuationContent[Key],
  ) => {
    setContent((current) => ({ ...current, [field]: value }));
    setNotice("");
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
      setError("Choose a JPG, PNG, WebP, or GIF image no larger than 4 MB.");
      return;
    }

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("page_key", "homevaluation");
    formData.append("image", file);
    try {
      const response = await fetch("/api/admin/content/upload_image.php", {
        method: "POST",
        body: formData,
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      const payload = await readPayload<{ image?: string }>(response);
      if (!response.ok || payload.status !== "success" || !payload.data?.image) {
        throw new Error(payload.message || "Unable to upload the image.");
      }
      updateContent("image", payload.data.image);
      setNotice("Image uploaded. Publish the page content to make it live.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Unable to upload the image.",
      );
    } finally {
      setUploading(false);
    }
  };

  const saveContent = async () => {
    const invalid = validateContent(content);
    if (invalid) {
      setError(invalid);
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/content/update_content.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_key: "homevaluation", content }),
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      const payload = await readPayload<ContentRecord>(response);
      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message || "Unable to publish home valuation content.");
      }
      setContent(payload.data.content);
      setBaseline(JSON.stringify(payload.data.content));
      setUpdatedAt(payload.data.updated_at);
      setNotice(payload.message || "Home valuation page published.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to publish home valuation content.",
      );
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = () => {
    if (!window.confirm("Load the original Home Valuation page content?")) return;
    setContent(cloneHomeValuationContent());
    setError("");
    setNotice("Original content loaded. Publish to make it live.");
  };

  return (
    <section>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1c878f]">
              Lead management
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#003251] sm:text-3xl">
              Home valuations
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review valuation requests and manage the public form content.
            </p>
          </div>
          <Link
            href="/homevaluation"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#1c878f]"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View public page
          </Link>
        </div>

        <div className="mt-5 flex gap-2 border-t border-slate-200 pt-5" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "requests"} onClick={() => selectTab("requests")} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${tab === "requests" ? "bg-[#003251] text-white" : "bg-slate-100 text-slate-600"}`}>
            Requests ({requests.filter((request) => request.status === "new").length} new)
          </button>
          <button type="button" role="tab" aria-selected={tab === "content"} onClick={() => selectTab("content")} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${tab === "content" ? "bg-[#003251] text-white" : "bg-slate-100 text-slate-600"}`}>
            Page content
          </button>
        </div>
      </div>

      {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}

      {tab === "requests" ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {requestsLoading ? (
            <div className="flex min-h-48 items-center justify-center"><LoaderCircle className="h-7 w-7 animate-spin text-[#1c878f]" aria-label="Loading valuation requests" /></div>
          ) : requests.length === 0 ? (
            <div className="py-14 text-center text-sm text-slate-500">No home valuation requests yet.</div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <article key={request.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-[#003251]">{request.name}</h2>
                        {request.status === "new" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">New</span>}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="h-4 w-4" aria-hidden="true" />{request.address}, {request.zip}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <a href={`mailto:${request.email}`} className="inline-flex items-center gap-1.5 text-[#1c878f] hover:underline"><Mail className="h-4 w-4" />{request.email}</a>
                        <a href={`tel:${request.phone}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:underline"><Phone className="h-4 w-4" />{request.phone}</a>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <time className="text-xs text-slate-400" dateTime={request.created_at}>{new Date(request.created_at.replace(" ", "T")).toLocaleString()}</time>
                      <select value={request.status} disabled={updatingId === request.id} onChange={(event) => updateStatus(request.id, event.target.value as RequestStatus)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1c878f]">
                        {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-4">
                    <div><dt className="text-xs uppercase tracking-wide text-slate-400">Property</dt><dd className="mt-1 font-medium text-slate-700">{request.property_type}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-slate-400">Bedrooms</dt><dd className="mt-1 font-medium text-slate-700">{request.bedrooms}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-slate-400">Bathrooms</dt><dd className="mt-1 font-medium text-slate-700">{request.bathrooms}</dd></div>
                    <div><dt className="text-xs uppercase tracking-wide text-slate-400">Consent</dt><dd className="mt-1 font-medium text-slate-700">{request.consent_given ? "Given" : "Not given"}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : contentLoading ? (
        <div className="mt-5 flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white"><LoaderCircle className="h-7 w-7 animate-spin text-[#1c878f]" /></div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{dirty ? "Unpublished changes" : updatedAt ? `Last published ${new Date(updatedAt.replace(" ", "T")).toLocaleString()}` : "Using original content"}</p>
            <div className="flex gap-2">
              <button type="button" onClick={restoreDefaults} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50"><RotateCcw className="h-4 w-4" />Load originals</button>
              <button type="button" onClick={saveContent} disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-lg bg-[#003251] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Publishing…" : "Publish changes"}</button>
            </div>
          </div>

          <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_300px] sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ["title", "Page title", 180],
                ["imageAlt", "Image description", 250],
                ["addressPlaceholder", "Address placeholder", 100],
                ["zipPlaceholder", "ZIP placeholder", 100],
                ["propertyTypeLabel", "Property type label", 100],
                ["propertyTypePlaceholder", "Property type placeholder", 120],
                ["bedroomsLabel", "Bedrooms label", 100],
                ["bathroomsLabel", "Bathrooms label", 100],
                ["namePlaceholder", "Name placeholder", 100],
                ["emailPlaceholder", "Email placeholder", 100],
                ["phonePlaceholder", "Phone placeholder", 100],
                ["submitButtonLabel", "Submit button label", 100],
                ["successTitle", "Success title", 180],
                ["privacyPolicyLabel", "Privacy policy label", 100],
                ["privacyPolicyHref", "Privacy policy link", 2048],
              ] as const).map(([field, label, maxLength]) => (
                <label key={field} className="text-sm font-medium text-slate-700">{label}<input value={content[field]} onChange={(event) => updateContent(field, event.target.value)} maxLength={maxLength} className={inputClass} /></label>
              ))}
              <label className="text-sm font-medium text-slate-700">Property types (one per line)<textarea value={content.propertyTypes.join("\n")} onChange={(event) => updateContent("propertyTypes", event.target.value.replace(/\r/g, "").split("\n"))} rows={6} className={`${inputClass} resize-y`} /></label>
              <label className="text-sm font-medium text-slate-700">Room options (one per line)<textarea value={content.roomOptions.join("\n")} onChange={(event) => updateContent("roomOptions", event.target.value.replace(/\r/g, "").split("\n"))} rows={6} className={`${inputClass} resize-y`} /></label>
              {([
                ["consentText", "Consent text", 3000],
                ["privacyText", "Privacy note", 3000],
                ["footerDisclosure", "Footer disclosure", 3000],
                ["successText", "Success message", 1000],
              ] as const).map(([field, label, maxLength]) => (
                <label key={field} className="text-sm font-medium text-slate-700 sm:col-span-2">{label}<textarea value={content[field]} onChange={(event) => updateContent(field, event.target.value)} maxLength={maxLength} rows={4} className={`${inputClass} resize-y`} /></label>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Page image</p>
              <div className="mt-1.5 aspect-4/3 overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolvePageImage(content.image)} alt="" className="h-full w-full object-cover" />
              </div>
              <label className="mt-3 block text-sm font-medium text-slate-700">Image URL or saved path<input value={content.image} onChange={(event) => updateContent("image", event.target.value)} maxLength={2048} className={inputClass} /></label>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"><ImageUp className="h-4 w-4" />{uploading ? "Uploading…" : "Upload image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading || saving} onChange={uploadImage} className="sr-only" /></label>
              <p className="mt-2 text-xs text-slate-500">JPG, PNG, WebP, or GIF. Maximum 4 MB.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
