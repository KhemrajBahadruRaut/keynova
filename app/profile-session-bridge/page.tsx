"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { completePropertyAccessBridge } from "@/lib/property-access";

export default function ProfileSessionBridgePage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const returnTo = new URLSearchParams(window.location.search).get("return_to") || "";
      if (!completePropertyAccessBridge(returnTo)) {
        setError("This profile session request is invalid. Return to the Keynova website and try again.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
      {error ? (
        <div className="max-w-md border border-red-200 bg-white p-8 text-sm leading-6 text-red-700 shadow-sm">
          {error}
        </div>
      ) : (
        <div className="flex items-center gap-3 text-[#003251]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-semibold">Restoring your profile session…</span>
        </div>
      )}
    </main>
  );
}
