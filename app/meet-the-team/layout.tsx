import type { ReactNode } from "react";

import Navbar from "@/components/navbar/Navbar";
import FooterPage from "@/components/pages/Footerpage";

export default function MeetTheTeamLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <FooterPage />
    </>
  );
}
