"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DocumentRequest {
  id: number;
  property_id: number;
  property_title: string;
  name: string;
  email: string;
  requested_at: string;
  status: string;
}

const ENDPOINT = "/api/admin/property/get_doc_requests.php";

export default function DocumentRequestsClient() {
  const router = useRouter();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
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
      };
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to load document requests.");
      }

      setRequests(payload.data || []);
      setError("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load document requests.",
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c8862a]">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#0F3A5F] sm:text-3xl">
          Document requests
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review requests for secure property documents and their verification status.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-[#dbe5ea] bg-white shadow-sm shadow-[#0F3A5F]/5">
        <div className="p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Document Access Requests
          </h2>
          <p className="mb-5 text-xs text-gray-400">
            Read-only log. Visitors unlock documents by verifying the code sent to
            their email; no admin action is needed.
          </p>

          {error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-gray-400">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              No document requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-3 font-medium text-gray-600">Name</th>
                    <th className="pb-3 font-medium text-gray-600">Email</th>
                    <th className="pb-3 font-medium text-gray-600">Property</th>
                    <th className="pb-3 font-medium text-gray-600">Date</th>
                    <th className="pb-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">{request.name}</td>
                      <td className="py-3 text-[#c8862a]">{request.email}</td>
                      <td className="max-w-32 truncate py-3 text-gray-600">
                        {request.property_title}
                      </td>
                      <td className="py-3 text-gray-400">
                        {new Date(request.requested_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            request.status === "verified"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
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
