type NamedMember = { name: string };

/**
 * Keep the four manually ranked profiles in place and alphabetize the rest.
 * The caller supplies the ranking field because the public and admin APIs use
 * different property names for it.
 */
export function orderTeamMembers<T extends NamedMember>(
  members: T[],
  getPriority: (member: T) => number,
): T[] {
  const ranked = [...members].sort(
    (a, b) => getPriority(a) - getPriority(b) || a.name.localeCompare(b.name),
  );

  return [
    ...ranked.slice(0, 4),
    ...ranked
      .slice(4)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
  ];
}
