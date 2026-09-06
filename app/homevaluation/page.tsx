import type { Metadata } from "next";

import Navbar from "@/components/navbar/Navbar";
import FooterPage from "@/components/pages/Footerpage";
import HomeValuation from "@/components/pages/homevaluation/Homevaluation";
import { getHomeValuationContent } from "@/lib/home-valuation-data";

export const metadata: Metadata = {
  title: "Home Valuation | KeyNova Group",
  description: "Request a personalized home valuation from the KeyNova Group team.",
};

export default async function HomeValuationPage() {
  const content = await getHomeValuationContent();

  return (
    <>
      <Navbar />
      <HomeValuation content={content} />
      <FooterPage />
    </>
  );
}
