"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  ImageUp,
  LoaderCircle,
  RotateCcw,
  Save,
} from "lucide-react";

import {
  clonePageContent,
  PAGE_ICON_OPTIONS,
  PAGE_LABELS,
  resolvePageImage,
  type PageContentKey,
  type PageContentStep,
  type ServicePageContent,
} from "@/lib/page-content";

type ApiPayload<T = unknown> = {
  status?: string;
  message?: string;
  data?: T;
};

type ContentRecord = {
  page_key: PageContentKey;
  content: ServicePageContent;
  updated_at: string;
};

const PAGE_KEYS: PageContentKey[] = ["buywithus", "listwithus"];
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

function validationMessage(content: ServicePageContent) {
  const topFields = [
    [content.eyebrow, "Sidebar heading"],
    [content.contactTitle, "Contact card title"],
    [content.contactText, "Contact card text"],
    [content.contactButtonLabel, "Contact button label"],
    [content.contactButtonHref, "Contact button link"],
  ];
  const missingTopField = topFields.find(([value]) => !value.trim());
  if (missingTopField) return `${missingTopField[1]} is required.`;
  if (!/^\/(?!\/)[A-Za-z0-9/_?=&%.-]*$/.test(content.contactButtonHref)) {
    return "Contact button link must be a site path beginning with / (for example, /contact).";
  }

  for (const step of content.steps) {
    if (!step.navLabel.trim()) return `Step ${step.id} navigation label is required.`;
    if (!step.stepLabel.trim()) return `Step ${step.id} progress label is required.`;
    if (!step.title.trim()) return `Step ${step.id} title is required.`;
    if (!step.image.trim()) return `Step ${step.id} image is required.`;
    if (!step.body.trim()) return `Step ${step.id} body is required.`;
  }
  return "";
}

