"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info";

type ToastInput = {
  message: string;
  title?: string;
  kind?: ToastKind;
  duration?: number;
};

type ConfirmationOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type ToastItem = Required<Pick<ToastInput, "message" | "kind">> &
  Pick<ToastInput, "title"> & { id: number };

type FeedbackContextValue = {
  notify: (input: ToastInput | string) => void;
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const DEFAULT_TITLES: Record<ToastKind, string> = {
  success: "Done",
  error: "Something went wrong",
  info: "Notice",
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationOptions | null>(null);
  const nextToastId = useRef(0);
  const timers = useRef(new Map<number, number>());
  const confirmationResolver = useRef<((confirmed: boolean) => void) | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (input: ToastInput | string) => {
      const normalized = typeof input === "string" ? { message: input } : input;
      const message = normalized.message.trim();
      if (!message) return;

      const id = ++nextToastId.current;
      const kind = normalized.kind || "info";
      setToasts((current) => [
        ...current.slice(-3),
        { id, message, title: normalized.title, kind },
      ]);

      const timer = window.setTimeout(
        () => dismissToast(id),
        Math.max(2500, normalized.duration ?? (kind === "error" ? 6500 : 4500)),
      );
      timers.current.set(id, timer);
    },
    [dismissToast],
  );

  const confirm = useCallback((options: ConfirmationOptions) => {
    confirmationResolver.current?.(false);
    setConfirmation(options);
    return new Promise<boolean>((resolve) => {
      confirmationResolver.current = resolve;
    });
  }, []);

  const settleConfirmation = useCallback((confirmed: boolean) => {
    const resolve = confirmationResolver.current;
    confirmationResolver.current = null;
    setConfirmation(null);
    resolve?.(confirmed);
  }, []);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      confirmationResolver.current?.(false);
    };
  }, []);

  useEffect(() => {
    if (!confirmation) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") settleConfirmation(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [confirmation, settleConfirmation]);

  const value = useMemo(() => ({ notify, confirm }), [confirm, notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[120] flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:w-full sm:max-w-sm"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.kind === "success"
              ? CheckCircle2
              : toast.kind === "error"
                ? AlertTriangle
                : Info;
          const colors =
            toast.kind === "success"
              ? "border-emerald-200 text-emerald-700"
              : toast.kind === "error"
                ? "border-red-200 text-red-700"
                : "border-sky-200 text-sky-700";

          return (
            <div
              key={toast.id}
              role={toast.kind === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-white px-3.5 py-3 shadow-xl shadow-slate-900/12 motion-safe:animate-[feedback-toast-in_180ms_ease-out] ${colors}`}
            >
              <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800">
                  {toast.title || DEFAULT_TITLES[toast.kind]}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-600">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="-mr-1 -mt-1 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f87a8]"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {confirmation && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) settleConfirmation(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="feedback-confirm-title"
            aria-describedby="feedback-confirm-message"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 motion-safe:animate-[feedback-dialog-in_160ms_ease-out]"
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  confirmation.tone === "danger"
                    ? "bg-red-50 text-red-600"
                    : "bg-sky-50 text-[#2f7895]"
                }`}
              >
                <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 id="feedback-confirm-title" className="text-sm font-bold text-[#003251]">
                  {confirmation.title}
                </h2>
                <p id="feedback-confirm-message" className="mt-1 text-xs leading-5 text-slate-500">
                  {confirmation.message}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => settleConfirmation(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f87a8]"
              >
                {confirmation.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => settleConfirmation(true)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  confirmation.tone === "danger"
                    ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
                    : "bg-[#003251] hover:bg-[#004b78] focus-visible:ring-[#2f87a8]"
                }`}
              >
                {confirmation.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback must be used within FeedbackProvider.");
  return context;
}

export function ToastNotice({
  message,
  kind = "error",
  title,
}: {
  message?: string | null;
  kind?: ToastKind;
  title?: string;
}) {
  const { notify } = useFeedback();
  const lastMessage = useRef("");

  useEffect(() => {
    if (!message) {
      lastMessage.current = "";
      return;
    }
    if (lastMessage.current === message) return;
    lastMessage.current = message;
    notify({ message, kind, title });
  }, [kind, message, notify, title]);

  return null;
}
