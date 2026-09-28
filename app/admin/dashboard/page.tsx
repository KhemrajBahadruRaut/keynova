"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  ExternalLink,
  FileCheck2,
  FilePenLine,
  HousePlus,
  Images,
  LoaderCircle,
  MessageSquareText,
  Quote,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { ToastNotice } from "@/components/ui/FeedbackProvider";

type ApiPayload = {
  status?: string;
  message?: string;
  data?: Array<Record<string, unknown>>;
};

type DashboardMetrics = {
  properties: number;
  listedProperties: number;
  team: number;
  activeTeam: number;
  inquiries: number;
  valuations: number;
  documentRequests: number;
  testimonials: number;
};

const EMPTY_METRICS: DashboardMetrics = {
  properties: 0,
  listedProperties: 0,
  team: 0,
  activeTeam: 0,
  inquiries: 0,
  valuations: 0,
  documentRequests: 0,
  testimonials: 0,
};

const ENDPOINTS = [
  "/api/admin/property/get_properties.php?destination=all",
  "/api/admin/team/get_admin_members.php",
  "/api/admin/contact/get_contacts.php",
  "/api/admin/valuation/get_requests.php",
  "/api/admin/property/get_doc_requests.php",
  "/api/admin/testimonials/get_admin_testimonials.php",
] as const;

function rows(payload: ApiPayload) {
  return payload.status === "success" && Array.isArray(payload.data) ? payload.data : [];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadDashboard = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const responses = await Promise.all(
        ENDPOINTS.map((endpoint) => fetch(endpoint, { cache: "no-store" })),
      );
      if (responses.some((response) => response.status === 401)) {
        router.replace("/admin");
        router.refresh();
        return;
      }

      const payloads = (await Promise.all(
        responses.map((response) => response.json()),
      )) as ApiPayload[];
      const [properties, team, inquiries, valuations, requests, testimonials] =
        payloads.map(rows);

      setMetrics({
        properties: properties.length,
        listedProperties: properties.filter((item) => item.show_on_listing === true).length,
        team: team.length,
        activeTeam: team.filter((item) => item.is_active === true).length,
        inquiries: inquiries.length,
        valuations: valuations.filter((item) => item.status === "new").length,
        documentRequests: requests.filter((item) => item.status !== "verified").length,
        testimonials: testimonials.filter((item) => item.status === "pending").length,
      });
      setUpdatedAt(new Date());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the dashboard overview.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadDashboard(), 0);
    const refresh = window.setInterval(() => loadDashboard(true), 30_000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refresh);
    };
  }, [loadDashboard]);

  const attentionTotal = useMemo(
    () => metrics.valuations + metrics.documentRequests + metrics.testimonials,
    [metrics],
  );

  const summaryCards = [
    {
      label: "Properties",
      value: metrics.properties,
      detail: `${metrics.listedProperties} visible on listings`,
      href: "/admin/dashboard/properties",
      Icon: Building2,
      style: "bg-[#e9f4f7] text-[#17647b]",
    },
    {
      label: "Team members",
      value: metrics.team,
      detail: `${metrics.activeTeam} active profiles`,
      href: "/admin/dashboard/team",
      Icon: UsersRound,
      style: "bg-[#eef2ff] text-indigo-700",
    },
    {
      label: "Contact inquiries",
      value: metrics.inquiries,
      detail: "Messages received",
      href: "/admin/dashboard/contact-inquiries",
      Icon: MessageSquareText,
      style: "bg-[#fff5e8] text-amber-700",
    },
    {
      label: "Needs attention",
      value: attentionTotal,
      detail: "Pending reviews and requests",
      href: "/admin/dashboard/testimonials",
      Icon: FileCheck2,
      style: "bg-[#fff0f1] text-rose-700",
    },
  ];

  const workQueue = [
    {
      label: "New valuation requests",
      count: metrics.valuations,
      href: "/admin/dashboard/home-valuations",
      Icon: HousePlus,
      color: "text-amber-700 bg-amber-50",
    },
    {
      label: "Unverified property visitors",
      count: metrics.documentRequests,
      href: "/admin/dashboard/document-requests",
      Icon: FileCheck2,
      color: "text-sky-700 bg-sky-50",
    },
    {
      label: "Testimonials awaiting review",
      count: metrics.testimonials,
      href: "/admin/dashboard/testimonials",
      Icon: Quote,
      color: "text-violet-700 bg-violet-50",
    },
  ];

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-[#003251] px-6 py-8 text-white shadow-xl shadow-[#003251]/10 sm:px-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#80c5de]">
              Admin overview
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
              Manage the website, review new leads, and keep property content current from one workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#003251] transition hover:bg-slate-100"
            >
              View website <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <ToastNotice message={error} kind="error" />

      <section aria-labelledby="overview-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="overview-heading" className="text-lg font-semibold text-[#003251]">At a glance</h2>
            <p className="mt-1 text-xs text-slate-400">
              {updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Loading current activity"}
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {summaryCards.map(({ label, value, detail, href, Icon, style }) => (
            <Link
              key={label}
              href={href}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/3 transition hover:-translate-y-0.5 hover:border-[#2f87a8]/35 hover:shadow-lg hover:shadow-[#003251]/6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${style}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#2f7895]" aria-hidden="true" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-[#003251]">
                {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-100" /> : value}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
              <p className="mt-1 text-xs text-slate-400">{detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-semibold text-[#003251]">Work queue</h2>
              <p className="mt-1 text-xs text-slate-400">Items that may need a response</p>
            </div>
            {loading && <LoaderCircle className="h-4 w-4 animate-spin text-[#2f87a8]" aria-label="Loading" />}
          </div>
          <div className="divide-y divide-slate-100">
            {workQueue.map(({ label, count, href, Icon, color }) => (
              <Link
                key={label}
                href={href}
                className="group flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:px-6"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-700">{label}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {count === 0 ? "Nothing waiting" : `${count} ${count === 1 ? "item" : "items"} waiting`}
                  </span>
                </span>
                <span className={`min-w-8 rounded-full px-2.5 py-1 text-center text-xs font-bold ${count > 0 ? "bg-[#003251] text-white" : "bg-slate-100 text-slate-400"}`}>
                  {loading ? "–" : count}
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-[#2f7895]" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="font-semibold text-[#003251]">Quick actions</h2>
            <p className="mt-1 text-xs text-slate-400">Common website management tasks</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Manage properties", detail: "Add or update listings", href: "/admin/dashboard/properties", Icon: Building2 },
              { label: "Update hero", detail: "Homepage carousel", href: "/admin/dashboard/hero-images", Icon: Images },
              { label: "Edit page content", detail: "Homepage and guides", href: "/admin/dashboard/page-content", Icon: FilePenLine },
              { label: "Manage team", detail: "Profiles and biographies", href: "/admin/dashboard/team", Icon: UsersRound },
            ].map(({ label, detail, href, Icon }) => (
              <Link
                key={label}
                href={href}
                className="group rounded-xl border border-slate-200 p-4 transition hover:border-[#2f87a8]/45 hover:bg-[#f7fbfc]"
              >
                <Icon className="h-5 w-5 text-[#2f7895]" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-[#003251]">{label}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
