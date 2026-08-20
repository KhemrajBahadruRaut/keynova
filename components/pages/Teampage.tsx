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
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    name: "Suraj Tamrakar",
    role: "Co-Founder, Lead Agent",
  },
  {
    id: "t-2",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    name: "Marty Conley",
    role: "Co-Founder, Managing Partner",
  },
  {
    id: "t-3",
    photo:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
    name: "Brendan Conley",
    role: "Co-Founder, Managing Partner",
  },
  {
    id: "t-4",
    photo:
      "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?auto=format&fit=crop&w=400&q=80",
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
      <h1 className="text-2xl font-bold text-[#0F3D5C]">The KeyNova Group</h1>

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
              <p className="mt-3 text-sm font-semibold text-[#0F3D5C]">{member.name}</p>
              <p className="mt-0.5 text-xs text-slate-500">{member.role}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollNext}
          aria-label="Show more team members"
          className="absolute -right-4 top-[35%] hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#0F3D5C] hover:bg-slate-100 sm:flex"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </section>
  );
};

export default TeamPage;