"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Badge,
  App,
  Button,
  ConfigProvider,
  Drawer,
  Layout,
  Menu as AntMenu,
  Tooltip,
  type MenuProps,
  type ThemeConfig,
} from "antd";
import adminLogo from "@/public/logo/logofooter.png";
import styles from "./AdminShell.module.css";
import {
  Building2,
  ExternalLink,
  FileCheck2,
  FilePenLine,
  HousePlus,
  Images,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Quote,
  UsersRound,
  X,
} from "lucide-react";

const ADMIN_SECTIONS = [
  {
    key: "hero",
    group: "Website",
    label: "Homepage Hero",
    description: "Carousel images and labels",
    href: "/admin/dashboard/hero-images",
    Icon: Images,
  },
  {
    key: "properties",
    group: "Website",
    label: "Properties",
    description: "Listings and inventory",
    href: "/admin/dashboard/properties",
    Icon: Building2,
  },
  {
    key: "team",
    group: "Website",
    label: "Team Members",
    description: "Profiles and biographies",
    href: "/admin/dashboard/team",
    Icon: UsersRound,
  },
  {
    key: "testimonials",
    group: "Inbox & leads",
    label: "Testimonials",
    description: "Approve client stories",
    href: "/admin/dashboard/testimonials",
    Icon: Quote,
  },
  {
    key: "content",
    group: "Website",
    label: "Page Content",
    description: "Homepage and guide content",
    href: "/admin/dashboard/page-content",
    Icon: FilePenLine,
  },
  {
    key: "valuations",
    group: "Inbox & leads",
    label: "Home Valuations",
    description: "Requests and form content",
    href: "/admin/dashboard/home-valuations",
    Icon: HousePlus,
  },
  {
    key: "requests",
    group: "Inbox & leads",
    label: "Property Visitors",
    description: "Property document access",
    href: "/admin/dashboard/document-requests",
    Icon: FileCheck2,
  },
  {
    key: "inquiries",
    group: "Inbox & leads",
    label: "Contact Inquiries",
    description: "Messages from visitors",
    href: "/admin/dashboard/contact-inquiries",
    Icon: MessageSquareText,
  },
  {
    key: "email",
    group: "System",
    label: "Email Settings",
    description: "Notification recipients",
    href: "/admin/dashboard/email-settings",
    Icon: Mail,
  },
] as const;

type AdminCounts = Record<(typeof ADMIN_SECTIONS)[number]["key"], number>;

const EMPTY_COUNTS: AdminCounts = {
  hero: 0,
  properties: 0,
  team: 0,
  testimonials: 0,
  content: 0,
  valuations: 0,
  requests: 0,
  inquiries: 0,
  email: 0,
};

