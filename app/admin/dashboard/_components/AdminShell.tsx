"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ExternalLink,
  FileCheck2,
  FilePenLine,
  HousePlus,
  LogOut,
  Menu,
  MessageSquareText,
  Quote,
  UsersRound,
  X,
} from "lucide-react";

const ADMIN_SECTIONS = [
  {
    key: "properties",
    label: "Properties",
    description: "Listings and inventory",
    href: "/admin/dashboard/properties",
    Icon: Building2,
  },
  {
    key: "team",
    label: "Team Members",
    description: "Profiles and biographies",
    href: "/admin/dashboard/team",
    Icon: UsersRound,
  },
  {
    key: "testimonials",
    label: "Testimonials",
    description: "Approve client stories",
    href: "/admin/dashboard/testimonials",
    Icon: Quote,
  },
  {
    key: "content",
    label: "Page Content",
    description: "Buyer and seller guides",
    href: "/admin/dashboard/page-content",
    Icon: FilePenLine,
  },
  {
    key: "valuations",
    label: "Home Valuations",
    description: "Requests and form content",
    href: "/admin/dashboard/home-valuations",
    Icon: HousePlus,
  },
  {
    key: "requests",
    label: "Document Requests",
    description: "Property document access",
    href: "/admin/dashboard/document-requests",
    Icon: FileCheck2,
  },
  {
    key: "inquiries",
    label: "Contact Inquiries",
    description: "Messages from visitors",
    href: "/admin/dashboard/contact-inquiries",
    Icon: MessageSquareText,
  },
] as const;

type AdminCounts = Record<(typeof ADMIN_SECTIONS)[number]["key"], number>;

const EMPTY_COUNTS: AdminCounts = {
  properties: 0,
  team: 0,
  testimonials: 0,
  content: 0,
  valuations: 0,
  requests: 0,
  inquiries: 0,
};

export default function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [counts, setCounts] = useState<AdminCounts>(EMPTY_COUNTS);

  const loadCounts = useCallback(async () => {
    try {
      const responses = await Promise.all([
        fetch("/api/admin/property/get_properties.php?destination=all", {
          cache: "no-store",
        }),
        fetch("/api/admin/team/get_admin_members.php", { cache: "no-store" }),
        fetch("/api/admin/property/get_doc_requests.php", { cache: "no-store" }),
        fetch("/api/admin/contact/get_contacts.php", { cache: "no-store" }),
        fetch("/api/admin/valuation/get_requests.php", { cache: "no-store" }),
        fetch("/api/admin/testimonials/get_admin_testimonials.php", {
          cache: "no-store",
        }),
      ]);
      if (responses.some((response) => response.status === 401)) {
        router.replace("/admin");
        router.refresh();
        return;
      }

      const [properties, team, requests, inquiries, valuations, testimonials] = await Promise.all(
        responses.map((response) => response.json()),
      );
      setCounts({
        properties: properties.status === "success" ? properties.data?.length || 0 : 0,
        team: team.status === "success" ? team.data?.length || 0 : 0,
        testimonials:
          testimonials.status === "success"
            ? (testimonials.data || []).filter(
                (testimonial: { status?: string }) => testimonial.status === "pending",
              ).length
            : 0,
        content: 0,
        valuations:
          valuations.status === "success"
            ? (valuations.data || []).filter(
                (request: { status?: string }) => request.status === "new",
              ).length
            : 0,
        requests:
          requests.status === "success"
            ? (requests.data || []).filter(
                (request: { status?: string }) => request.status !== "verified",
              ).length
            : 0,
        inquiries: inquiries.status === "success" ? inquiries.data?.length || 0 : 0,
      });
    } catch {
      // Section pages surface their own loading errors; navigation remains usable.
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadCounts(), 0);
    const refresh = window.setInterval(() => loadCounts(), 15000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(refresh);
    };
  }, [loadCounts]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin");
    router.refresh();
  };

  const renderNavigation = (mobile = false) => (
    <nav className="space-y-2" aria-label="Admin sections">
      {ADMIN_SECTIONS.map(({ key, label, description, href, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={mobile ? () => setMobileNavOpen(false) : undefined}
            aria-current={active ? "page" : undefined}
            className={`group flex min-h-16 items-center gap-3 rounded-xl border px-4 py-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7bc3df] ${
              active
                ? "border-white/15 bg-white/15 text-white shadow-sm"
                : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
                active
                  ? "bg-[#2f87a8] text-white"
                  : "bg-white/8 text-white/70 group-hover:bg-white/12 group-hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-5">{label}</span>
              <span className={`mt-0.5 block truncate text-xs ${active ? "text-white/65" : "text-white/40"}`}>
                {description}
              </span>
            </span>
            {counts[key] > 0 && (
              <span className="min-w-6 rounded-full bg-[#2f87a8] px-2 py-1 text-center text-[11px] font-bold leading-none text-white">
                {counts[key]}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#eef3f6] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[#003251] shadow-2xl shadow-[#071a2a]/20 xl:flex">
        <Link
          href="/admin/dashboard/properties"
          className="flex items-center gap-4 border-b border-white/10 px-6 py-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#7bc3df]"
          aria-label="Go to property management"
        >
          <Image
            src="/logo/logofooter.png"
            width={282}
            height={282}
            alt=""
            priority
            className="h-14 w-14 shrink-0 object-contain"
          />
          <div className="min-w-0 border-l border-white/20 pl-4">
            <p className="text-base font-semibold text-white">KeyNova Admin</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7bc3df]">
              Website Management
            </p>
          </div>
        </Link>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
            Management
          </p>
          {renderNavigation()}
        </div>

        <div className="space-y-2 border-t border-white/10 p-4">
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/65 transition hover:bg-white/8 hover:text-white"
          >
            <ExternalLink className="h-5 w-5" aria-hidden="true" />
            View public website
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/65 transition hover:bg-red-400/10 hover:text-red-100"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#003251] shadow-lg shadow-[#071a2a]/10 xl:hidden">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/admin/dashboard/properties"
            className="flex min-w-0 items-center gap-3"
          >
            <Image
              src="/logo/logofooter.png"
              width={282}
              height={282}
              alt=""
              priority
              className="h-11 w-11 shrink-0 object-contain"
            />
            <div className="min-w-0 border-l border-white/20 pl-3">
              <p className="truncate text-sm font-semibold text-white">KeyNova Admin</p>
              <p className="hidden text-[10px] uppercase tracking-[0.18em] text-[#7bc3df] sm:block">
                Website Management
              </p>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-lg border border-white/15 p-2.5 text-white/75 hover:bg-white/10 sm:inline-flex"
              aria-label="View public website"
            >
              <ExternalLink className="h-5 w-5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              className="inline-flex rounded-lg border border-white/15 p-2.5 text-white/80 hover:bg-white/10"
              aria-label={mobileNavOpen ? "Close admin navigation" : "Open admin navigation"}
              aria-expanded={mobileNavOpen}
              aria-controls="admin-mobile-navigation"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div id="admin-mobile-navigation" className="max-h-[calc(100vh-68px)] overflow-y-auto border-t border-white/10 px-4 py-4 sm:px-6">
            {renderNavigation(true)}
            <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2">
              <Link
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/65 hover:bg-white/8 hover:text-white sm:hidden"
              >
                <ExternalLink className="h-5 w-5" />
                View public website
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-white/65 hover:bg-red-400/10 hover:text-red-100"
              >
                <LogOut className="h-5 w-5" />
                Log out
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="xl:pl-72">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
