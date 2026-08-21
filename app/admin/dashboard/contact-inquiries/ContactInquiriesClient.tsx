"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Inquiry {
  id: number;
  property_title: string | null;
  name: string;
  email: string;
  phone: string;
  subject: string | null;
  help_with: string | null;
  source: "property" | "general";
  consented_at: string | null;
  message: string;
  created_at: string;
}

const ENDPOINT = "/api/admin/contact/get_contacts.php";

export default function ContactInquiriesClient() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInquiries = useCallback(async () => {
    try {
      const response = await fetch(ENDPOINT, { cache: "no-store" });
      if (response.status === 401) {
        router.replace("/admin");
        router.refresh();
        return;
      }

      const payload = (await response.json()) as {
        status?: string;
        message?: string;
        data?: Inquiry[];
      };
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to load contact inquiries.");
      }

      setInquiries(payload.data || []);
      setError("");
    } catch (inquiryError) {
      setError(
        inquiryError instanceof Error
          ? inquiryError.message
          : "Unable to load contact inquiries.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadInquiries(), 0);
    const refresh = window.setInterval(() => loadInquiries(), 5000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refresh);
    };
  }, [loadInquiries]);

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8862a]">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#003251] sm:text-3xl">
          Contact inquiries
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Read messages submitted from the website and individual property pages.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#dbe5ea] bg-white shadow-sm shadow-[#003251]/5">
        <div className="p-4 sm:p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Contact Inquiries
          </h2>

          {error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-gray-400">Loading…</div>
          ) : inquiries.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No inquiries yet.</div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <article
                  key={inquiry.id}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <span className="font-medium text-gray-900">{inquiry.name}</span>
                      <span className="mx-2 text-gray-400">·</span>
                      <a
                        href={`mailto:${inquiry.email}`}
                        className="text-sm text-[#c8862a] hover:underline"
                      >
                        {inquiry.email}
                      </a>
                      {inquiry.phone && (
                        <>
                          <span className="mx-2 text-gray-400">·</span>
                          <a
                            href={`tel:${inquiry.phone}`}
                            className="text-sm text-gray-500 hover:underline"
                          >
                            {inquiry.phone}
                          </a>
                        </>
                      )}
                    </div>
                    <time className="text-xs text-gray-400" dateTime={inquiry.created_at}>
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </time>
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-orange-50 px-2 py-1 font-medium text-[#c8862a]">
                      {inquiry.source === "property"
                        ? "Property inquiry"
                        : "Website contact"}
                    </span>
                    {inquiry.help_with && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                        {inquiry.help_with}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-gray-800">
                    {inquiry.source === "property"
                      ? `Re: ${inquiry.property_title || "Property no longer available"}`
                      : inquiry.subject || "General inquiry"}
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-gray-600">
                    {inquiry.message}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
