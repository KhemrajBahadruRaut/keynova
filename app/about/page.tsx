import type { Metadata } from "next";

import Navbar from "@/components/navbar/Navbar";
import AboutSection from "@/components/pages/about/AboutSection";
import FooterPage from "@/components/pages/Footerpage";

export const metadata: Metadata = {
  title: "About KeyNova Group",
  description:
    "Meet KeyNova Group, a forward-thinking real estate brokerage serving Greater Boston, Greater Lowell, Worcester County, Southern New Hampshire, and beyond.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <AboutSection />
      </main>
      <FooterPage />
    </>
  );
}
