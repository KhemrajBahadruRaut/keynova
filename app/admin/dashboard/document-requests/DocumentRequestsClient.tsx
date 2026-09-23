"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DocumentRequest {
  id: number;
  property_id: number;
  property_title: string | null;
  property_agent_name: string | null;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  requested_at: string;
  verified_at: string | null;
  status: string;
}

interface PropertyVisitor {
  id: number;
  name: string;
  email: string;
  phone: string;
  entry_property_id: number;
  entry_property_title: string | null;
  entry_agent_name: string | null;
  entry_source: string;
  created_at: string;
  expires_at: string;
}

const ENDPOINT = "/api/admin/property/get_doc_requests.php";

function displayDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    listing: "Listings",
    exclusive: "Exclusive",
    grandliving: "Grand Living",
    agent: "Agent site",
    related: "Related property",
  };
  return labels[source] || source || "Listings";
}

export default function DocumentRequestsClient() {
  const router = useRouter();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [visitors, setVisitors] = useState<PropertyVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
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
        data?: DocumentRequest[];
        visitors?: PropertyVisitor[];
      };
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to load property access activity.");
      }

      setRequests(payload.data || []);
      setVisitors(payload.visitors || []);
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load property access activity.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadRequests(), 0);
    const refresh = window.setInterval(() => loadRequests(), 5000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refresh);
    };
  }, [loadRequests]);

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f7895]">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#003251] sm:text-3xl">
          Property visitors
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track verified visitors and the first property they viewed.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-[#dbe5ea] bg-white shadow-sm shadow-[#003251]/5">
        <div className="p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Verified visitor activity
          </h2>
          <p className="mb-5 text-xs text-gray-400">
            A visitor verifies once and can continue viewing properties for 30 days in the same browser.
          </p>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading…</div>
          ) : visitors.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              No verified property visitors yet.
            </div>
          ) : (
            <div className="space-y-4">
              {visitors.map((visitor) => (
                <article key={visitor.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-gray-900">{visitor.name}</p>
                      <a className="mt-1 block text-sm text-[#2f7895] hover:underline" href={`mailto:${visitor.email}`}>
                        {visitor.email}
                      </a>
                      <a className="mt-1 block text-sm text-slate-500 hover:underline" href={`tel:${visitor.phone}`}>
                        {visitor.phone}
                      </a>
                    </div>
                    <div className="text-sm">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">First property viewed</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {visitor.entry_property_title || `Property #${visitor.entry_property_id}`}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#2f7895]">
                        Agent: {visitor.entry_agent_name || "Not assigned"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {sourceLabel(visitor.entry_source)} · {displayDate(visitor.created_at)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-[#dbe5ea] bg-white shadow-sm shadow-[#003251]/5">
        <div className="p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Verification requests
          </h2>
          <p className="mb-5 text-xs text-gray-400">
            Email-code requests used to unlock property details and documents.
          </p>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              No verification requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-3 font-medium text-gray-600">Visitor</th>
                    <th className="pb-3 font-medium text-gray-600">Phone</th>
                    <th className="pb-3 font-medium text-gray-600">Entry property</th>
                    <th className="pb-3 font-medium text-gray-600">Source</th>
                    <th className="pb-3 font-medium text-gray-600">Date</th>
                    <th className="pb-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{request.name}</p>
                        <a className="text-xs text-[#2f7895] hover:underline" href={`mailto:${request.email}`}>
                          {request.email}
                        </a>
                      </td>
                      <td className="py-3 text-gray-600">{request.phone || "—"}</td>
                      <td className="max-w-44 truncate py-3 text-gray-600">
                        <p>{request.property_title || `Property #${request.property_id}`}</p>
                        <p className="text-xs text-[#2f7895]">
                          Agent: {request.property_agent_name || "Not assigned"}
                        </p>
                      </td>
                      <td className="py-3 text-gray-500">{sourceLabel(request.source)}</td>
                      <td className="py-3 text-gray-400">{displayDate(request.requested_at)}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            request.status === "verified"
                              ? "bg-green-100 text-green-700"
                              : "bg-sky-100 text-sky-700"
                          }`}
                        >
                          {request.status === "verified" ? "Verified" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
