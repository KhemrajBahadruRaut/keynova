import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";
import FooterPage from "@/components/pages/Footerpage";
import VisitorProfilePage from "@/components/pages/profile/VisitorProfilePage";

export const metadata: Metadata = {
  title: "My Profile | Keynova Group",
  description: "Manage your Keynova visitor profile and recently viewed properties.",
};

export default function ProfilePage() {
  return (
    <div>
      <Navbar />
      <VisitorProfilePage />
      <FooterPage />
    </div>
  );
}