export default function PageContentAdminClient() {
  const router = useRouter();
  const [pageKey, setPageKey] = useState<PageContentKey>("buywithus");
  const [content, setContent] = useState<ServicePageContent>(() =>
    clonePageContent("buywithus"),
  );
  const [baseline, setBaseline] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingStep, setUploadingStep] = useState<number | null>(null);
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

  const loadContent = useCallback(
    async (key: PageContentKey) => {
      setLoading(true);
      setError("");
      setNotice("");
      try {
        const response = await fetch(
          `/api/admin/content/get_admin_content.php?page_key=${key}`,
          { cache: "no-store" },
        );
        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        const payload = await readPayload<ContentRecord | null>(response);
        if (!response.ok || payload.status !== "success") {
          throw new Error(payload.message || "Unable to load page content.");
        }

        const nextContent = payload.data?.content || clonePageContent(key);
        setContent(nextContent);
        setBaseline(JSON.stringify(nextContent));
        setUpdatedAt(payload.data?.updated_at || "");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load page content.",
        );
      } finally {
        setLoading(false);
      }
    },
    [handleUnauthorized],
  );

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadContent(pageKey), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadContent, pageKey]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  const selectPage = (nextKey: PageContentKey) => {
    if (nextKey === pageKey) return;
    if (dirty && !window.confirm("Discard your unpublished changes?")) return;
    setPageKey(nextKey);
  };

  const updateTopField = <Key extends keyof Omit<ServicePageContent, "steps">>(
    field: Key,
    value: ServicePageContent[Key],
  ) => {
    setContent((current) => ({ ...current, [field]: value }));
    setNotice("");
  };

  const updateStep = (
    stepIndex: number,
    field: keyof Omit<PageContentStep, "id">,
    value: string,
  ) => {
    setContent((current) => ({
      ...current,
      steps: current.steps.map((step, index) =>
        index === stepIndex ? { ...step, [field]: value } : step,
      ),
    }));
    setNotice("");
  };

  const uploadImage = async (
    stepIndex: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Images must be 4 MB or smaller.");
      return;
    }

    setUploadingStep(stepIndex);
    setError("");
    setNotice("");
    const formData = new FormData();
    formData.append("page_key", pageKey);
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

      updateStep(stepIndex, "image", payload.data.image);
      setNotice("Image uploaded. Save changes to publish it on the website.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload the image.",
      );
    } finally {
      setUploadingStep(null);
    }
  };

  const saveContent = async () => {
    const invalid = validationMessage(content);
    if (invalid) {
      setError(invalid);
      setNotice("");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/content/update_content.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_key: pageKey, content }),
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload = await readPayload<ContentRecord>(response);
      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message || "Unable to publish page content.");
      }

      setContent(payload.data.content);
      setBaseline(JSON.stringify(payload.data.content));
      setUpdatedAt(payload.data.updated_at);
      setNotice(payload.message || "Page content published.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to publish page content.",
      );
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = () => {
    if (!window.confirm("Load the original page content into this editor?")) return;
    setContent(clonePageContent(pageKey));
    setError("");
    setNotice("Original content loaded. Save changes to publish it.");
  };

  return (
    <section>
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1c878f]">
              Website content
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#003251] sm:text-3xl">
              Buyer & seller guide pages
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Edit the six steps, images, sidebar title, and contact card shown
              on the public Buy With Us and List With Us pages.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${pageKey}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#1c878f] hover:text-[#003251]"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Preview page
            </Link>
            <button
              type="button"
              onClick={restoreDefaults}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#c8862a] hover:text-[#8a5716] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Load originals
            </button>
            <button
              type="button"
              onClick={saveContent}
              disabled={loading || saving || !dirty}
              className="inline-flex items-center gap-2 rounded-lg bg-[#003251] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#06466c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {saving ? "Publishing…" : "Publish changes"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-5" role="tablist">
          {PAGE_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={pageKey === key}
              onClick={() => selectPage(key)}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                pageKey === key
                  ? "bg-[#003251] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {PAGE_LABELS[key]}
            </button>
          ))}
          <div className="ml-auto self-center text-xs text-slate-500">
            {dirty
              ? "Unpublished changes"
              : updatedAt
                ? `Last published ${new Date(updatedAt.replace(" ", "T")).toLocaleString()}`
                : "Using original content"}
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="mt-5 flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <LoaderCircle className="h-7 w-7 animate-spin text-[#1c878f]" aria-label="Loading page content" />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-3 sm:p-6">
            <label className="text-sm font-medium text-slate-700">
              Sidebar heading
              <input
                value={content.eyebrow}
                onChange={(event) => updateTopField("eyebrow", event.target.value)}
                maxLength={80}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Contact card title
              <input
                value={content.contactTitle}
                onChange={(event) => updateTopField("contactTitle", event.target.value)}
                maxLength={150}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Contact card text
              <input
                value={content.contactText}
                onChange={(event) => updateTopField("contactText", event.target.value)}
                maxLength={500}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Contact button label
              <input
                value={content.contactButtonLabel}
                onChange={(event) => updateTopField("contactButtonLabel", event.target.value)}
                maxLength={80}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Contact button link
              <input
                value={content.contactButtonHref}
                onChange={(event) => updateTopField("contactButtonHref", event.target.value)}
                maxLength={255}
                placeholder="/contact"
                className={inputClass}
              />
            </label>
          </div>

          {content.steps.map((step, stepIndex) => (
            <article key={step.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#003251] text-sm font-bold text-white">
                  {step.id}
                </span>
                <div>
                  <h2 className="font-semibold text-[#003251]">{step.title || `Step ${step.id}`}</h2>
                  <p className="text-xs text-slate-500">Public guide step {step.id} of 6</p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Navigation label
                    <input
                      value={step.navLabel}
                      onChange={(event) => updateStep(stepIndex, "navLabel", event.target.value)}
                      maxLength={80}
                      className={inputClass}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Progress label
                    <input
                      value={step.stepLabel}
                      onChange={(event) => updateStep(stepIndex, "stepLabel", event.target.value)}
                      maxLength={80}
                      className={inputClass}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Step title
                    <input
                      value={step.title}
                      onChange={(event) => updateStep(stepIndex, "title", event.target.value)}
                      maxLength={180}
                      className={inputClass}
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Sidebar icon
                    <select
                      value={step.icon}
                      onChange={(event) => updateStep(stepIndex, "icon", event.target.value)}
                      className={inputClass}
                    >
                      {PAGE_ICON_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Body content
                    <textarea
                      value={step.body}
                      onChange={(event) => updateStep(stepIndex, "body", event.target.value)}
                      maxLength={30000}
                      rows={14}
                      className={`${inputClass} resize-y font-mono text-[13px] leading-6`}
                    />
                    <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-500">
                      Start a heading with <code>### </code>, a bullet with <code>- </code>, or a numbered item with <code>1. </code>. Leave a blank line between sections.
                    </span>
                  </label>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700">Step image</p>
                  <div className="mt-1.5 aspect-4/3 overflow-hidden rounded-lg bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolvePageImage(step.image)} alt="" className="h-full w-full object-cover" />
                  </div>
                  <label className="mt-3 block text-sm font-medium text-slate-700">
                    Image URL or saved path
                    <input
                      value={step.image}
                      onChange={(event) => updateStep(stepIndex, "image", event.target.value)}
                      maxLength={2048}
                      className={inputClass}
                    />
                  </label>
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#1c878f] hover:text-[#003251]">
                    {uploadingStep === stepIndex ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ImageUp className="h-4 w-4" aria-hidden="true" />
                    )}
                    {uploadingStep === stepIndex ? "Uploading…" : "Upload image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploadingStep !== null || saving}
                      onChange={(event) => uploadImage(stepIndex, event)}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-2 text-xs text-slate-500">JPG, PNG, WebP, or GIF. Maximum 4 MB.</p>
                </div>
              </div>
            </article>
          ))}

          <div className="sticky bottom-4 flex justify-end">
            <button
              type="button"
              onClick={saveContent}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded-xl bg-[#003251] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#06466c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Publishing…" : "Publish changes"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
