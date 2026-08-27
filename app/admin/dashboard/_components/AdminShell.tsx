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
  LogOut,
  Menu,
  MessageSquareText,
  UsersRound,
  X,
} from "lucide-react";

const ADMIN_SECTIONS = [
  {
    key: "properties",
    label: "Properties",
    href: "/admin/dashboard/properties",
    Icon: Building2,
  },
  {
    key: "team",
    label: "Team Members",
    href: "/admin/dashboard/team",
    Icon: UsersRound,
  },
  {
    key: "requests",
    label: "Document Requests",
    href: "/admin/dashboard/document-requests",
    Icon: FileCheck2,
  },
  {
    key: "inquiries",
    label: "Contact Inquiries",
    href: "/admin/dashboard/contact-inquiries",
    Icon: MessageSquareText,
  },
] as const;

export default function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [counts, setCounts] = useState({
    properties: 0,
    team: 0,
    requests: 0,
    inquiries: 0,
  });

  const loadCounts = useCallback(async () => {
    try {
      const responses = await Promise.all([
        fetch("/api/admin/property/get_properties.php?destination=all", {
          cache: "no-store",
        }),
        fetch("/api/admin/team/get_admin_members.php", { cache: "no-store" }),
        fetch("/api/admin/property/get_doc_requests.php", { cache: "no-store" }),
        fetch("/api/admin/contact/get_contacts.php", { cache: "no-store" }),
      ]);
      if (responses.some((response) => response.status === 401)) {
        router.replace("/admin");
        router.refresh();
        return;
      }

      const [properties, team, requests, inquiries] = await Promise.all(
        responses.map((response) => response.json()),
      );
      setCounts({
        properties: properties.status === "success" ? properties.data?.length || 0 : 0,
        team: team.status === "success" ? team.data?.length || 0 : 0,
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

  const sectionLinkClass = (href: string, mobile = false) => {
    const active = pathname === href;
    const layout = mobile
      ? "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left"
      : "inline-flex items-center gap-2 rounded-lg px-3 py-2";

    return `${layout} text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d7a85f] ${
      active
        ? "bg-white/15 text-white"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;
  };

  return (
    <div className="min-h-screen bg-[#eef3f6] text-slate-800">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#003251] shadow-lg shadow-[#071a2a]/10">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/admin/dashboard/properties"
            className="flex min-w-0 items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d7a85f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#003251]"
            aria-label="Go to property management"
          >
            <Image
              src="/logo/logofooter.png"
              width={282}
              height={282}
              alt=""
              priority
              className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
            />
            <div className="min-w-0 border-l border-white/20 pl-3">
              <p className="truncate text-xs font-semibold text-white sm:text-sm">
                KeyNova Admin
              </p>
              <p className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-[#d7a85f] sm:block">
                Website Management
              </p>
            </div>
          </Link>

          <nav
            className="ml-3 hidden flex-1 items-center justify-center gap-1 lg:flex"
            aria-label="Admin sections"
          >
            {ADMIN_SECTIONS.map(({ key, label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={sectionLinkClass(href)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
                {counts[key] > 0 && (
                  <span className="rounded-full bg-[#c8862a] px-2 py-0.5 text-[11px] font-semibold text-white">
                    {counts[key]}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:border-[#c8862a] hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View site
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              className="inline-flex items-center justify-center rounded-lg border border-white/15 p-2 text-white/80 transition-colors hover:border-[#c8862a] hover:bg-white/10 hover:text-white lg:hidden"
              aria-label={mobileNavOpen ? "Close admin navigation" : "Open admin navigation"}
              aria-expanded={mobileNavOpen}
              aria-controls="admin-mobile-navigation"
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:border-[#c8862a] hover:bg-white/10 hover:text-white"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <nav
          id="admin-mobile-navigation"
          className={`border-t border-white/10 lg:hidden ${
            mobileNavOpen ? "block" : "hidden"
          }`}
          aria-label="Mobile admin sections"
        >
          <div className="mx-auto grid max-w-7xl gap-1 px-4 py-3 sm:px-6">
            {ADMIN_SECTIONS.map(({ key, label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                aria-current={pathname === href ? "page" : undefined}
                className={sectionLinkClass(href, true)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
                {counts[key] > 0 && (
                  <span className="ml-auto rounded-full bg-[#c8862a] px-2 py-0.5 text-[11px] font-semibold text-white">
                    {counts[key]}
                  </span>
                )}
              </Link>
            ))}
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              View public site
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
