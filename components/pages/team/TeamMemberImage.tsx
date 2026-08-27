import { teamPhotoUrl, type TeamMember } from "@/lib/team-data";

type TeamMemberImageProps = {
  member: TeamMember;
  eager?: boolean;
  className?: string;
};

export default function TeamMemberImage({
  member,
  eager = false,
  className = "",
}: TeamMemberImageProps) {
  const photo = teamPhotoUrl(member.photo);

  if (!photo) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-slate-100 text-5xl font-semibold text-[#003251] ${className}`}
        aria-label={member.name}
        role="img"
      >
        {member.name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")}
      </div>
    );
  }

  return (
    <img
      src={photo}
      alt={member.name}
      className={`h-full w-full object-cover object-top ${className}`}
      loading={eager ? "eager" : "lazy"}
    />
  );
}
