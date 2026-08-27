import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import TeamMemberImage from "@/components/pages/team/TeamMemberImage";
import { getTeamMembers } from "@/lib/team-data";

export const metadata: Metadata = {
  title: "Meet the Team | KeyNova Group",
  description:
    "Meet the real estate professionals behind KeyNova Group and learn more about their experience and approach.",
};

export default async function MeetTheTeamPage() {
  const members = await getTeamMembers();

  return (
    <main className="bg-white text-[#003251]">
      <section className="relative overflow-hidden bg-[#003251] px-6 pb-20 pt-36 text-white sm:pb-24 sm:pt-44 lg:px-10">
        <div className="absolute -right-32 top-16 h-96 w-96 border border-white/10" />
        <div className="absolute -bottom-24 left-0 h-48 w-2/5 bg-linear-to-r from-[#c8862a]/20 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#bacdd3]">
            Meet the team
          </p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-20">
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Expertise with a personal point of view.
            </h1>
            <p className="max-w-xl text-base leading-8 text-white/75 sm:text-lg">
              Get to know the people who bring market knowledge, thoughtful
              strategy, and a shared commitment to every KeyNova relationship.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                The KeyNova Group
              </h2>
            </div>
            {members.length > 0 && (
              <p className="text-sm text-slate-500">
                {members.length} {members.length === 1 ? "team member" : "team members"}
              </p>
            )}
          </div>

          {members.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {members.map((member) => (
                <article key={member.id} className="group min-w-0">
                  <Link
                    href={`/meet-the-team/${member.slug}`}
                    className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8862a]"
                    aria-label={`Read more about ${member.name}`}
                  >
                    <div className="aspect-4/5 overflow-hidden bg-slate-100">
                      <TeamMemberImage
                        member={member}
                        className="transition duration-500 group-hover:scale-[1.025]"
                      />
                    </div>
                    <div className="border-b border-slate-200 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold transition group-hover:text-[#1c878f]">
                            {member.name}
                          </h3>
                          {member.role && (
                            <p className="mt-1.5 text-sm leading-6 text-slate-500">
                              {member.role}
                            </p>
                          )}
                        </div>
                        <ArrowRight
                          aria-hidden="true"
                          className="mt-1 h-4 w-4 shrink-0 text-[#1c878f] transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <h3 className="text-xl font-semibold">Team profiles are coming soon.</h3>
              <p className="mt-2 text-slate-600">
                Please check back as we add our professionals to this page.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
