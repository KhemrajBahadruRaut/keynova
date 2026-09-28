"use client";

import Link from "next/link";
import type { SVGProps } from "react";
import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Heart,
  LoaderCircle,
  Ruler,
  Search,
} from "lucide-react";

import TeamMemberImage from "@/components/pages/team/TeamMemberImage";
import {
  displayBuildingSize,
  displayPrice,
  fetchAgentProperties,
  propertyUploadUrl,
  type PropertyRecord,
} from "@/lib/property-data";
import type { TeamMember } from "@/lib/team-data";
import {
  clearPropertyAccess,
  PROPERTY_ACCESS_CHANGED_EVENT,
  readPropertyAccess,
  type StoredPropertyAccess,
} from "@/lib/property-access";
import {
  fetchVisitorProfile,
  toggleVisitorSavedHome,
  VisitorAccountError,
} from "@/lib/visitor-account";

type PublicMember = Pick<
  TeamMember,
  "id" | "slug" | "name" | "role" | "photo" | "bio" | "email" | "phone"
>;
type AgentExperience = {
  title: string;
  description: string;
};

function parseAgentBio(value: string): {
  overview: string;
  experience: AgentExperience[];
} {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return { overview: "", experience: [] };

  const sections = normalized.split(/\n\s*\nExperience\s*\n\s*\n/i);
  const overview = sections.shift()?.trim() || "";
  const experienceText = sections.join("\n\n").trim();
  if (!experienceText) return { overview, experience: [] };

  const experience = experienceText
    .split(/(?:\n\s*\n)+|\n(?=[^\n]+\s(?:-|–|—|:)\s)/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const match = entry.match(/^(.+?)\s+(?:-|–|—|:)\s+([\s\S]+)$/);
      if (!match) {
        return [{ title: "Professional Experience", description: entry }];
      }

      const title = match[1].trim();
      const description = match[2].trim();
      return title && description ? [{ title, description }] : [];
    });

  return { overview, experience };
}

// lucide-react dropped brand icons in v1 (see lucide.dev/guide/react/migration),
// so these are small inline SVGs instead.
function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7.6h2.55l.38-2.96h-2.93V8.56c0-.86.24-1.44 1.47-1.44h1.57V4.47C16.2 4.4 15.3 4.32 14.24 4.32c-2.2 0-3.71 1.34-3.71 3.8v2.32H7.97v2.96h2.56V21h2.97Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.94 8.5H3.56V20.5h3.38V8.5ZM5.25 3.25a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.44 20.5h-3.37v-6.3c0-1.5-.03-3.44-2.1-3.44-2.1 0-2.42 1.64-2.42 3.33v6.41H9.18V8.5h3.24v1.64h.05c.45-.85 1.55-1.75 3.19-1.75 3.42 0 4.78 2.16 4.78 5.66v6.45Z" />
    </svg>
  );
}

