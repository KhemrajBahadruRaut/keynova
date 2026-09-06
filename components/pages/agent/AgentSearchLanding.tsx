"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, Heart, LoaderCircle, LockKeyhole, Search, UserRound } from "lucide-react";

import TeamMemberImage from "@/components/pages/team/TeamMemberImage";
import {
  displayBuildingSize,
  displayPrice,
  fetchListingProperties,
  propertyUploadUrl,
  type PropertyRecord,
} from "@/lib/property-data";
import type { TeamMember } from "@/lib/team-data";

type PublicMember = Pick<TeamMember, "id" | "slug" | "name" | "role" | "photo">;
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

  useEffect(() => {
    const controller = new AbortController();
    fetchListingProperties("listing", controller.signal)
      .then((items) => setProperties(items))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPropertyError(error instanceof Error ? error.message : "Unable to load homes.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProperties(false);
      });
    return () => controller.abort();
  }, []);

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

  return (
    <main className="bg-white pt-20 text-[#003251]">
      <section className="bg-[#edf5f6] px-6 py-14 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div className="mx-auto aspect-4/5 w-full max-w-sm overflow-hidden bg-slate-200 lg:mx-0">
            <TeamMemberImage member={member} eager />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1c878f]">Your KeyNova home search</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
              Find your next home with {member.name}.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Search KeyNova&apos;s available homes, save the ones you love, and keep {member.name.split(" ")[0]} in the loop from the first click.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#homes" className="inline-flex items-center gap-2 bg-[#003251] px-6 py-3 text-sm font-semibold text-white hover:bg-[#143c60]">
                Search homes <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link href={`/contact?agent=${encodeURIComponent(member.slug)}`} className="border border-[#003251] px-6 py-3 text-sm font-semibold hover:bg-white">
                Contact {member.name.split(" ")[0]}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="homes" className="scroll-mt-24 px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1c878f]">Available homes</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Start your search</h2>
              <form onSubmit={submitSearch} className="mt-7 flex gap-2">
                <label htmlFor="agent-home-search" className="sr-only">Search by address, town, ZIP, or property type</label>
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="agent-home-search"
                    type="search"
                    value={draftSearch}
                    onChange={(event) => setDraftSearch(event.target.value)}
                    placeholder="Address, town, ZIP, or property type"
                    className="w-full border border-slate-300 py-3 pl-11 pr-4 text-sm focus:border-[#1c878f] focus:outline-none"
                  />
                </div>
                <button type="submit" className="bg-[#1c878f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#176f76]">Search</button>
              </form>
              {activityMessage && <p className="mt-3 text-sm text-slate-600" role="status">{activityMessage}</p>}

              <div className="mt-8 grid gap-7 sm:grid-cols-2">
                {loadingProperties && <p className="col-span-full py-16 text-center text-slate-500">Loading available homes...</p>}
                {!loadingProperties && propertyError && <p className="col-span-full py-16 text-center text-red-700">{propertyError}</p>}
                {!loadingProperties && !propertyError && visibleProperties.length === 0 && (
                  <p className="col-span-full py-16 text-center text-slate-500">No published homes match that search.</p>
                )}
                {!loadingProperties && !propertyError && visibleProperties.map((property) => {
                  const id = Number(property.id);
                  const saved = savedIds.includes(id);
                  const imageUrl = propertyUploadUrl(property.cover_image);
                  return (
                    <article key={property.id} className="border border-slate-200 bg-white">
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
                          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#003251] shadow-md disabled:opacity-60"
                        >
                          {savingId === id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Heart className={`h-5 w-5 ${saved ? "fill-[#1c878f] text-[#1c878f]" : ""}`} />}
                        </button>
                      </div>
                      <div className="p-5">
                        <p className="text-lg font-semibold">{displayPrice(property.price)}</p>
                        <p className="mt-1 text-sm text-slate-600">{property.address || property.title}</p>
                        <p className="mt-2 text-xs text-slate-500">{displayBuildingSize(property.building_size)}</p>
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <Link href={`/details?id=${property.id}&source=grandliving`} className="text-sm font-semibold text-[#1c878f] hover:underline">View details</Link>
                          <Link
                            href={`/contact?agent=${encodeURIComponent(member.slug)}&subject=${encodeURIComponent(`Question about ${property.address || property.title}`)}`}
                            className="text-sm font-semibold text-[#003251] hover:text-[#1c878f]"
                          >
                            Inquire
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <p className="mt-8 border-l-2 border-[#6e9cae] pl-4 text-xs leading-6 text-slate-500">
                These are listings manually published by KeyNova, not a live MLS/IDX feed. Confirm current availability, unit number, and pricing with your agent.
              </p>
            </div>

            <aside id="search-account" className="h-fit scroll-mt-28 border border-slate-200 bg-[#f8fafc] p-6 lg:sticky lg:top-28">
              {account ? (
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#003251] text-white"><UserRound className="h-5 w-5" /></div>
                  <h2 className="mt-5 text-xl font-semibold">Welcome, {account.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your searches and saved homes are connected to {member.name}.
                  </p>
                  <p className="mt-5 rounded-md bg-[#edf5f6] px-4 py-3 text-sm font-medium text-[#003251]">
                    {savedIds.length} saved {savedIds.length === 1 ? "home" : "homes"}
                  </p>
                  <button type="button" onClick={signOut} className="mt-6 text-sm font-semibold text-slate-500 hover:text-[#1c878f]">Sign out</button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#003251] text-white"><LockKeyhole className="h-5 w-5" /></div>
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
                        <input required maxLength={150} autoComplete="name" placeholder="Name" value={authForm.name} onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))} className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#1c878f] focus:outline-none" />
                        <input required maxLength={40} autoComplete="tel" type="tel" placeholder="Phone" value={authForm.phone} onChange={(event) => setAuthForm((current) => ({ ...current, phone: event.target.value }))} className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#1c878f] focus:outline-none" />
                      </>
                    )}
                    <input required maxLength={254} autoComplete="email" type="email" placeholder="Email" value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#1c878f] focus:outline-none" />
                    <input required minLength={8} maxLength={128} autoComplete={authMode === "register" ? "new-password" : "current-password"} type="password" placeholder="Password" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#1c878f] focus:outline-none" />
                    {authMode === "register" && (
                      <label className="flex gap-2 text-xs leading-5 text-slate-600">
                        <input required type="checkbox" checked={authForm.consent} onChange={(event) => setAuthForm((current) => ({ ...current, consent: event.target.checked }))} className="mt-0.5 accent-[#003251]" />
                        I agree that KeyNova and {member.name} may contact me about my home search.
                      </label>
                    )}
                    {authMessage && <p className="text-sm leading-6 text-slate-600" role="status">{authMessage}</p>}
                    <button type="submit" disabled={authBusy} className="flex w-full items-center justify-center gap-2 bg-[#003251] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                      {authBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}
                      {authMode === "register" ? "Create account" : "Sign in"}
                    </button>
                  </form>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
