"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      if (response.ok) router.replace("/admin/dashboard");
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
        router.replace("/admin/dashboard");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-87.5"
        noValidate
      >
        <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center" role="alert">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label htmlFor="admin-email" className="sr-only">
            Admin Email
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Admin Email"
            className={`w-full border p-2 rounded outline-none focus:ring-2 ${
              touched.email && validationErrors.email
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-[#c8862a]/30"
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

        <div className="mb-4">
          <label htmlFor="admin-password" className="sr-only">
            Password
          </label>
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            className={`w-full border p-2 rounded outline-none focus:ring-2 ${
              touched.password && validationErrors.password
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-[#c8862a]/30"
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
          className="w-full bg-black text-white p-2 rounded hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