export default function AgentSearchLanding({ member }: Readonly<{ member: PublicMember }>) {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [access, setAccess] = useState<StoredPropertyAccess | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [activityMessage, setActivityMessage] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const { overview, experience } = useMemo(
    () => parseAgentBio(member.bio),
    [member.bio],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchAgentProperties(member.slug, controller.signal)
      .then((items) => setProperties(items))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPropertyError(error instanceof Error ? error.message : "Unable to load homes.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProperties(false);
      });
    return () => controller.abort();
  }, [member.slug]);

  useEffect(() => {
    let active = true;

    const syncProfile = () => {
      const savedAccess = readPropertyAccess();
      setAccess(savedAccess);
      if (!savedAccess) {
        setSavedIds([]);
        return;
      }

      fetchVisitorProfile(savedAccess.token)
        .then((profile) => {
          if (active) setSavedIds((profile.saved_homes || []).map((home) => home.id));
        })
        .catch((error: unknown) => {
          if (!active) return;
          if (error instanceof VisitorAccountError && error.status === 401) {
            clearPropertyAccess();
            setAccess(null);
            setSavedIds([]);
          }
        });
    };

    syncProfile();
    window.addEventListener(PROPERTY_ACCESS_CHANGED_EVENT, syncProfile);
    window.addEventListener("storage", syncProfile);
    return () => {
      active = false;
      window.removeEventListener(PROPERTY_ACCESS_CHANGED_EVENT, syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  const visibleProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return properties;
    return properties.filter((property) =>
      [property.title, property.address, property.property_type]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [properties, search]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(draftSearch.trim());
    setActivityMessage("");
  }

  async function toggleSaved(property: PropertyRecord) {
    const currentAccess = readPropertyAccess();
    if (!currentAccess) {
      setAccess(null);
      setActivityMessage("Sign in to your profile before saving a home.");
      return;
    }
    const propertyId = Number(property.id);
    const shouldSave = !savedIds.includes(propertyId);
    setSavingId(propertyId);
    setActivityMessage("");
    try {
      const nextSavedIds = await toggleVisitorSavedHome(
        currentAccess.token,
        propertyId,
        shouldSave,
      );
      setAccess(currentAccess);
      setSavedIds(nextSavedIds);
      setActivityMessage(
        shouldSave
          ? `${property.address || property.title} was saved to your profile.`
          : "The home was removed from Saved Homes.",
      );
    } catch (error) {
      if (error instanceof VisitorAccountError && error.status === 401) {
        clearPropertyAccess();
        setAccess(null);
        setSavedIds([]);
        setActivityMessage("Your session expired. Sign in to your profile to save homes.");
        return;
      }
      setActivityMessage(error instanceof Error ? error.message : "Unable to update saved homes.");
    } finally {
      setSavingId(null);
    }
  }

  // TODO: wire these to real profile URLs once social links are part of member data.
  const socialLinks = [
    { label: "Facebook", icon: FacebookIcon, href: "#" },
    { label: "Instagram", icon: InstagramIcon, href: "#" },
    { label: "LinkedIn", icon: LinkedinIcon, href: "#" },
  ];

  return (
    <main className="bg-[#f6f9fa] pt-20 text-[#003251]">
      {/* HERO — headline + contact, with the search bar overlapping the bottom edge */}
      <section className="relative overflow-hidden bg-[#003251] px-6 pb-16 pt-16 text-white sm:pt-20 lg:px-10">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full border border-white/10" />

        <div className="relative mx-auto max-w-7xl">
          <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
            Real estate with
            <br />
            <span className="italic text-[#ffffff]">{member.name}</span>
          </h1>
          <Link
            href={`/contact?agent=${encodeURIComponent(member.slug)}`}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#003251] transition hover:bg-[#edf5f6]"
          >
            Contact
          </Link>
        </div>

        {/* search bar, sits half on the hero / half on the page background below */}
        <div className="relative z-10 mx-auto mt-5 max-w-7xl">
          <form
            onSubmit={submitSearch}
            className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-lg sm:flex-row sm:items-center"
          >
            <label htmlFor="agent-home-search" className="sr-only">
              Search by address, town, ZIP, or property type
            </label>
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="agent-home-search"
                type="search"
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Search by address, town, ZIP, or property type..."
                className="w-full rounded border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-[#003251] focus:border-[#1c878f] focus:outline-none"
              />
            </div>
            <button type="submit" className="rounded bg-[#003251] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#164765]">
              Search
            </button>
          </form>
          {activityMessage && (
            <div
              className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600"
              role="status"
            >
              <span>{activityMessage}</span>
              {!access && (
                <Link
                  href="/profile"
                  className="font-semibold text-[#003251] underline underline-offset-4"
                >
                  Sign in
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* AGENT BIO — photo left, name/role/contact/socials right, bio paragraphs below that */}
      <section className="px-6 pb-4 pt-10 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-[260px_1fr]">
            <div className="relative aspect-4/5 w-full max-w-65 overflow-hidden rounded-md bg-slate-200 shadow-sm">
              <TeamMemberImage member={member} eager />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{member.name}</h2>
              {member.role && <p className="mt-2 text-base font-medium text-[#003251]">{member.role}</p>}

              {(member.phone || member.email) && (
                <div className="mt-4 space-y-1.5 text-sm">
                  {member.phone && (
                    <p>
                      <a href={`tel:${member.phone.replace(/[^+\d]/g, "")}`} className="text-[#003251] hover:underline hover:underline-offset-4">
                        {member.phone}
                      </a>
                    </p>
                  )}
                  {member.email && (
                    <p>
                      <a href={`mailto:${member.email}`} className="text-[#003251] hover:underline">
                        {member.email}
                      </a>
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {socialLinks.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[#003251] transition hover:border-[#003251]"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>

              {overview && (
                <div className="mt-5 max-w-2xl space-y-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {overview}
                </div>
              )}
            </div>
          </div>

          {/* Experience entries come only from the API-managed member biography. */}
          {experience.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold">Experience</h3>
              <div className="mt-8 grid grid-cols-[minmax(0,180px)_20px_1fr] gap-x-4 sm:grid-cols-[220px_20px_1fr] sm:gap-x-6">
                {experience.map((item, index) => (
                  <Fragment key={`${item.title}-${index}`}>
                    <p className="py-1 text-sm font-semibold text-[#003251]">{item.title}</p>
                    <div className="relative flex justify-center">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#003251]" />
                      {index !== experience.length - 1 && (
                        <span className="absolute top-4 h-[calc(100%+2rem)] w-px bg-[#9e9e9e]" />
                      )}
                    </div>
                    <p className="pb-8 text-sm leading-6 text-slate-600">{item.description}</p>
                  </Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* LISTINGS */}
      <section id="homes" className="scroll-mt-24 px-6 pb-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Exclusive listings by {member.name.split(" ")[0]}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Browse properties represented by {member.name}.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#003251] hover:underline"
                >
                  {access
                    ? `${savedIds.length} Saved ${savedIds.length === 1 ? "Home" : "Homes"}`
                    : "Sign in to save homes"}
                  <Heart className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/listing" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#003251] hover:underline">
                  View all listings <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loadingProperties && <p className="col-span-full py-16 text-center text-slate-500">Loading available homes...</p>}
              {!loadingProperties && propertyError && <p className="col-span-full py-16 text-center text-red-700">{propertyError}</p>}
              {!loadingProperties && !propertyError && visibleProperties.length === 0 && (
                <p className="col-span-full py-16 text-center text-slate-500">No published homes match that search.</p>
              )}
              {!loadingProperties &&
                !propertyError &&
                visibleProperties.map((property) => {
                  const id = Number(property.id);
                  const saved = savedIds.includes(id);
                  const imageUrl = propertyUploadUrl(property.cover_image);
                  return (
                    <article key={property.id} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                        {imageUrl ? (
                          <img src={imageUrl} alt={property.title || property.address} loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-slate-400">No image available</div>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleSaved(property)}
                          disabled={savingId === id}
                          aria-label={saved ? "Remove saved home" : "Save this home"}
                          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#003251] shadow disabled:opacity-60"
                        >
                          {savingId === id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${saved ? "fill-[#1c878f] text-[#1c878f]" : ""}`} />}
                        </button>
                      </div>
                      <div className="p-4">
                        {property.building_size && (
                          <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                            {displayBuildingSize(property.building_size)}
                          </p>
                        )}
                        <Link href={`/details?id=${property.id}&source=agent`} className="mt-2 block text-sm font-semibold text-[#003251] hover:underline hover:underline-offset-4">
                          {property.title || property.address}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{property.address}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-base font-semibold">{displayPrice(property.price)}</p>
                          <Link
                            href={`/contact?agent=${encodeURIComponent(member.slug)}&subject=${encodeURIComponent(`Question about ${property.address || property.title}`)}`}
                            className="text-xs font-semibold text-[#003251] hover:underline"
                          >
                            Inquire
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
          </div>
        </div>
      </section>
    </main>
  );
}
