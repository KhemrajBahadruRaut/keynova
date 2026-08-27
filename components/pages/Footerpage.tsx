import React from "react";
import { Phone, Mail, MapPin, KeyRound } from "lucide-react";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/keynovagroup?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61579968040803",
    path: "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971h-1.513c-1.49 0-1.956.931-1.956 1.887v2.263h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/keynovagroup/",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.554V9h3.565v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
] as const;

const FooterPage: React.FC = () => {
  return (
    <footer className="bg-[#003251] px-6 py-12 text-white">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 sm:grid-cols-[auto_1px_1fr_1px_auto] sm:items-start">
        {/* Logo */}
        <div className="flex items-center gap-3">
            
            <img src="/logo/logofooter.png" alt="" height={10} width={120} />
          </div>


        <div className="hidden self-stretch bg-white/20 sm:block" />

        {/* Contact */}
        <div className="flex justify-center">
          <div className=" flex flex-col gap-4 text-sm text-white/90">
          <h2 className="text-sm font-bold tracking-wide">CONTACT</h2>
            <div className="flex items-center gap-3">
              <Phone size={16} />
              <a href="tel:19782457392">(978) 245-7392</a>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} />
              <a href="mailto:management@keynovagrp.com">
                management@keynovagrp.com
              </a>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <a
                href="https://www.google.com/maps/search/?api=1&query=270+Littleton+Road+%2310+Westford+MA+01886"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                270 Littleton Road #10
                <br /> Westford, MA 01886
              </a>
            </div>
          </div>
        </div>

        <div className="hidden self-stretch bg-white/20 sm:block" />

        {/* Navigation */}
        <div>
          <h2 className="text-sm font-bold tracking-wide">NAVIGATION</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-white/90">
            <a href="/about" className="hover:text-white">
              ABOUT
            </a>
            <a href="/exclusive" className="hover:text-white">
              EXCLUSIVE
            </a>
            <a href="/grandliving" className="hover:text-white">
              GRAND LIVING
            </a>
            <a href="/contact" className="hover:text-white">
              CONTACT US
            </a>
          </div>

          <div className="mt-5 flex gap-3">
            {socialLinks.map(({ label, href, path }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
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
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-white/20 pt-6">
        <p className="text-xs leading-relaxed text-white/70">
          KeyNova Group, LLC is committed to providing an accessible website. If
          you have difficulty accessing content, have difficulty viewing a file
          on the website, or notice any accessibility problems, please contact
          me at (978) 245-7392 to specify the nature of the accessibility issue
          and any assistive technology you use. We strive to provide the content
          you need in the format you require.
        </p>
      </div>
    </footer>
  );
};

export default FooterPage;