"use client"
import React, { useRef } from "react";
import { ChevronRight } from "lucide-react";

interface TeamMember {
  id: string;
  photo: string;
  name: string;
  role: string;
}

const team: TeamMember[] = [
  {
    id: "t-1",
    photo:
      "/teams/i1.png",
    name: "Suraj Tamrakar",
    role: "Co-Founder,  Principal Broker",
  },
  {
    id: "t-2",
    photo:
      "/teams/i2.png",
    name: "Marty Conley",
    role: "Co-Founder, Managing Partner",
  },
  {
    id: "t-3",
    photo:
      "/teams/i3.png",
    name: "Brendan Conley",
    role: "Co-Founder, Managing Partner",
  },
  {
    id: "t-4",
    photo:
      "/teams/i4.png",
    name: "Marty Conley Sr.",
    role: "Co-Founder, Managing Partner",
  },
];

const TeamPage: React.FC = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollNext = () => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: node.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold text-[#003251]">The KeyNova Group</h1>

      <div className="relative mt-6">
        <div
          ref={scrollerRef}
          className="grid grid-flow-col auto-cols-[minmax(140px,1fr)] gap-6 overflow-x-auto scroll-smooth pb-2 sm:auto-cols-[calc(25%-1.125rem)] scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {team.map((member) => (
            <div key={member.id} className="flex flex-col items-center text-center">
              <div className="w-full overflow-hidden rounded-lg aspect-square">
                <img
                  src={member.photo}
                  alt={member.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#003251]">{member.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{member.role}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollNext}
          aria-label="Show more team members"
          className="absolute -right-4 top-[35%] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#003251] hover:bg-slate-100 sm:flex"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
};

export default TeamPage;