const ADMIN_THEME: ThemeConfig = {
  token: {
    colorPrimary: "#003251",
    colorError: "#003251",
    colorInfo: "#003251",
    colorSuccess: "#003251",
    colorWarning: "#003251",
    colorLink: "#003251",
    colorTextHeading: "#003251",
    colorBorder: "#d1d5db",
    colorBgLayout: "#f3f4f6",
    controlHeight: 40,
    borderRadius: 10,
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  components: {
    Layout: { siderBg: "#003251" },
    Menu: {
      darkItemBg: "#003251",
      darkSubMenuItemBg: "#003251",
      darkPopupBg: "#003251",
      darkItemColor: "rgba(255, 255, 255, 0.78)",
      darkItemHoverColor: "#ffffff",
      darkItemHoverBg: "rgba(255, 255, 255, 0.08)",
      darkItemSelectedBg: "rgba(255, 255, 255, 0.12)",
      darkItemSelectedColor: "#ffffff",
      darkGroupTitleColor: "rgba(255, 255, 255, 0.45)",
      itemHeight: 56,
      itemMarginInline: 4,
      itemBorderRadius: 10,
      collapsedWidth: 72,
      iconSize: 18,
    },
  },
};

export default function AdminShell({
  children,
  adminEmail,
}: Readonly<{ children: ReactNode; adminEmail: string }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
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
        hero: 0,
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
        email: 0,
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

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeMobileNavigation = () => {
      if (desktop.matches) setMobileNavOpen(false);
    };
    desktop.addEventListener("change", closeMobileNavigation);
    return () => desktop.removeEventListener("change", closeMobileNavigation);
  }, []);

  const handleLogout = async () => {
    setLogoutBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/admin");
      router.refresh();
    } finally {
      setLogoutBusy(false);
    }
  };

  const currentSection = ADMIN_SECTIONS.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  );
  const currentLabel = pathname === "/admin/dashboard" ? "Overview" : currentSection?.label || "Admin";

  const renderNavigation = (mobile = false) => {
    const compact = collapsed && !mobile;
    const overview = {
      key: "/admin/dashboard",
      title: "Overview",
      icon: <LayoutDashboard size={18} aria-hidden="true" />,
      label: (
        <Link href="/admin/dashboard" className={styles.menuLink} aria-current={pathname === "/admin/dashboard" ? "page" : undefined}>
          <span className={styles.menuCopy}>
            <span className={styles.menuLabel}>Overview</span>
            {!compact && <span className={styles.menuDescription}>Site health and activity</span>}
          </span>
        </Link>
      ),
    };
    const groups = (["Website", "Inbox & leads", "System"] as const).map((group) => ({
      type: "group" as const,
      key: group,
      label: group,
      children: ADMIN_SECTIONS.filter((section) => section.group === group).map(
        ({ key, label, description, href, Icon }) => ({
          key: href,
          title: label,
          icon: (
            <Badge dot={compact && counts[key] > 0} color="#ffffff">
              <Icon size={18} aria-hidden="true" />
            </Badge>
          ),
          label: (
            <Link href={href} className={styles.menuLink} aria-current={currentSection?.href === href ? "page" : undefined}>
              <span className={styles.menuCopy}>
                <span className={styles.menuLabel}>{label}</span>
                {!compact && <span className={styles.menuDescription}>{description}</span>}
              </span>
              {!compact && <Badge className={styles.menuCount} offset={[-2, 0]} count={counts[key]} overflowCount={99} size="small"/>}
            </Link>
          ),
        }),
      ),
    }));
    const items: MenuProps["items"] = compact
      ? [overview, ...groups.flatMap((group) => group.children)]
      : [{ type: "group", key: "workspace", label: "Workspace", children: [overview] }, ...groups];

    return (
      <nav id={mobile ? "admin-mobile-navigation" : "admin-desktop-navigation"} className={styles.navigation} aria-label="Admin sections">
        <AntMenu
          className={styles.menu}
          theme="dark"
          mode="inline"
          inlineCollapsed={compact}
          inlineIndent={16}
          selectedKeys={[currentSection?.href || "/admin/dashboard"]}
          items={items}
          onClick={({ key, domEvent }) => {
            if (mobile) setMobileNavOpen(false);
            // Links preserve normal browser navigation; Enter on a menu item
            // also works when the item itself has keyboard focus.
            if (!(domEvent.target instanceof Element && domEvent.target.closest("a"))) {
              router.push(key);
            }
          }}
        />
      </nav>
    );
  };

  const renderActions = (compact = false) => (
    <ConfigProvider theme={{ token: { colorText: "rgba(255,255,255,0.78)", colorBgTextHover: "rgba(255,255,255,0.08)", colorError: "#ffffff" } }}>
      <div className="space-y-2">
        <Tooltip title={compact ? "View public website" : undefined} placement="right">
          <Button type="text" block href="/" target="_blank" rel="noreferrer" icon={<ExternalLink size={18} aria-hidden="true" />} aria-label="View public website" style={{ height: 44, justifyContent: compact ? "center" : "flex-start" }}>
            {!compact && "View public website"}
          </Button>
        </Tooltip>
        <Tooltip title={compact ? "Log out" : undefined} placement="right">
          <Button type="text" danger block loading={logoutBusy} onClick={handleLogout} icon={<LogOut size={18} aria-hidden="true" />} aria-label="Log out" style={{ height: 44, justifyContent: compact ? "center" : "flex-start" }}>
            {!compact && "Log out"}
          </Button>
        </Tooltip>
      </div>
    </ConfigProvider>
  );

  return (
    <ConfigProvider theme={ADMIN_THEME}>
      <App component={false}>
        <Layout style={{ minHeight: "100dvh", flexDirection: "column", background: "#f3f4f6", "--admin-sidebar-width": collapsed ? "88px" : "288px" } as CSSProperties}>
          <Layout.Sider width={278} collapsedWidth={88} collapsed={collapsed} collapsible trigger={null} className={styles.desktopSider} style={{ position: "fixed", inset: "0 auto 0 0", height: "100dvh", zIndex: 40 }}>
            <div className={styles.sidebarBody}>
              <Link
                href="/admin/dashboard"
                className={`flex min-h-28 items-center border-b border-white/10 py-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${collapsed ? "justify-center px-3" : "gap-4 px-6"}`}
                aria-label="Go to admin overview"
              >
                <Image
                  src={adminLogo}
                  width={56}
                  sizes="56px"
                  alt=""
                  loading="eager"
                  className="h-14 w-14 shrink-0 object-contain"
                />
                {!collapsed && <div className="min-w-0 border-l border-white/20 pl-4">
                  <p className="text-base font-semibold text-white">KeyNova Admin</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-200">
                    Website Management
                  </p>
                </div>}
              </Link>

              {renderNavigation()}

              <div className="shrink-0 border-t border-white/10 p-4">
                {renderActions(collapsed)}
              </div>
            </div>
          </Layout.Sider>

          <header className="sticky  top-0 z-40 border-b border-white/10 bg-[#003251] shadow-lg shadow-[#003251]/10 xl:hidden">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <Link
                href="/admin/dashboard"
                className="flex min-w-0 items-center gap-3"
              >
                <Image
                  src={adminLogo}
                  width={44}
                  sizes="44px"
                  alt=""
                  loading="eager"
                  className="h-11 w-11 shrink-0 object-contain"
                />
                <div className="min-w-0 border-l border-white/20 pl-3">
                  <p className="truncate text-sm font-semibold text-white">KeyNova Admin</p>
                  <p className="truncate text-[10px] uppercase tracking-[0.18em] text-slate-200">
                    {currentLabel}
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
                <Button
                  type="text"
                  onClick={() => setMobileNavOpen((open) => !open)}
                  icon={<Menu size={20} aria-hidden="true" />}
                  style={{ width: 44, height: 44, color: "white", border: "1px solid rgba(255,255,255,0.15)" }}
                  aria-label={mobileNavOpen ? "Close admin navigation" : "Open admin navigation"}
                  aria-expanded={mobileNavOpen}
                  aria-controls="admin-mobile-navigation"
                />
              </div>
            </div>

          </header>

          <Drawer
            title="Admin navigation"
            placement="left"
            size="min(320px, 100vw)"
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            closable={{ placement: "end", closeIcon: <X size={20} aria-hidden="true" /> }}
            destroyOnHidden
            focusable={{ trap: true, focusTriggerAfterClose: true }}
            styles={{
              section: { background: "#003251", color: "white" },
              header: { borderBottom: "1px solid rgba(255,255,255,0.1)" },
              title: { color: "white" },
              body: { padding: 0, display: "flex", flexDirection: "column" },
              footer: { padding: 16, borderTop: "1px solid rgba(255,255,255,0.1)" },
              close: { color: "white" },
            }}
            footer={renderActions()}
          >
            <p className="border-b border-white/10 px-6 py-4 text-xs text-white/65 wrap-anywhere">{adminEmail}</p>
            {renderNavigation(true)}
          </Drawer>

          <div className={styles.mainContent}>
            <header className="sticky top-0 z-30 hidden h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-8 backdrop-blur-xl xl:flex">
              <div className="flex items-center gap-4">
                <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                  <Button type="text" onClick={() => setCollapsed((current) => !current)} icon={collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} aria-controls="admin-desktop-navigation" style={{ width: 44, height: 44, color: "#003251" }} />
                </Tooltip>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#003251]">
                    KeyNova workspace
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[#003251]">{currentLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">Administrator</p>
                  <p className="max-w-56 truncate text-xs text-slate-400">{adminEmail}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#003251] text-sm font-bold uppercase text-white shadow-sm ring-4 ring-[#003251]/8">
                  {adminEmail.charAt(0) || "A"}
                </div>
              </div>
            </header>
            <main className="mx-auto max-w-360 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {children}
            </main>
          </div>
        </Layout>
      </App>
    </ConfigProvider>
  );
}
