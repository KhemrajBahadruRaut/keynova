"use client";

import Link from "next/link";
import type { SVGProps } from "react";
import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Heart,
  LoaderCircle,
  LockKeyhole,
  Ruler,
  Search,
  UserRound,
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

type PublicMember = Pick<
  TeamMember,
  "id" | "slug" | "name" | "role" | "photo" | "bio" | "email" | "phone"
>;
type Account = { name: string; email: string };
type ApiPayload = {
  status?: string;
  message?: string;
  token?: string;
  user?: Account;
  agent_slug?: string;
  saved_property_ids?: number[];
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");

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
  const storageKey = `keynova-agent-search:${member.slug}`;
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [token, setToken] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    consent: false,
  });
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
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
    if (!API_BASE) return;
    const savedToken = window.localStorage.getItem(storageKey) || "";
    if (!savedToken) return;

    fetch(`${API_BASE}/agent/actions.php`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${savedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "session" }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as ApiPayload;
        if (!response.ok || payload.status !== "success" || payload.agent_slug !== member.slug) {
          throw new Error(payload.message || "Session unavailable.");
        }
        setToken(savedToken);
        setAccount(payload.user || null);
        setSavedIds(payload.saved_property_ids || []);
      })
      .catch(() => window.localStorage.removeItem(storageKey));
  }, [member.slug, storageKey]);

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

  async function callAgentApi(body: Record<string, unknown>, bearer = token) {
    if (!API_BASE) throw new Error("The home-search service is not configured.");
    const response = await fetch(`${API_BASE}/agent/actions.php`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as ApiPayload;
    if (!response.ok || payload.status !== "success") {
      throw new Error(payload.message || "Your request could not be completed.");
    }
    return payload;
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearch = draftSearch.trim();
    setSearch(nextSearch);
    setActivityMessage("");
    if (!account || !token) {
      setActivityMessage(`Create an account or sign in so ${member.name} can help with your search.`);
      return;
    }
    try {
      await callAgentApi({ action: "search", query: nextSearch || "All available homes" });
      setActivityMessage(`Your search has been shared with ${member.name}.`);
    } catch (error) {
      setActivityMessage(error instanceof Error ? error.message : "Unable to share this search.");
    }
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthMessage("");
    try {
      const payload = await callAgentApi(
        authMode === "register"
          ? {
              action: "register",
              agent_slug: member.slug,
              name: authForm.name.trim(),
              email: authForm.email.trim(),
              phone: authForm.phone.trim(),
              password: authForm.password,
              consent: authForm.consent,
            }
          : {
              action: "login",
              agent_slug: member.slug,
              email: authForm.email.trim(),
              password: authForm.password,
            },
        "",
      );
      if (!payload.token || !payload.user) throw new Error("The server returned an invalid session.");
      window.localStorage.setItem(storageKey, payload.token);
      setToken(payload.token);
      setAccount(payload.user);
      setSavedIds(payload.saved_property_ids || []);
      setAuthForm({ name: "", email: "", phone: "", password: "", consent: false });
      setAuthMessage(
        authMode === "register"
          ? `Your account is ready and ${member.name} has been notified.`
          : `Welcome back, ${payload.user.name}.`,
      );
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function toggleSaved(property: PropertyRecord) {
    if (!account || !token) {
      setActivityMessage("Sign in or create an account before saving a home.");
      document.getElementById("search-account")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const propertyId = Number(property.id);
    const shouldSave = !savedIds.includes(propertyId);
    setSavingId(propertyId);
    setActivityMessage("");
    try {
      const payload = await callAgentApi({ action: "save", property_id: propertyId, save: shouldSave });
      setSavedIds(payload.saved_property_ids || []);
      setActivityMessage(
        shouldSave
          ? `${property.address || property.title} was saved and ${member.name} was notified.`
          : "The home was removed from your saved list.",
      );
    } catch (error) {
      setActivityMessage(error instanceof Error ? error.message : "Unable to update saved homes.");
    } finally {
      setSavingId(null);
    }
  }

  function signOut() {
    window.localStorage.removeItem(storageKey);
    setToken("");
    setAccount(null);
    setSavedIds([]);
    setAuthMessage("You have been signed out.");
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
        <div className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-[#1c878f]/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <h1 className="max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
            Real estate with
            <br />
            <span className="italic text-[#bcdfe3]">{member.name}</span>
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
            <p className="mt-2 text-sm text-red-600" role="status">
              {activityMessage}
            </p>
          )}
        </div>
      </section>

      {/* AGENT BIO — photo left, name/role/contact/socials right, bio paragraphs below that */}
      <section className="px-6 pb-4 pt-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-[260px_1fr]">
            <div className="relative aspect-4/5 w-full max-w-65 overflow-hidden rounded-md bg-slate-200 shadow-sm">
              <TeamMemberImage member={member} eager />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{member.name}</h2>
              {member.role && <p className="mt-2 text-base font-medium text-[#1c878f]">{member.role}</p>}

              {(member.phone || member.email) && (
                <div className="mt-4 space-y-1.5 text-sm">
                  {member.phone && (
                    <p>
                      <a href={`tel:${member.phone.replace(/[^+\d]/g, "")}`} className="text-[#003251] hover:text-[#1c878f]">
                        {member.phone}
                      </a>
                    </p>
                  )}
                  {member.email && (
                    <p>
                      <a href={`mailto:${member.email}`} className="text-[#1c878f] hover:underline">
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
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-[#003251] transition hover:border-[#1c878f] hover:text-[#1c878f]"
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
                    <p className="py-1 text-sm font-semibold text-[#1c878f]">{item.title}</p>
                    <div className="relative flex justify-center">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#003251]" />
                      {index !== experience.length - 1 && (
                        <span className="absolute top-4 h-[calc(100%+2rem)] w-px bg-[#1c878f]/30" />
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

      {/* LISTINGS + ACCOUNT */}
      <section id="homes" className="scroll-mt-24 px-6 pb-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Exclusive listings by {member.name.split(" ")[0]}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Browse properties represented by {member.name}.
                </p>
              </div>
              <Link href="/listing" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#1c878f] hover:underline">
                View all listings <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
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
                        <Link href={`/details?id=${property.id}&source=agent`} className="mt-2 block text-sm font-semibold text-[#003251] hover:text-[#1c878f]">
                          {property.title || property.address}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">{property.address}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-base font-semibold">{displayPrice(property.price)}</p>
                          <Link
                            href={`/contact?agent=${encodeURIComponent(member.slug)}&subject=${encodeURIComponent(`Question about ${property.address || property.title}`)}`}
                            className="text-xs font-semibold text-[#1c878f] hover:underline"
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

          {/* ACCOUNT / SAVE SEARCH — logic unchanged */}
          <aside id="search-account" className="h-fit scroll-mt-28 rounded-md border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
            {account ? (
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#003251] text-white">
                  <UserRound className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold">Welcome, {account.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your searches and saved homes are connected to {member.name}.
                </p>
                <p className="mt-5 rounded-md bg-[#edf5f6] px-4 py-3 text-sm font-medium text-[#003251]">
                  {savedIds.length} saved {savedIds.length === 1 ? "home" : "homes"}
                </p>
                <button type="button" onClick={signOut} className="mt-6 text-sm font-semibold text-slate-500 hover:text-[#1c878f]">
                  Sign out
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#003251] text-white">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Save your search</h2>
                    <p className="text-xs text-slate-500">Free KeyNova search account</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 border-b border-slate-200">
                  {(["register", "login"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setAuthMode(mode); setAuthMessage(""); }}
                      className={`border-b-2 px-2 py-2 text-sm font-semibold ${authMode === mode ? "border-[#1c878f] text-[#003251]" : "border-transparent text-slate-400"}`}
                    >
                      {mode === "register" ? "Create account" : "Sign in"}
                    </button>
                  ))}
                </div>
                <form onSubmit={submitAuth} className="mt-5 space-y-3">
                  {authMode === "register" && (
                    <>
                      <input required maxLength={150} autoComplete="name" placeholder="Name" value={authForm.name} onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#1c878f] focus:outline-none" />
                      <input required maxLength={40} autoComplete="tel" type="tel" placeholder="Phone" value={authForm.phone} onChange={(event) => setAuthForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#1c878f] focus:outline-none" />
                    </>
                  )}
                  <input required maxLength={254} autoComplete="email" type="email" placeholder="Email" value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#1c878f] focus:outline-none" />
                  <input required minLength={8} maxLength={128} autoComplete={authMode === "register" ? "new-password" : "current-password"} type="password" placeholder="Password" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#1c878f] focus:outline-none" />
                  {authMode === "register" && (
                    <label className="flex gap-2 text-xs leading-5 text-slate-600">
                      <input required type="checkbox" checked={authForm.consent} onChange={(event) => setAuthForm((current) => ({ ...current, consent: event.target.checked }))} className="mt-0.5 accent-[#003251]" />
                      I agree that KeyNova and {member.name} may contact me about my home search.
                    </label>
                  )}
                  {authMessage && <p className="text-sm leading-6 text-slate-600" role="status">{authMessage}</p>}
                  <button type="submit" disabled={authBusy} className="flex w-full items-center justify-center gap-2 rounded bg-[#003251] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {authBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    {authMode === "register" ? "Create account" : "Sign in"}
                  </button>
                </form>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
