"use client";

import { Tag, Typography } from "antd";
import {
  AdminTable,
  AdminCard,
  AdminNotice as ToastNotice,
} from "@/app/admin/dashboard/_components/AdminUI";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  entry_property_id: number | null;
  entry_property_title: string | null;
  entry_agent_name: string | null;
  entry_source: string;
  created_at: string;
}

interface DocumentDownload {
  id: number;
  access_session_id: number;
  visitor_id: number;
  property_id: number;
  property_title: string | null;
  property_agent_name: string | null;
  document_name: string;
  document_filename: string;
  source: string;
  downloaded_at: string;
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
  const [downloads, setDownloads] = useState<DocumentDownload[]>([]);
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
        downloads?: DocumentDownload[];
      };
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to load property access activity.");
      }

      setRequests(payload.data || []);
      setVisitors(payload.visitors || []);
      setDownloads(payload.downloads || []);
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

  const downloadsByVisitor = useMemo(() => {
    const grouped = new Map<number, DocumentDownload[]>();
    downloads.forEach((download) => {
      const visitorDownloads = grouped.get(download.visitor_id) || [];
      visitorDownloads.push(download);
      grouped.set(download.visitor_id, visitorDownloads);
    });
    return grouped;
  }, [downloads]);

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

      <ToastNotice message={error} kind="error" />

      <AdminCard className="overflow-hidden rounded-xl border border-[#dbe5ea] bg-white shadow-sm shadow-[#003251]/5">
        <div className="p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Verified visitor activity
          </h2>
          <p className="mb-5 text-xs text-gray-400">
            A visitor verifies once and can continue viewing properties for 30 days in the same browser.
          </p>

          <AdminTable<PropertyVisitor>
            dataSource={visitors}
            loading={loading}
            locale={{ emptyText: "No verified visitors yet." }}
            columns={[
              { title: "Visitor", key: "visitor", width: 270, render: (_, visitor) => <div><Typography.Text strong>{visitor.name}</Typography.Text><p><a href={`mailto:${visitor.email}`}>{visitor.email}</a></p><a href={`tel:${visitor.phone}`}>{visitor.phone || "—"}</a></div> },
              { title: "First property", key: "property", width: 260, render: (_, visitor) => <div>{visitor.entry_property_title || (visitor.entry_property_id ? `Property #${visitor.entry_property_id}` : "Not available")}<p className="text-xs text-slate-500">Agent: {visitor.entry_agent_name || "Not assigned"}</p></div> },
              { title: "Source", dataIndex: "entry_source", key: "source", width: 140, render: sourceLabel },
              { title: "Verified", dataIndex: "created_at", key: "created", width: 200, render: displayDate },
              { title: "Downloads", key: "downloads", width: 120, render: (_, visitor) => <Tag color="blue">{downloadsByVisitor.get(visitor.id)?.length || 0}</Tag> },
            ]}
            expandable={{
              expandedRowRender: (visitor) => <AdminTable<DocumentDownload>
                dataSource={downloadsByVisitor.get(visitor.id) || []}
                pagination={false}
                locale={{ emptyText: "No document downloads yet." }}
                columns={[
                  { title: "Document", dataIndex: "document_name", key: "document", width: 240 },
                  { title: "Property", key: "property", width: 240, render: (_, download) => download.property_title || `Property #${download.property_id}` },
                  { title: "Agent", key: "agent", width: 180, render: (_, download) => download.property_agent_name || "Not assigned" },
                  { title: "Source", dataIndex: "source", key: "source", render: sourceLabel },
                  { title: "Downloaded", dataIndex: "downloaded_at", key: "downloaded", width: 200, render: displayDate },
                ]}
              />
            }}
          />
        </div>
      </AdminCard>

      <AdminCard className="mt-6 overflow-hidden rounded-xl border border-[#dbe5ea] bg-white shadow-sm shadow-[#003251]/5">
        <div className="p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Verification requests
          </h2>
          <p className="mb-5 text-xs text-gray-400">
            Email-code requests used to unlock property details and documents.
          </p>

          <AdminTable<DocumentRequest>
            dataSource={requests}
            loading={loading}
            locale={{ emptyText: "No verification requests yet." }}
            columns={[
              { title: "Visitor", key: "visitor", width: 250, render: (_, request) => <div><Typography.Text strong>{request.name}</Typography.Text><p><a href={`mailto:${request.email}`}>{request.email}</a></p></div> },
              { title: "Phone", dataIndex: "phone", key: "phone", width: 160, render: (phone: string | null) => phone || "—" },
              { title: "Entry property", key: "property", width: 260, render: (_, request) => <div>{request.property_title || `Property #${request.property_id}`}<p className="text-xs text-slate-500">Agent: {request.property_agent_name || "Not assigned"}</p></div> },
              { title: "Source", dataIndex: "source", key: "source", width: 130, render: sourceLabel },
              { title: "Date", dataIndex: "requested_at", key: "requested", width: 200, render: displayDate },
              { title: "Status", key: "status", width: 130, render: (_, request) => <Tag color={request.status === "verified" ? "success" : "processing"}>{request.status === "verified" ? "Verified" : "Pending"}</Tag> },
            ]}
          />
        </div>
      </AdminCard>
    </>
  );
}
