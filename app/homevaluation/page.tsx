import Navbar from "@/components/navbar/Navbar";
import FooterPage from "@/components/pages/Footerpage";
import HomeValuation from "@/components/pages/homevaluation/Homevaluation";
import { getHomeValuationContent } from "@/lib/home-valuation-data";

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
