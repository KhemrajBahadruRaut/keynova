"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";

const socialLinks = [
  {
    label: "Instagram",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  },
  {
    label: "Facebook",
    path: "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971h-1.513c-1.49 0-1.956.931-1.956 1.887v2.263h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z",
  },
  {
    label: "LinkedIn",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.554V9h3.565v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
] as const;

type NavLink = {
  name: string;
  path: string;
  children?: { name: string; path: string }[];
};

const navLinks: NavLink[] = [
  { name: "Home", path: "/" },
  {
    name: "About",
    path: "/about",
    children: [
      { name: "About KeyNova", path: "/about" },
      { name: "Meet the Team", path: "/meet-the-team" },
    ],
  },
  { name: "Grand Living", path: "/grandliving" },
  { name: "Exclusive", path: "/exclusive" },
  { name: "Contact Us", path: "/contact" },
];

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);

  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (mobileOpen || currentY < 10) {
        setShowNav(true);
      } else if (currentY > lastScrollY.current) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileOpen]);

  const pathIsActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-[#003251]
      transition-transform duration-500 ease-in-out
      ${showNav ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo/logo.avif" alt="Logo" width={200} />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-10 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => {
            const isActive =
              pathIsActive(link.path) ||
              Boolean(link.children?.some((child) => pathIsActive(child.path)));

            if (link.children) {
              return (
                <div key={link.name} className="group relative">
                  <Link
                    href={link.path}
                    aria-haspopup="true"
                    className={`relative flex items-center gap-1.5 text-sm font-medium transition-colors ${
                      isActive ? "text-white" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {link.name}
                    <ChevronDown
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180"
                    />
                    {isActive && (
                      <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-white" />
                    )}
                  </Link>

                  <div className="invisible absolute left-1/2 top-full w-52 -translate-x-1/2 translate-y-1 pt-4 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <div className="border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10">
                      {link.children.map((child) => {
                        const childIsActive = pathIsActive(child.path);

                        return (
                          <Link
                            key={child.path}
                            href={child.path}
                            className={`block px-4 py-3 text-sm font-medium transition-colors ${
                              childIsActive
                                ? "bg-[#003251] text-white"
                                : "text-[#003251] hover:bg-slate-100"
                            }`}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={link.name}
                href={link.path}
                className={`relative text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-white/70 hover:text-white"
                }`}
              >
                {link.name}

                {isActive && (
                  <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Social icons */}
          <div className="hidden items-center gap-3 sm:flex md:hidden lg:flex">
            {socialLinks.map(({ label, path }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition-opacity hover:opacity-80"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4 fill-current text-[#003251]"
                >
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            className="flex h-10 w-10 items-center justify-center border border-white/25 text-white lg:hidden"
          >
            {mobileOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-white/15 px-6 pb-6 pt-3 lg:hidden"
        >
          {navLinks.map((link) => (
            <div key={link.name} className="border-b border-white/10 last:border-b-0">
              <Link
                href={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block py-3 text-sm font-semibold ${
                  pathIsActive(link.path) ? "text-white" : "text-white/75"
                }`}
              >
                {link.name}
              </Link>
              {link.children && (
                <div className="mb-3 border-l border-white/20 pl-4">
                  {link.children
                    .filter((child) => child.path !== link.path)
                    .map((child) => (
                      <Link
                        key={child.path}
                        href={child.path}
                        onClick={() => setMobileOpen(false)}
                        className={`block py-2 text-sm ${
                          pathIsActive(child.path)
                            ? "font-semibold text-white"
                            : "text-white/65"
                        }`}
                      >
                        {child.name}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
