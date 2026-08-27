import Navbar from "@/components/navbar/Navbar";
import FooterPage from "@/components/pages/Footerpage";
import ListWithUs from "@/components/pages/listwithus/ListWithUs";
import { getServicePageContent } from "@/lib/page-content-data";

export default async function ListWithUsPage() {
  const content = await getServicePageContent("listwithus");

  return (
    <>
      <Navbar />
      <ListWithUs content={content} />
      <FooterPage />
    </>
  );
}
