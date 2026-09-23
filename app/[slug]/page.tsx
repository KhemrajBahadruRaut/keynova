import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { notFound } from "next/navigation";

import TeamMemberImage from "@/components/pages/team/TeamMemberImage";
import { agentProfileUrl } from "@/lib/agent-domain";
import { getTeamMember } from "@/lib/team-data";

type TeamMemberPageProps = {
  params: Promise<{ slug: string }>;
};

function memberDescription(name: string, role: string, bio: string) {
  const fallback = `Learn more about ${name}${role ? `, ${role}` : ""} at KeyNova Group.`;
  const summary = bio.replace(/\s+/g, " ").trim() || fallback;

  return summary.length > 160
    ? `${summary.slice(0, 157).trimEnd()}...`
    : summary;
}

export async function generateMetadata({
  params,
}: TeamMemberPageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await getTeamMember(slug);

  if (!member) return { title: "Team Member | KeyNova Group" };

  return {
    title: `${member.name} | KeyNova Group`,
    description: memberDescription(member.name, member.role, member.bio),
  };
}

export default async function TeamMemberPage({ params }: TeamMemberPageProps) {
  const { slug } = await params;
  const member = await getTeamMember(slug);

  if (!member) notFound();

  const requestHeaders = await headers();
  const requestHost = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || undefined;

  const telephone = member.phone.replace(/[^\d+]/g, "");
  const [overview, experience] = member.bio.split(/\n\s*\nExperience\s*\n\s*\n/i, 2);

  return (
    <main className="min-h-screen bg-white px-6 pb-20 pt-32 text-[#003251] sm:pb-28 sm:pt-40 lg:px-10">
      <article className="mx-auto max-w-7xl">
        <Link
          href="/meet-the-team"
          className="inline-flex items-center gap-2 text-sm font-semibold transition hover:text-[#1c878f]"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to the team
        </Link>

        <div className="mt-9 grid items-start overflow-hidden bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[minmax(18rem,0.72fr)_1.28fr]">
          <a
            href={agentProfileUrl(member.slug, requestHost)}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-4/5 w-full overflow-hidden bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1c878f]"
            aria-label={`Open ${member.name}'s property website in a new tab`}
          >
            <TeamMemberImage
              member={member}
              eager
            />
          </a>

          <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-16 lg:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#054044]">
              KeyNova Group
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {member.name}
            </h1>
            {member.role && (
              <p className="mt-4 text-base font-medium text-slate-500 sm:text-lg">
                {member.role}
              </p>
            )}

            <div className="mt-9 h-px w-20 bg-[#1c878f]" />

            <div className="mt-8 whitespace-pre-line text-base leading-8 text-slate-600 sm:text-lg sm:leading-9">
              {overview ||
                `${member.name} is part of the KeyNova Group team. Contact us to learn more about how our team can help with your next real estate move.`}
            </div>

            {experience && (
              <section className="mt-10 border-t border-slate-200 pt-8">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1c878f]">
                  Experience
                </p>
                <div className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600">
                  {experience}
                </div>
              </section>
            )}

            {(member.email || member.phone) && (
              <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-7 text-sm font-semibold sm:flex-row sm:flex-wrap sm:gap-5">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-2 transition hover:text-[#1c878f]"
                  >
                    <Mail aria-hidden="true" className="h-4 w-4" />
                    {member.email}
                  </a>
                )}
                {member.phone && (
                  <a
                    href={`tel:${telephone}`}
                    className="inline-flex items-center gap-2 transition hover:text-[#1c878f]"
                  >
                    <Phone aria-hidden="true" className="h-4 w-4" />
                    {member.phone}
                  </a>
                )}
              </div>
            )}

            <Link
              href={`/contact?agent=${encodeURIComponent(member.slug)}`}
              className="mt-10 inline-flex w-fit items-center justify-center bg-[#003251] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#143c60]"
            >
              Start a conversation
            </Link>

            <Link
              href={`/agent/${encodeURIComponent(member.slug)}`}
              className="mt-3 inline-flex w-fit items-center justify-center border border-[#003251] px-6 py-3 text-sm font-semibold text-[#003251] transition hover:bg-[#edf5f6]"
            >
              Search homes with {member.name.split(" ")[0]}
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
