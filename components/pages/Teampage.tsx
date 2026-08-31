"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import TeamMemberImage from "@/components/pages/team/TeamMemberImage";
import { getTeamMembers, type TeamMember } from "@/lib/team-data";

function TeamCarouselSkeleton() {
  return (
    <section
      className="bg-white px-6 py-16 sm:py-20 lg:px-10"
      aria-label="Loading team members"
    >
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-3 w-48 bg-slate-200" />
        <div className="mt-4 h-9 w-64 bg-slate-200" />
        <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className={
                index === 1 ? "hidden sm:block" : index > 1 ? "hidden lg:block" : ""
              }
            >
              <div className="aspect-4/5 bg-slate-200" />
              <div className="mt-4 h-5 w-3/5 bg-slate-200" />
              <div className="mt-2 h-4 w-4/5 bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const updateScrollControls = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;

    setCanScrollBack(node.scrollLeft > 2);
    setCanScrollForward(
      node.scrollLeft + node.clientWidth < node.scrollWidth - 2,
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    getTeamMembers(controller.signal).then((members) => {
      if (isCurrent) setTeam(members);
    });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateScrollControls);
    window.addEventListener("resize", updateScrollControls);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollControls);
    };
  }, [team, updateScrollControls]);

  const scroll = (direction: -1 | 1) => {
    const node = scrollerRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction * node.clientWidth * 0.9,
      behavior: "smooth",
    });
  };

  if (team === null) return <TeamCarouselSkeleton />;
  if (team.length === 0) return null;

  return (
    <section className="bg-white px-6 py-16 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#003251] sm:text-4xl ">
              Meet the team
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              disabled={!canScrollBack}
              aria-label="Show previous team members"
              className="flex h-11 w-11 items-center justify-center border border-[#003251]/20 text-[#003251] transition hover:border-[#003251] hover:bg-[#003251] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[#003251]/20 disabled:hover:bg-transparent disabled:hover:text-[#003251]"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              disabled={!canScrollForward}
              aria-label="Show more team members"
              className="flex h-11 w-11 items-center justify-center border border-[#003251]/20 text-[#003251] transition hover:border-[#003251] hover:bg-[#003251] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[#003251]/20 disabled:hover:bg-transparent disabled:hover:text-[#003251]"
            >
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          onScroll={updateScrollControls}
          className="mt-9 grid snap-x snap-mandatory grid-flow-col auto-cols-[82%] gap-5 overflow-x-auto scroll-smooth pb-2 scrollbar-none sm:auto-cols-[calc(50%-0.625rem)] lg:auto-cols-[calc(25%-1.125rem)] [&::-webkit-scrollbar]:hidden"
        >
          {team.map((member) => (
            <article key={member.id} className="group min-w-0 snap-start">
              <Link
                href={`/meet-the-team/${member.slug}`}
                className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8862a]"
                aria-label={`View ${member.name}'s profile`}
              >
                <div className="aspect-4/5 w-full overflow-hidden bg-slate-100">
                  <TeamMemberImage
                    member={member}
                    className="transition duration-500 group-hover:scale-[1.025]"
                  />
                </div>
                <div className="border-b border-slate-200 py-4">
                  <h3 className="text-lg font-semibold text-[#003251] transition group-hover:text-[#1c878f]">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {member.role}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <Link
          href="/meet-the-team"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#003251] transition hover:text-[#1c878f]"
        >
          View the full team
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
