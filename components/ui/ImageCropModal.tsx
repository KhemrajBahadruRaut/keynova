"use client";

import { useEffect, useRef, useState } from "react";
import { Crop, Loader2, RotateCcw, X } from "lucide-react";

type Point = { x: number; y: number };
type Size = { width: number; height: number };
type CropArea = Point & Size;
type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

type FreeCropInteraction = {
  type: "move" | "resize";
  handle?: ResizeHandle;
  pointer: Point;
  crop: CropArea;
};

interface ImageCropModalProps {
  file: File;
  aspect?: number;
  outputWidth: number;
  title: string;
  circularPreview?: boolean;
  freeCrop?: boolean;
  showFullImageAroundCrop?: boolean;
  onCancel: () => void;
  onComplete: (file: File) => void | Promise<void>;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

const FREE_CROP_HANDLES: Array<{
  handle: ResizeHandle;
  label: string;
  className: string;
}> = [
  { handle: "nw", label: "top left", className: "-left-1.5 -top-1.5 cursor-nw-resize" },
  { handle: "n", label: "top", className: "left-1/2 -top-1.5 -translate-x-1/2 cursor-n-resize" },
  { handle: "ne", label: "top right", className: "-right-1.5 -top-1.5 cursor-ne-resize" },
  { handle: "e", label: "right", className: "-right-1.5 top-1/2 -translate-y-1/2 cursor-e-resize" },
  { handle: "se", label: "bottom right", className: "-bottom-1.5 -right-1.5 cursor-se-resize" },
  { handle: "s", label: "bottom", className: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize" },
  { handle: "sw", label: "bottom left", className: "-bottom-1.5 -left-1.5 cursor-sw-resize" },
  { handle: "w", label: "left", className: "-left-1.5 top-1/2 -translate-y-1/2 cursor-w-resize" },
];

export default function ImageCropModal({
  file,
  aspect = 1,
  outputWidth,
  title,
  circularPreview = false,
  freeCrop = false,
  showFullImageAroundCrop = false,
  onCancel,
  onComplete,
}: ImageCropModalProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [naturalSize, setNaturalSize] = useState<Size>({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState<Size>({ width: 0, height: 0 });
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [freeCropArea, setFreeCropArea] = useState<CropArea | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef<{ pointer: Point; position: Point } | null>(null);
  const freeCropInteraction = useRef<FreeCropInteraction | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    const handleLoad = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
        setError("");
      } else {
        setError("The selected image could not be opened.");
      }
    };
    const handleError = () => setError("The selected image could not be opened.");
    reader.addEventListener("load", handleLoad);
    reader.addEventListener("error", handleError);
    reader.readAsDataURL(file);
    return () => {
      reader.removeEventListener("load", handleLoad);
      reader.removeEventListener("error", handleError);
      if (reader.readyState === FileReader.LOADING) reader.abort();
    };
  }, [file]);

