import Navbar from "@/components/navbar/Navbar";
import FooterPage from "@/components/pages/Footerpage";
import PropertyDetailsPage from "@/components/pages/propertydetailspage/PropertyDetailspage";

interface DetailsPageProps {
  searchParams: Promise<{
    id?: string | string[];
    source?: string | string[];
  }>;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DetailsPage({ searchParams }: DetailsPageProps) {
  const query = await searchParams;
  const propertyId = firstValue(query.id);

  return (
    <div>
      <Navbar />
      <PropertyDetailsPage
        key={propertyId || "no-property"}
        propertyId={propertyId}
        source={firstValue(query.source)}
      />
      <FooterPage />
    </div>
  );
}
