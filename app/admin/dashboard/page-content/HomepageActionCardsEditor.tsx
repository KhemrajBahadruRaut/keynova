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
import { ToastNotice, useFeedback } from "@/components/ui/FeedbackProvider";

import {
  cloneHomepageActionContent,
  HOMEPAGE_ACTION_CARD_DETAILS,
  resolveHomepageActionImage,
  type HomepageActionContent,
} from "@/lib/homepage-action-content";

type ApiPayload<T = unknown> = {
  status?: string;
  message?: string;
  data?: T;
};

type ContentRecord = {
  page_key: "homepagecards";
  content: HomepageActionContent;
  updated_at: string;
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

async function readPayload<T>(response: Response): Promise<ApiPayload<T>> {
  try {
    return (await response.json()) as ApiPayload<T>;
  } catch {
    return { status: "error", message: "The server returned an invalid response." };
  }
}

export default function HomepageActionCardsEditor() {
  const router = useRouter();
  const { confirm } = useFeedback();
  const [content, setContent] = useState<HomepageActionContent>(() =>
    cloneHomepageActionContent(),
  );
  const [baseline, setBaseline] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
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

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        "/api/admin/content/get_admin_content.php?page_key=homepagecards",
        { cache: "no-store" },
      );
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload = await readPayload<ContentRecord | null>(response);
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to load homepage card images.");
      }

      const nextContent = payload.data?.content || cloneHomepageActionContent();
      setContent(nextContent);
      setBaseline(JSON.stringify(nextContent));
      setUpdatedAt(payload.data?.updated_at || "");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load homepage card images.",
      );
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

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

  const updateImage = (index: number, image: string) => {
    setContent((current) => ({
      cards: current.cards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, image } : card,
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
    if (!file.type.startsWith("image/")) {
      setError("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Images must be 4 MB or smaller.");
      return;
    }

    setUploadingIndex(index);
    setError("");
    setNotice("");
    const formData = new FormData();
    formData.append("page_key", "homepagecards");
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

      updateImage(index, payload.data.image);
      setNotice("Image uploaded. Publish the card images to update the homepage.");
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

  const saveContent = async () => {
    if (content.cards.some((card) => !card.image.trim())) {
      setError("All four homepage cards require an image.");
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
        body: JSON.stringify({ page_key: "homepagecards", content }),
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload = await readPayload<ContentRecord>(response);
      if (!response.ok || payload.status !== "success" || !payload.data) {
        throw new Error(payload.message || "Unable to publish the card images.");
      }

      setContent(payload.data.content);
      setBaseline(JSON.stringify(payload.data.content));
      setUpdatedAt(payload.data.updated_at);
      setNotice("Homepage action-card images published.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to publish the card images.",
      );
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = async () => {
    const confirmed = await confirm({
      title: "Restore original images?",
      message: "Your current unpublished homepage card images will be replaced.",
      confirmLabel: "Restore originals",
    });
    if (!confirmed) return;
    setContent(cloneHomepageActionContent());
    setError("");
    setNotice("Original images loaded. Publish changes to use them.");
  };

  return (
    <section aria-labelledby="homepage-action-cards-heading">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003251]">
              Homepage content
            </p>
            <h2
              id="homepage-action-cards-heading"
              className="mt-2 text-2xl font-semibold text-[#003251] sm:text-3xl"
            >
              Homepage action-card images
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Change the four images shown below Testimonials for Buy With Us,
              List With Us, Home Valuation, and Contact Us.
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
              {saving ? "Publishing…" : "Publish images"}
            </button>
          </div>
        </div>
      </div>

      <ToastNotice message={error} kind="error" />
      <ToastNotice message={notice} kind="success" />

      {loading ? (
        <div className="mt-5 flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <LoaderCircle className="h-7 w-7 animate-spin text-[#003251]" aria-label="Loading homepage card images" />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {content.cards.map((card, index) => {
            const details = HOMEPAGE_ACTION_CARD_DETAILS[card.id];
            return (
              <article
                key={card.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="aspect-16/10 overflow-hidden rounded-xl bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveHomepageActionImage(card.image)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-4 font-semibold text-[#003251]">{details.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{details.description}</p>
                <label className="mt-4 block text-sm font-medium text-slate-700">
                  Image URL or saved path
                  <input
                    value={card.image}
                    onChange={(event) => updateImage(index, event.target.value)}
                    maxLength={2048}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#003251] focus:ring-2 focus:ring-[#003251]/15"
                  />
                </label>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#003251] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143c60]">
                  {uploadingIndex === index ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ImageUp className="h-4 w-4" aria-hidden="true" />
                  )}
                  {uploadingIndex === index ? "Uploading…" : "Upload replacement"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={uploadingIndex !== null || saving}
                    onChange={(event) => uploadImage(index, event)}
                    className="sr-only"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  Use a landscape image. JPG, PNG, WebP, or GIF; maximum 4 MB.
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
