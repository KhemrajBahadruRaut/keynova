import Navbar from "@/components/navbar/Navbar";
import BuyWithUs from "@/components/pages/buywithus/BuyWithUs";
import FooterPage from "@/components/pages/Footerpage";
import { getServicePageContent } from "@/lib/page-content-data";

export default async function BuyWithUsPage() {
  const content = await getServicePageContent("buywithus");

  return (
    <>
      <Navbar />
      <BuyWithUs content={content} />
      <FooterPage />
    </>
  );
}
