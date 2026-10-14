"use client";

import { Tabs, Tag, Typography } from "antd";
import {
  AdminTable,
  AdminButton,
  AdminCard,
  AdminInput,
  AdminLoading,
  AdminNotice as ToastNotice,
  AdminSelect,
  AdminTextArea,
  AdminUploadInput,
  useAdminFeedback as useFeedback,
} from "@/app/admin/dashboard/_components/AdminUI";

import FieldError from "@/components/ui/FieldError";
import { homeValuationContentValidation, validateImageUpload } from "@/lib/admin-validation";
import { useFormValidation } from "@/lib/use-form-validation";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  LoaderCircle,
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
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#1c878f] focus:ring-2 focus:ring-[#1c878f]/15 aria-invalid:border-red-500 aria-invalid:focus:border-red-500";

async function readPayload<T>(response: Response): Promise<ApiPayload<T>> {
  try {
    return (await response.json()) as ApiPayload<T>;
  } catch {
    return { status: "error", message: "The server returned an invalid response." };
  }
}

export default function HomeValuationsAdminClient() {
  const router = useRouter();
  const { confirm } = useFeedback();
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
  const [uploadError, setUploadError] = useState("");
  const validation = homeValuationContentValidation(content);
  const { errors, validateField, validateForm, resetValidation, fieldAttributes } =
    useFormValidation(validation.values, validation.validators);

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
      resetValidation();
      setUploadError("");
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
  }, [handleUnauthorized, resetValidation]);

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

  const selectTab = async (nextTab: AdminTab) => {
    if (tab === "content" && nextTab !== tab && dirty) {
      const confirmed = await confirm({
        title: "Leave the editor?",
        message: "Your changes will remain unpublished until you return and publish them.",
        confirmLabel: "Leave editor",
      });
      if (!confirmed) return;
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
    validateField(field);
    setContent((current) => ({ ...current, [field]: value }));
    setNotice("");
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const fileError = validateImageUpload(file);
    setUploadError(fileError);
    if (fileError) return;

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
    setError("");
    setNotice("");
    if (!validateForm()) return;

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
      resetValidation();
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

  const restoreDefaults = async () => {
    const confirmed = await confirm({
      title: "Restore original content?",
      message: "Your current unpublished Home Valuation content will be replaced.",
      confirmLabel: "Restore original",
    });
    if (!confirmed) return;
    setContent(cloneHomeValuationContent());
    resetValidation();
    setUploadError("");
    setError("");
    setNotice("Original content loaded. Publish to make it live.");
  };

  return (
    <section>
      <AdminCard className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
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

        <Tabs className="mt-5" activeKey={tab} onChange={(key) => { void selectTab(key as AdminTab); }} items={[{ key: "requests", label: `Requests (${requests.filter((request) => request.status === "new").length} new)` }, { key: "content", label: "Page content" }]} />
      </AdminCard>

      <ToastNotice message={error} kind="error" />
      <ToastNotice message={notice} kind="success" />

      {tab === "requests" ? (
        <AdminCard className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <AdminTable<ValuationRequest>
            dataSource={requests}
            loading={requestsLoading}
            locale={{ emptyText: "No home valuation requests yet." }}
            columns={[
              { title: "Contact", key: "contact", width: 260, render: (_, request) => <div><Typography.Text strong>{request.name}</Typography.Text><p><a href={`mailto:${request.email}`}>{request.email}</a></p><a href={`tel:${request.phone}`}>{request.phone}</a></div> },
              { title: "Property", key: "property", width: 280, render: (_, request) => <div>{request.address}, {request.zip}<p className="mt-1 text-xs text-slate-500">{request.property_type} · {request.bedrooms} bedrooms · {request.bathrooms} bathrooms</p></div> },
              { title: "Consent", key: "consent", width: 130, render: (_, request) => <Tag color={request.consent_given ? "success" : "default"}>{request.consent_given ? "Given" : "Not given"}</Tag> },
              { title: "Submitted", dataIndex: "created_at", key: "created", width: 200, render: (value: string) => new Date(value.replace(" ", "T")).toLocaleString() },
              { title: "Status", key: "status", width: 180, render: (_, request) => <AdminSelect value={request.status} disabled={updatingId === request.id} aria-label={`Status for ${request.name}`} onChange={(event) => updateStatus(request.id, event.target.value as RequestStatus)}>{STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</AdminSelect> },
            ]}
          />
        </AdminCard>
      ) : contentLoading ? (
        <AdminLoading className="mt-5">Loading valuation page content…</AdminLoading>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{dirty ? "Unpublished changes" : updatedAt ? `Last published ${new Date(updatedAt.replace(" ", "T")).toLocaleString()}` : "Using original content"}</p>
            <div className="flex flex-wrap gap-2">
              <AdminButton type="button" onClick={restoreDefaults} disabled={saving} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:opacity-50"><RotateCcw className="h-4 w-4" />Load originals</AdminButton>
              <AdminButton type="button" onClick={saveContent} disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-lg bg-[#003251] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Publishing…" : "Publish changes"}</AdminButton>
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
                <label key={field} className="text-sm font-medium text-slate-700">
                  {label}
                  <AdminInput
                    {...fieldAttributes(field, `valuation-${field}-error`)}
                    value={content[field]}
                    onChange={(event) => updateContent(field, event.target.value)}
                    maxLength={maxLength}
                    className={inputClass}
                  />
                  <FieldError id={`valuation-${field}-error`} error={errors[field]} />
                </label>
              ))}
              <label className="text-sm font-medium text-slate-700">
                Property types (one per line)
                <AdminTextArea
                  {...fieldAttributes("propertyTypes", "valuation-propertyTypes-error")}
                  value={content.propertyTypes.join("\n")}
                  onChange={(event) => updateContent("propertyTypes", event.target.value.replace(/\r/g, "").split("\n"))}
                  rows={6}
                  className={`${inputClass} resize-y`}
                />
                <FieldError id="valuation-propertyTypes-error" error={errors.propertyTypes} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Room options (one per line)
                <AdminTextArea
                  {...fieldAttributes("roomOptions", "valuation-roomOptions-error")}
                  value={content.roomOptions.join("\n")}
                  onChange={(event) => updateContent("roomOptions", event.target.value.replace(/\r/g, "").split("\n"))}
                  rows={6}
                  className={`${inputClass} resize-y`}
                />
                <FieldError id="valuation-roomOptions-error" error={errors.roomOptions} />
              </label>
              {([
                ["consentText", "Consent text", 3000],
                ["privacyText", "Privacy note", 3000],
                ["footerDisclosure", "Footer disclosure", 3000],
                ["successText", "Success message", 1000],
              ] as const).map(([field, label, maxLength]) => (
                <label key={field} className="text-sm font-medium text-slate-700 sm:col-span-2">
                  {label}
                  <AdminTextArea
                    {...fieldAttributes(field, `valuation-${field}-error`)}
                    value={content[field]}
                    onChange={(event) => updateContent(field, event.target.value)}
                    maxLength={maxLength}
                    rows={4}
                    className={`${inputClass} resize-y`}
                  />
                  <FieldError id={`valuation-${field}-error`} error={errors[field]} />
                </label>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Page image</p>
              <div className="mt-1.5 aspect-4/3 overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resolvePageImage(content.image)} alt="" className="h-full w-full object-cover" />
              </div>
              <label className="mt-3 block text-sm font-medium text-slate-700">
                Image URL or saved path
                <AdminInput
                  {...fieldAttributes("image", "valuation-image-error")}
                  value={content.image}
                  onChange={(event) => updateContent("image", event.target.value)}
                  maxLength={2048}
                  className={inputClass}
                />
                <FieldError id="valuation-image-error" error={errors.image} />
              </label>
              <AdminUploadInput
                aria-invalid={Boolean(uploadError)}
                aria-describedby="valuation-image-upload-error"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading || saving}
                onChange={uploadImage}
                className="mt-3"
                buttonLabel={uploading ? "Uploading…" : "Upload image"} loading={uploading} />
              <FieldError id="valuation-image-upload-error" error={uploadError} />
              <p className="mt-2 text-xs text-slate-500">JPG, PNG, WebP, or GIF. Maximum 4 MB. Uploads are saved as WebP.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
