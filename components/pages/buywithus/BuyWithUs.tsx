import ServiceStepsPage from "@/components/pages/ServiceStepsPage";
import type { ServicePageContent } from "@/lib/page-content";

export default function BuyWithUs({
  content,
}: Readonly<{ content: ServicePageContent }>) {
  return <ServiceStepsPage content={content} />;
}
