"use client";

import { Space, Tag, Typography } from "antd";
import {
  AdminTable,
  AdminCard,
  AdminNotice as ToastNotice,
} from "@/app/admin/dashboard/_components/AdminUI";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";


interface Inquiry {
  id: number;
  property_title: string | null;
  agent_id: number | null;
  agent_name: string | null;
  name: string;
  email: string;
  phone: string;
  subject: string | null;
  help_with: string | null;
  source: "property" | "general" | "agent";
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f7895]">
          Administration
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#003251] sm:text-3xl">
          Contact inquiries
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Read messages submitted from the website and individual property pages.
        </p>
      </div>

      <ToastNotice message={error} kind="error" />

      <AdminCard className="overflow-hidden rounded-xl border border-[#dbe5ea] bg-white shadow-sm shadow-[#003251]/5">
        <div className="p-4 sm:p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Contact Inquiries
          </h2>

          <AdminTable<Inquiry>
            dataSource={inquiries}
            loading={loading}
            locale={{ emptyText: "No inquiries yet." }}
            columns={[
              { title: "Visitor", key: "visitor", width: 270, render: (_, inquiry) => <div><Typography.Text strong>{inquiry.name}</Typography.Text><p><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a></p>{inquiry.phone && <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>}</div> },
              { title: "Source", key: "source", width: 220, render: (_, inquiry) => <Space orientation="vertical" size={4}><Tag color="blue">{inquiry.source === "property" ? "Property inquiry" : inquiry.source === "agent" ? "Agent inquiry" : "Website contact"}</Tag>{inquiry.agent_name && <Typography.Text type="secondary">{inquiry.agent_name}</Typography.Text>}{inquiry.help_with && <Tag>{inquiry.help_with}</Tag>}</Space> },
              { title: "Subject", key: "subject", width: 300, render: (_, inquiry) => inquiry.source === "property" ? `Re: ${inquiry.property_title || "Property no longer available"}` : inquiry.subject || "General inquiry" },
              { title: "Submitted", dataIndex: "created_at", key: "created_at", width: 170, render: (value: string) => new Date(value.replace(" ", "T")).toLocaleDateString() },
            ]}
            expandable={{ expandedRowRender: (inquiry) => <div><Typography.Text strong>Message</Typography.Text><p className="mt-2 whitespace-pre-wrap">{inquiry.message}</p></div> }}
          />
        </div>
      </AdminCard>
    </>
  );
}
