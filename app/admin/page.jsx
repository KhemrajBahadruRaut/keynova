"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LockKeyhole } from "lucide-react";
import {
  hasValidationErrors,
  validateEmail,
  validatePassword,
} from "@/lib/validation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  const validationErrors = {
    email: validateEmail(email),
    password: validatePassword(password),
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", {
      cache: "no-store",
      signal: controller.signal,
    }).then((response) => {
      if (response.ok) router.replace("/admin/dashboard/properties");
    }).catch(() => {});

    return () => controller.abort();
  }, [router]);

  const updateField = (field, value) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    setTouched((current) => ({ ...current, [field]: true }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (hasValidationErrors(validationErrors)) {
      setTouched({ email: true, password: true });
      setError("Please correct the highlighted fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();

      if (response.ok && data.status === "success") {
        router.replace("/admin/dashboard/properties");
        router.refresh();
      } else {
        setError(data.message || "Invalid email or password.");
      }
    } catch {
      setError("Authentication service is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071d31] px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full border border-[#c8862a]/20" />
      <div className="pointer-events-none absolute -bottom-40 -right-28 h-112 w-md rounded-full bg-[#6E9CAE]/10 blur-3xl" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/30"
        noValidate
      >
        <div className="border-b-4 border-[#c8862a] bg-[#003251] px-8 py-7 text-center">
          <Image
            src="/logo/logofooter.png"
            width={282}
            height={282}
            alt="KeyNova Group"
            priority
            className="mx-auto h-24 w-24 object-contain"
          />
          <div className="mt-3 flex items-center justify-center gap-2 text-white/75">
            <LockKeyhole className="h-4 w-4 text-[#d89a42]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              Administration Portal
            </span>
          </div>
        </div>

        <div className="p-8">
          <h1 className="text-center text-2xl font-bold text-[#003251]">
            Welcome back
          </h1>
          <p className="mb-6 mt-2 text-center text-sm text-slate-500">
            Sign in to manage KeyNova properties and inquiries.
          </p>

          {error && (
            <p
              className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-center text-sm text-red-600"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="mb-4">
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#003251]"
            >
              Admin Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@keynovagrp.com"
              className={`w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                touched.email && validationErrors.email
                  ? "border-red-500 focus:ring-red-200"
                  : "border-slate-200 focus:border-[#6E9CAE] focus:ring-[#6E9CAE]/25"
              }`}
              value={email}
              onChange={(event) => updateField("email", event.target.value)}
              onBlur={() =>
                setTouched((current) => ({ ...current, email: true }))
              }
              aria-invalid={Boolean(touched.email && validationErrors.email)}
              aria-describedby="admin-email-error"
              maxLength={254}
              required
            />
            <p
              id="admin-email-error"
              className="mt-1 min-h-4 text-xs text-red-600"
              aria-live="polite"
            >
              {touched.email ? validationErrors.email : ""}
            </p>
          </div>

          <div className="mb-5">
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#003251]"
            >
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className={`w-full rounded-lg border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:bg-white focus:ring-2 ${
                touched.password && validationErrors.password
                  ? "border-red-500 focus:ring-red-200"
                  : "border-slate-200 focus:border-[#6E9CAE] focus:ring-[#6E9CAE]/25"
              }`}
              value={password}
              onChange={(event) => updateField("password", event.target.value)}
              onBlur={() =>
                setTouched((current) => ({ ...current, password: true }))
              }
              aria-invalid={Boolean(
                touched.password && validationErrors.password,
              )}
              aria-describedby="admin-password-error"
              maxLength={128}
              required
            />
            <p
              id="admin-password-error"
              className="mt-1 min-h-4 text-xs text-red-600"
              aria-live="polite"
            >
              {touched.password ? validationErrors.password : ""}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || hasValidationErrors(validationErrors)}
            className="w-full rounded-lg bg-[#003251] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0b2e4c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
