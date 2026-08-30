import type { Metadata } from "next";

import Navbar from "@/components/navbar/Navbar";
import FooterPage from "@/components/pages/Footerpage";
import Testimonials from "@/components/pages/testimonials/Testimonials";

export const metadata: Metadata = {
  title: "Client Testimonials | KeyNova Group",
  description:
    "Read testimonials from KeyNova Group buyers, sellers, and investors, or share your own experience.",
};

export default function TestimonialsPage() {
  return (
    <>
      <Navbar />
      <main>
        <Testimonials />
      </main>
      <FooterPage />
    </>
  );
}
