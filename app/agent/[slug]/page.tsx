import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/components/navbar/Navbar";
import AgentSearchLanding from "@/components/pages/agent/AgentSearchLanding";
import FooterPage from "@/components/pages/Footerpage";
import { agentProfileUrl } from "@/lib/agent-domain";
import { getTeamMember } from "@/lib/team-data";

type AgentLandingPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: AgentLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await getTeamMember(slug);
  if (!member) return { title: "Agent Not Found | KeyNova Group", robots: { index: false } };

  const canonical = agentProfileUrl(member.slug);
  const description = member.bio
    ? member.bio.replace(/\s+/g, " ").slice(0, 155)
    : `View ${member.name}'s profile and published properties, and connect directly with ${member.name} at KeyNova Group.`;

  return {
    title: `${member.name} | KeyNova Group`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "profile",
      url: canonical,
      siteName: "KeyNova Group",
      title: `${member.name} | KeyNova Group`,
      description,
    },
    robots: { index: true, follow: true },
  };
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