  useEffect(() => {
    const preview = freeCrop || showFullImageAroundCrop ? stageRef.current : viewportRef.current;
    if (!preview) return;

    const updateSize = () => {
      const bounds = preview.getBoundingClientRect();

      if (freeCrop || !showFullImageAroundCrop) {
        setViewportSize({ width: bounds.width, height: bounds.height });
        return;
      }

      const availableWidth = bounds.width * 0.88;
      const availableHeight = bounds.height * 0.88;
      if (!naturalSize.width || !naturalSize.height) {
        const width = Math.min(availableWidth, availableHeight * aspect);
        setViewportSize({ width, height: width / aspect });
        return;
      }

      const containScale = Math.min(
        availableWidth / naturalSize.width,
        availableHeight / naturalSize.height,
      );
      const containedWidth = naturalSize.width * containScale;
      const containedHeight = naturalSize.height * containScale;

      if (containedWidth / containedHeight > aspect) {
        setViewportSize({
          width: containedHeight * aspect,
          height: containedHeight,
        });
      } else {
        setViewportSize({
          width: containedWidth,
          height: containedWidth / aspect,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(preview);
    return () => observer.disconnect();
  }, [aspect, freeCrop, naturalSize.height, naturalSize.width, showFullImageAroundCrop]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !processing) onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel, processing]);

  const baseScale =
    naturalSize.width > 0 && naturalSize.height > 0 && viewportSize.width > 0
      ? Math.max(
          viewportSize.width / naturalSize.width,
          viewportSize.height / naturalSize.height,
        )
      : 1;
  const scale = baseScale * zoom;
  const displayedSize = {
    width: naturalSize.width * scale,
    height: naturalSize.height * scale,
  };
  const limits = {
    x: Math.max(0, (displayedSize.width - viewportSize.width) / 2),
    y: Math.max(0, (displayedSize.height - viewportSize.height) / 2),
  };
  const effectivePosition = {
    x: clamp(position.x, -limits.x, limits.x),
    y: clamp(position.y, -limits.y, limits.y),
  };
  const freeCropScale =
    freeCrop && naturalSize.width > 0 && naturalSize.height > 0 && viewportSize.width > 0
      ? Math.min(
          (viewportSize.width * 0.9) / naturalSize.width,
          (viewportSize.height * 0.9) / naturalSize.height,
        )
      : 0;
  const freeCropImageSize = {
    width: naturalSize.width * freeCropScale,
    height: naturalSize.height * freeCropScale,
  };
  const freeCropImageOrigin = {
    x: (viewportSize.width - freeCropImageSize.width) / 2,
    y: (viewportSize.height - freeCropImageSize.height) / 2,
  };

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const size = {
      width: event.currentTarget.naturalWidth,
      height: event.currentTarget.naturalHeight,
    };
    setNaturalSize(size);
    if (freeCrop) {
      setFreeCropArea({ x: 0, y: 0, width: size.width, height: size.height });
    }
  }

  function constrained(point: Point, nextZoom = zoom) {
    const nextScale = baseScale * nextZoom;
    const maxX = Math.max(0, (naturalSize.width * nextScale - viewportSize.width) / 2);
    const maxY = Math.max(0, (naturalSize.height * nextScale - viewportSize.height) / 2);
    return {
      x: clamp(point.x, -maxX, maxX),
      y: clamp(point.y, -maxY, maxY),
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (processing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointer: { x: event.clientX, y: event.clientY },
      position,
    };
    setDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    setPosition(
      constrained({
        x: dragStart.current.position.x + event.clientX - dragStart.current.pointer.x,
        y: dragStart.current.position.y + event.clientY - dragStart.current.pointer.y,
      }),
    );
  }

  function stopDragging(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStart.current = null;
    setDragging(false);
  }

  function startFreeCropInteraction(
    event: React.PointerEvent<HTMLElement>,
    type: FreeCropInteraction["type"],
    handle?: ResizeHandle,
  ) {
    if (processing || !freeCropArea || !freeCropScale) return;
    event.preventDefault();
    event.stopPropagation();
    stageRef.current?.setPointerCapture(event.pointerId);
    freeCropInteraction.current = {
      type,
      handle,
      pointer: { x: event.clientX, y: event.clientY },
      crop: freeCropArea,
    };
    setDragging(true);
  }

  function moveFreeCropInteraction(event: React.PointerEvent<HTMLDivElement>) {
    const interaction = freeCropInteraction.current;
    if (!interaction || !freeCropScale) return;

    const deltaX = (event.clientX - interaction.pointer.x) / freeCropScale;
    const deltaY = (event.clientY - interaction.pointer.y) / freeCropScale;

    if (interaction.type === "move") {
      setFreeCropArea({
        ...interaction.crop,
        x: clamp(
          interaction.crop.x + deltaX,
          0,
          naturalSize.width - interaction.crop.width,
        ),
        y: clamp(
          interaction.crop.y + deltaY,
          0,
          naturalSize.height - interaction.crop.height,
        ),
      });
      return;
    }

    const handle = interaction.handle;
    if (!handle) return;
    const minimumWidth = Math.min(naturalSize.width, Math.max(1, 40 / freeCropScale));
    const minimumHeight = Math.min(naturalSize.height, Math.max(1, 40 / freeCropScale));
    let left = interaction.crop.x;
    let top = interaction.crop.y;
    let right = interaction.crop.x + interaction.crop.width;
    let bottom = interaction.crop.y + interaction.crop.height;

    if (handle.includes("w")) left = clamp(left + deltaX, 0, right - minimumWidth);
    if (handle.includes("e")) {
      right = clamp(right + deltaX, left + minimumWidth, naturalSize.width);
    }
    if (handle.includes("n")) top = clamp(top + deltaY, 0, bottom - minimumHeight);
    if (handle.includes("s")) {
      bottom = clamp(bottom + deltaY, top + minimumHeight, naturalSize.height);
    }

    setFreeCropArea({
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    });
  }

  function stopFreeCropInteraction(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    freeCropInteraction.current = null;
    setDragging(false);
  }

  function changeZoom(value: number) {
    setZoom(value);
    setPosition((current) => constrained(current, value));
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (processing) return;
    event.preventDefault();
    changeZoom(clamp(zoom - event.deltaY * 0.0015, 1, 3));
  }

  function resetCrop() {
    if (freeCrop) {
      setFreeCropArea(
        naturalSize.width && naturalSize.height
          ? { x: 0, y: 0, width: naturalSize.width, height: naturalSize.height }
          : null,
      );
      return;
    }
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }

  async function createCrop() {
    const image = imageRef.current;
    if (
      !image ||
      !naturalSize.width ||
      !viewportSize.width ||
      (freeCrop && !freeCropArea)
    ) {
      setError("The image is still loading. Please try again.");
      return;
    }

    setProcessing(true);
    setError("");
    try {
      const sourceWidth = freeCrop ? freeCropArea!.width : viewportSize.width / scale;
      const sourceHeight = freeCrop ? freeCropArea!.height : viewportSize.height / scale;
      const sourceX = freeCrop
        ? freeCropArea!.x
        : naturalSize.width / 2 - effectivePosition.x / scale - sourceWidth / 2;
      const sourceY = freeCrop
        ? freeCropArea!.y
        : naturalSize.height / 2 - effectivePosition.y / scale - sourceHeight / 2;
      const freeOutputScale = freeCrop
        ? Math.min(1, outputWidth / Math.max(sourceWidth, sourceHeight))
        : 1;
      const canvasWidth = freeCrop
        ? Math.max(1, Math.round(sourceWidth * freeOutputScale))
        : outputWidth;
      const canvasHeight = freeCrop
        ? Math.max(1, Math.round(sourceHeight * freeOutputScale))
        : Math.round(outputWidth / aspect);
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare the cropped image.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvasWidth,
        canvasHeight,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error("Unable to crop the image."))),
          "image/jpeg",
          0.9,
        );
      });
      const baseName = file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "image";
      await onComplete(
        new File([blob], `${baseName}-cropped.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        }),
      );
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : "Unable to crop the image.");
      setProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-slate-950/75 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-title"
    >
      <div className="my-auto w-full max-w-xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003251]/55">
              Image crop
            </p>
            <h2 id="image-crop-title" className="mt-1 text-xl font-semibold text-[#003251]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {freeCrop
                ? "Drag the crop box to move it. Pull any handle to resize it freely."
                : "Drag to reposition and use zoom to resize."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            aria-label="Close image cropper"
            className="p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div
          className={`mx-auto mt-6 ${freeCrop || showFullImageAroundCrop ? "max-w-lg" : "max-w-80 sm:max-w-100"}`}
        >
          {freeCrop ? (
            <div
              ref={stageRef}
              className="relative w-full touch-none overflow-hidden bg-slate-950 select-none"
              style={{ aspectRatio: "4 / 3" }}
              onPointerMove={moveFreeCropInteraction}
              onPointerUp={stopFreeCropInteraction}
              onPointerCancel={stopFreeCropInteraction}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Crop preview"
                  draggable={false}
                  onLoad={handleImageLoad}
                  onError={() => setError("The selected image could not be opened.")}
                  className="pointer-events-none absolute max-w-none"
                  style={{
                    left: freeCropImageOrigin.x,
                    top: freeCropImageOrigin.y,
                    width: freeCropImageSize.width || "auto",
                    height: freeCropImageSize.height || "auto",
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/70">
                  <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
                </div>
              )}
              {freeCropArea && freeCropScale > 0 && (
                <div
                  className={`absolute z-10 border-2 border-white shadow-[0_0_0_9999px_rgba(2,6,23,0.68),inset_0_0_0_1px_rgba(0,0,0,0.35)] ${
                    dragging ? "cursor-grabbing" : "cursor-move"
                  }`}
                  style={{
                    left: freeCropImageOrigin.x + freeCropArea.x * freeCropScale,
                    top: freeCropImageOrigin.y + freeCropArea.y * freeCropScale,
                    width: freeCropArea.width * freeCropScale,
                    height: freeCropArea.height * freeCropScale,
                  }}
                  onPointerDown={(event) => startFreeCropInteraction(event, "move")}
                >
                  <span className="pointer-events-none absolute inset-y-0 left-1/3 border-l border-dashed border-white/55" />
                  <span className="pointer-events-none absolute inset-y-0 left-2/3 border-l border-dashed border-white/55" />
                  <span className="pointer-events-none absolute inset-x-0 top-1/3 border-t border-dashed border-white/55" />
                  <span className="pointer-events-none absolute inset-x-0 top-2/3 border-t border-dashed border-white/55" />
                  {FREE_CROP_HANDLES.map(({ handle, label, className }) => (
                    <button
                      key={handle}
                      type="button"
                      aria-label={`Resize crop from ${label}`}
                      className={`absolute z-20 h-3 w-3 border-2 border-[#003251] bg-white shadow-sm ${className}`}
                      onPointerDown={(event) =>
                        startFreeCropInteraction(event, "resize", handle)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ) : showFullImageAroundCrop ? (
            <div
              ref={stageRef}
              className={`relative w-full touch-none overflow-hidden bg-slate-950 select-none ${
                dragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              style={{ aspectRatio: "4 / 3" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onWheel={handleWheel}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Crop preview"
                  draggable={false}
                  onLoad={handleImageLoad}
                  onError={() => setError("The selected image could not be opened.")}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                  style={{
                    width: displayedSize.width || "auto",
                    height: displayedSize.height || "auto",
                    transform: `translate(calc(-50% + ${effectivePosition.x}px), calc(-50% + ${effectivePosition.y}px))`,
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/70">
                  <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
                </div>
              )}
              {imageUrl && viewportSize.width > 0 && (
                <>
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 z-10 border-2 border-white shadow-[0_0_0_9999px_rgba(2,6,23,0.62),inset_0_0_0_1px_rgba(0,0,0,0.3)]"
                    style={{
                      width: viewportSize.width,
                      height: viewportSize.height,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                  <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 bg-slate-950/75 px-3 py-1.5 text-xs font-semibold text-white">
                    Drag the image inside the crop frame
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              ref={viewportRef}
              className={`relative w-full touch-none overflow-hidden bg-slate-900 select-none ${
                circularPreview ? "rounded-full" : ""
              } ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ aspectRatio: String(aspect) }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onWheel={handleWheel}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Crop preview"
                  draggable={false}
                  onLoad={handleImageLoad}
                  onError={() => setError("The selected image could not be opened.")}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                  style={{
                    width: displayedSize.width || "auto",
                    height: displayedSize.height || "auto",
                    transform: `translate(calc(-50% + ${effectivePosition.x}px), calc(-50% + ${effectivePosition.y}px))`,
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/70">
                  <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 border-2 border-white/80 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" />
              {imageUrl && (
                <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/65 px-3 py-1.5 text-xs font-semibold text-white">
                  Drag image to reposition
                </div>
              )}
            </div>
          )}
        </div>
         

        {error && (
          <p role="alert" className="mt-4 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={resetCrop}
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset
          </button>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className="border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createCrop}
              disabled={processing || !naturalSize.width || (freeCrop && !freeCropArea)}
              className="inline-flex items-center justify-center gap-2 bg-[#003251] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#004b78] disabled:cursor-wait disabled:opacity-60"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Crop className="h-4 w-4" aria-hidden="true" />
              )}
              {processing ? "Preparing…" : "Use cropped image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
