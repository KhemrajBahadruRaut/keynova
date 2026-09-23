import Image, { getImageProps } from "next/image";

import { teamPhotoUrl, type TeamMember } from "@/lib/team-data";

type TeamMemberImageProps = {
  member: Pick<TeamMember, "name" | "photo">;
  eager?: boolean;
  className?: string;
  variant?: "card" | "profile";
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";

export default function TeamMemberImage({
  member,
  eager = false,
  className = "",
  variant = "profile",
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

  const optimizable = photo.startsWith("/teams/") ||
    (API_BASE !== "" && photo.startsWith(`${API_BASE}/uploads/`));
  const uploadPrefix = `${API_BASE}/uploads/`;
  const uploadFilename = photo.startsWith(uploadPrefix)
    ? photo.slice(uploadPrefix.length)
    : "";
  const isCardUpload = variant === "card" &&
    /^team_[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(uploadFilename);
  // Use one 1200px optimized source at every zoom level. A responsive srcset
  // swaps sources during browser zoom and can leave portraits looking uneven.
  const displayPhoto = isCardUpload
    ? `/api/team-thumbnail/${uploadFilename}`
    : optimizable
      ? getImageProps({ src: photo, alt: member.name, width: 600, height: 750, quality: 90 }).props.src
      : photo;

  return (
    <Image
      src={displayPhoto}
      alt={member.name}
      fill
      unoptimized
      className={`object-cover object-top ${className}`}
      loading={eager ? "eager" : "lazy"}
    />
  );
}
