import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/components/navbar/Navbar";
import AgentSearchLanding from "@/components/pages/agent/AgentSearchLanding";
import FooterPage from "@/components/pages/Footerpage";
import { getTeamMember } from "@/lib/team-data";

type AgentLandingPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: AgentLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await getTeamMember(slug);
  return member
    ? {
        title: `Search Homes with ${member.name} | KeyNova Group`,
        description: `Search available homes, save favorites, and connect directly with ${member.name} at KeyNova Group.`,
      }
    : { title: "Agent Home Search | KeyNova Group" };
}

export default async function AgentLandingPage({ params }: AgentLandingPageProps) {
  const { slug } = await params;
  const member = await getTeamMember(slug);
  if (!member) notFound();

  return (
    <>
      <Navbar />
      <AgentSearchLanding member={member} />
      <FooterPage />
    </>
  );
}
