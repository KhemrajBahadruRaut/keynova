import type { Metadata } from "next";
import Link from "next/link";

import Navbar from "@/components/navbar/Navbar";
import FooterPage from "@/components/pages/Footerpage";

export const metadata: Metadata = {
  title: "Privacy Policy | KeyNova Group",
  description:
    "Learn how KeyNova Group handles information submitted through its real estate website, forms, and visitor accounts.",
};

const sectionClassName = "space-y-3";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white px-6 py-16 text-[#003251] sm:py-20 lg:px-10">
        <article className="mx-auto max-w-4xl">
          <header className="mb-12 border-b border-slate-200 pb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              KeyNova Group, LLC
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm text-slate-500">Last updated: October 26, 2026</p>
            <p className="mt-5 max-w-3xl leading-7 text-slate-700">
              This policy explains how KeyNova Group handles information when you visit
              our website, contact us, request a home valuation, or create an account to
              access property information and documents.
            </p>
          </header>

          <div className="space-y-10 leading-7 text-slate-700">
            <section className={sectionClassName}>
              <h2 className="text-2xl font-semibold text-[#003251]">Information we collect</h2>
              <p>
                The information we receive depends on how you use the site. It may include
                your name, email address, phone number, messages, and the real estate
                services you ask about. A home valuation request may also include a
                property address, ZIP code, property type, and room details.
              </p>
              <p>
                If you create a visitor account or request access to property materials,
                we may collect your account credentials, verification status, saved
                properties, and related activity such as document access. Passwords are
                stored as password hashes rather than readable passwords.
              </p>
              <p>
                The site also uses browser storage and session information to keep you
                signed in and support account and property-access features. Your browser
                and the services that deliver the site may process basic technical
                information needed to provide those features.
              </p>
            </section>

            <section className={sectionClassName}>
              <h2 className="text-2xl font-semibold text-[#003251]">How we use information</h2>
              <p>We use information to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Respond to questions and route inquiries to the appropriate KeyNova team member or agent.</li>
                <li>Prepare and respond to valuation, property, and service requests.</li>
                <li>Verify visitor accounts, provide property access, and maintain saved-property and account features.</li>
                <li>Send communications related to a request or to marketing preferences you submit through a form.</li>
                <li>Operate, protect, and improve the website and its services.</li>
              </ul>
            </section>

            <section className={sectionClassName}>
              <h2 className="text-2xl font-semibold text-[#003251]">When information is shared</h2>
              <p>
                We may share information with KeyNova personnel and the agent handling
                your inquiry so they can respond to you. We also use service providers
                that help operate the website and its features, such as hosting, email,
                and map services. Those providers process information as needed to
                provide their services.
              </p>
              <p>
                We may disclose information when needed to comply with law, respond to
                valid legal requests, protect people or the site, or handle a business
                transaction. The specific information shared depends on the request and
                the service involved.
              </p>
            </section>

            <section className={sectionClassName}>
              <h2 className="text-2xl font-semibold text-[#003251]">Messages and preferences</h2>
              <p>
                If you provide contact details and agree to be contacted, KeyNova Group
                may contact you about your inquiry and real estate services using the
                channels described on that form. For marketing texts, reply STOP to
                cancel or HELP for assistance. You can also use an email unsubscribe
                link when one is included, or contact us to update your preferences.
              </p>
            </section>

            <section className={sectionClassName}>
              <h2 className="text-2xl font-semibold text-[#003251]">Retention and security</h2>
              <p>
                We keep information for as long as it is reasonably needed to respond to
                requests, provide account features, maintain business records, and meet
                legal or operational needs. Retention periods can differ by information
                type and purpose.
              </p>
              <p>
                We use safeguards intended to protect information. No website or method
                of online storage or transmission can be guaranteed to be completely
                secure.
              </p>
            </section>

            <section className={sectionClassName}>
              <h2 className="text-2xl font-semibold text-[#003251]">Your choices and requests</h2>
              <p>
                You can update account details through your profile where those controls
                are available. You may also contact us to ask about accessing, correcting,
                or deleting information, or to change communication preferences. We will
                review and respond to requests subject to applicable requirements and
                records we need to maintain.
              </p>
            </section>

            <section className={sectionClassName}>
              <h2 className="text-2xl font-semibold text-[#003251]">Third-party services and links</h2>
              <p>
                Some pages use third-party services, including OpenStreetMap map tiles,
                and the site links to external websites. Those services and websites
                have their own privacy practices. Please review their policies when you
                use them.
              </p>
            </section>

            <section className={sectionClassName}>
              <h2 className="text-2xl font-semibold text-[#003251]">Changes and contact</h2>
              <p>
                We may update this policy as the site or our practices change. The date
                at the top of this page shows when it was last updated.
              </p>
              <p>
                For privacy questions or requests, email{" "}
                <a
                  href="mailto:management@keynovagrp.com"
                  className="font-medium text-[#003251] underline underline-offset-4"
                >
                  management@keynovagrp.com
                </a>{" "}
                or write to KeyNova Group, LLC, 270 Littleton Road #10, Westford, MA 01886.
                You can also use our{" "}
                <Link href="/contact" className="font-medium underline underline-offset-4">
                  Contact Us
                </Link>{" "}
                page.
              </p>
            </section>
          </div>
        </article>
      </main>
      <FooterPage />
    </>
  );
}
