"use client";

import FieldError from "@/components/ui/FieldError";
import { heroContentValidation, validateImageUpload } from "@/lib/admin-validation";
import { useFormValidation } from "@/lib/use-form-validation";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  ImagePlus,
  ImageUp,
  LoaderCircle,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { ToastNotice, useFeedback } from "@/components/ui/FeedbackProvider";

import {
  cloneHeroContent,
  resolveHeroImage,
  type HeroContent,
  type HeroSlide,
} from "@/lib/hero-content";

type ApiPayload<T = unknown> = {
  status?: string;
  message?: string;
  data?: T;
};

type ContentRecord = {
  page_key: "homehero";
  content: HeroContent;
  updated_at: string;
};

const MAX_SLIDES = 8;
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#003251] focus:ring-2 focus:ring-[#003251]/15 aria-invalid:border-red-500 aria-invalid:focus:border-red-500";

async function readPayload<T>(response: Response): Promise<ApiPayload<T>> {
  try {
    return (await response.json()) as ApiPayload<T>;
  } catch {
    return { status: "error", message: "The server returned an invalid response." };
  }
}



export default function HeroImagesAdminClient() {
  const router = useRouter();
  const { confirm } = useFeedback();
  const [content, setContent] = useState<HeroContent>(() => cloneHeroContent());
  const [baseline, setBaseline] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});
  const validation = heroContentValidation(content);
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

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        "/api/admin/content/get_admin_content.php?page_key=homehero",
        { cache: "no-store" },
      );
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload = await readPayload<ContentRecord | null>(response);
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to load the hero images.");
      }

      const nextContent = payload.data?.content || cloneHeroContent();
      setContent(nextContent);
      resetValidation();
      setUploadErrors({});
      setBaseline(JSON.stringify(nextContent));
      setUpdatedAt(payload.data?.updated_at || "");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the hero images.",
      );
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, resetValidation]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadContent(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadContent]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  const updateSlide = (index: number, field: keyof HeroSlide, value: string) => {
    validateField(`slide.${index}.${field}`);
    setContent((current) => ({
      slides: current.slides.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [field]: value } : slide,
      ),
    }));
    setNotice("");
  };

  const uploadImage = async (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const fileError = validateImageUpload(file);
    setUploadErrors((current) => ({ ...current, [index]: fileError }));
    if (fileError) return;

    setUploadingIndex(index);
    setError("");
    setNotice("");
    const formData = new FormData();
    formData.append("page_key", "homehero");
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

      updateSlide(index, "image", payload.data.image);
      setNotice("Image uploaded. Publish changes to show it on the homepage.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload the image.",
      );
    } finally {
      setUploadingIndex(null);
    }
  };

  const addSlide = () => {
    if (content.slides.length >= MAX_SLIDES) return;
    setContent((current) => ({
      slides: [...current.slides, { image: "", alt: "", location: "" }],
    }));
    setError("");
    setNotice("New carousel item added. Complete it, then publish your changes.");
  };

  const removeSlide = async (index: number) => {
    if (content.slides.length === 1) {
      setError("The homepage hero must keep at least one image.");
      return;
    }
    const confirmed = await confirm({
      title: "Remove hero image?",
      message: `Image ${index + 1} will be removed from this draft.`,
      confirmLabel: "Remove image",
      tone: "danger",
    });
    if (!confirmed) return;
    resetValidation();
    setUploadErrors({});
    setContent((current) => ({
      slides: current.slides.filter((_, slideIndex) => slideIndex !== index),
    }));
    setError("");
    setNotice("Image removed from the draft. Publish changes to update the homepage.");
  };

  const saveContent = async () => {
    setError("");
    setNotice("");
    const fieldsValid = validateForm();
    if (content.slides.length < 1 || content.slides.length > MAX_SLIDES) {
      setError(`Add between 1 and ${MAX_SLIDES} hero images.`);
      return;
    }
    if (!fieldsValid) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/content/update_content.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_key: "homehero", content }),
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload = await readPayload<ContentRecord>(response);
      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message || "Unable to publish the hero images.");
      }

      setContent(payload.data.content);
      resetValidation();
      setBaseline(JSON.stringify(payload.data.content));
      setUpdatedAt(payload.data.updated_at);
      setNotice(payload.message || "Homepage hero published.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to publish the hero images.",
      );
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = async () => {
    const confirmed = await confirm({
      title: "Restore original images?",
      message: "Your current unpublished hero-image changes will be replaced.",
      confirmLabel: "Restore originals",
    });
    if (!confirmed) return;
    setContent(cloneHeroContent());
    resetValidation();
    setUploadErrors({});
    setError("");
    setNotice("Original hero images loaded. Publish changes to use them.");
  };

  return (
    <section>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003251]">
              Homepage content
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#003251] sm:text-3xl">
              Hero carousel images
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Upload and manage the large images that rotate behind the homepage
              search. Changes appear after you publish them.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {dirty
                ? "Unpublished changes"
                : updatedAt
                  ? `Last published ${new Date(updatedAt.replace(" ", "T")).toLocaleString()}`
                  : "Using original images"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#003251] hover:text-[#003251]"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Preview homepage
            </Link>
            <button
              type="button"
              onClick={restoreDefaults}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#003251] hover:text-[#003251] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Load originals
            </button>
            <button
              type="button"
              onClick={saveContent}
              disabled={loading || saving || !dirty}
              className="inline-flex items-center gap-2 rounded-lg bg-[#003251] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143c60] disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>

      <ToastNotice message={error} kind="error" />
      <ToastNotice message={notice} kind="success" />

      {loading ? (
        <div className="mt-5 flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <LoaderCircle className="h-7 w-7 animate-spin text-[#003251]" aria-label="Loading hero images" />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {content.slides.map((slide, index) => (
            <article
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#003251] text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h2 className="font-semibold text-[#003251]">
                      {slide.location || `Hero image ${index + 1}`}
                    </h2>
                    <p className="text-xs text-slate-500">Carousel position {index + 1}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSlide(index)}
                  disabled={content.slides.length === 1 || saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove
                </button>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
                <div>
                  <div className="aspect-video overflow-hidden rounded-xl bg-slate-100">
                    {slide.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveHeroImage(slide.image)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-5 text-center text-sm text-slate-400">
                        Upload an image to preview it here.
                      </div>
                    )}
                  </div>
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#003251] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143c60]">
                    {uploadingIndex === index ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ImageUp className="h-4 w-4" aria-hidden="true" />
                    )}
                    {uploadingIndex === index ? "Uploading…" : "Upload replacement"}
                    <input
                      aria-invalid={Boolean(uploadErrors[index])}
                      aria-describedby={`hero-${index}-upload-error`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploadingIndex !== null || saving}
                      onChange={(event) => uploadImage(index, event)}
                      className="sr-only"
                    />
                  </label>
                    <FieldError id={`hero-${index}-upload-error`} error={uploadErrors[index]} />
                  <p className="mt-2 text-xs text-slate-500">
                    Use a wide landscape image. JPG, PNG, WebP, or GIF; maximum 4 MB.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Image URL or saved path
                    <input
                      {...fieldAttributes(`slide.${index}.image`, `hero-${index}-image-error`)}
                      value={slide.image}
                      onChange={(event) => updateSlide(index, "image", event.target.value)}
                      maxLength={2048}
                      className={inputClass}
                    />
                    <FieldError id={`hero-${index}-image-error`} error={errors[`slide.${index}.image`]} />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Image description
                    <input
                      {...fieldAttributes(`slide.${index}.alt`, `hero-${index}-alt-error`)}
                      value={slide.alt}
                      onChange={(event) => updateSlide(index, "alt", event.target.value)}
                      maxLength={250}
                      placeholder="Describe what is visible in the image"
                      className={inputClass}
                    />
                    <FieldError id={`hero-${index}-alt-error`} error={errors[`slide.${index}.alt`]} />
                    <span className="mt-1.5 block text-xs font-normal text-slate-500">
                      Used by screen readers and shown if the image cannot load.
                    </span>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Location label
                    <input
                      {...fieldAttributes(`slide.${index}.location`, `hero-${index}-location-error`)}
                      value={slide.location}
                      onChange={(event) => updateSlide(index, "location", event.target.value)}
                      maxLength={120}
                      placeholder="Beacon Hill, Boston"
                      className={inputClass}
                    />
                    <FieldError id={`hero-${index}-location-error`} error={errors[`slide.${index}.location`]} />
                  </label>
                </div>
              </div>
            </article>
          ))}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={addSlide}
              disabled={content.slides.length >= MAX_SLIDES || saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#003251] px-5 py-3 text-sm font-semibold text-[#003251] transition hover:bg-[#003251] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Add carousel image
            </button>
            <button
              type="button"
              onClick={saveContent}
              disabled={saving || !dirty}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003251] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#143c60] disabled:cursor-not-allowed disabled:opacity-50"
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
