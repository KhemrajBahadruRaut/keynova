"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, UsersRound, X } from "lucide-react";

import {
  hasValidationErrors,
  validateEmail,
  validatePhone,
  validateText,
  type ValidationErrors,
} from "@/lib/validation";

interface TeamMember {
  id: number;
  slug: string;
  name: string;
  role: string;
  photo: string | null;
  bio: string;
  email: string | null;
  phone: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MemberForm {
  name: string;
  slug: string;
  role: string;
  bio: string;
  email: string;
  phone: string;
  sort_order: string;
  is_active: boolean;
}

type ApiPayload<T = unknown> = {
  status?: string;
  message?: string;
  data?: T;
};

const LIST_ENDPOINT = "/api/admin/team/get_admin_members.php";
const CREATE_ENDPOINT = "/api/admin/team/create_member.php";
const UPDATE_ENDPOINT = "/api/admin/team/update_member.php";
const DELETE_ENDPOINT = "/api/admin/team/delete_member.php";
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");

const EMPTY_FORM: MemberForm = {
  name: "",
  slug: "",
  role: "",
  bio: "",
  email: "",
  phone: "",
  sort_order: "0",
  is_active: true,
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function memberPhotoUrl(photo: string | null) {
  if (!photo) return "";
  if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
  return `${API_BASE}/uploads/${encodeURIComponent(photo)}`;
}

async function readPayload<T>(response: Response): Promise<ApiPayload<T>> {
  try {
    return (await response.json()) as ApiPayload<T>;
  } catch {
    return { status: "error", message: "The server returned an invalid response." };
  }
}

export default function TeamAdminClient() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);
  const [slugEdited, setSlugEdited] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleUnauthorized = useCallback(() => {
    router.replace("/admin");
    router.refresh();
  }, [router]);

  const loadMembers = useCallback(async () => {
    try {
      const response = await fetch(LIST_ENDPOINT, { cache: "no-store" });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload = await readPayload<TeamMember[]>(response);
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to load team members.");
      }

      setMembers(payload.data || []);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load team members.",
      );
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadMembers(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadMembers]);

  const errors: ValidationErrors = {
    name: validateText(form.name, "Name", { required: true, max: 150 }),
    slug:
      !form.slug.trim()
        ? "URL slug is required."
        : !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)
          ? "Use lowercase letters, numbers, and single hyphens only."
          : form.slug.length > 160
            ? "URL slug must be 160 characters or fewer."
            : "",
    role: validateText(form.role, "Role", { required: true, max: 180 }),
    bio: validateText(form.bio, "Biography", { max: 20000 }),
    email: validateEmail(form.email, false),
    phone: validatePhone(form.phone, false),
    sort_order:
      !/^\d{1,4}$/.test(form.sort_order) || Number(form.sort_order) > 9999
        ? "Display order must be between 0 and 9999."
        : "",
  };

  const fieldError = (field: keyof MemberForm) =>
    submitted || touched[field] ? errors[field] || "" : "";

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingMember(null);
    setPhoto(null);
    setPhotoPreview("");
    setPhotoError("");
    setTouched({});
    setSubmitted(false);
  };

  const openCreate = () => {
    const nextOrder = members.length
      ? Math.min(9999, Math.max(...members.map((member) => member.sort_order)) + 10)
      : 0;
    setEditingMember(null);
    setForm({ ...EMPTY_FORM, sort_order: String(nextOrder) });
    setSlugEdited(false);
    setPhoto(null);
    setPhotoPreview("");
    setPhotoError("");
    setTouched({});
    setSubmitted(false);
    setNotice("");
    setShowForm(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      slug: member.slug,
      role: member.role,
      bio: member.bio || "",
      email: member.email || "",
      phone: member.phone || "",
      sort_order: String(member.sort_order),
      is_active: member.is_active,
    });
    setSlugEdited(true);
    setPhoto(null);
    setPhotoPreview("");
    setPhotoError("");
    setTouched({});
    setSubmitted(false);
    setNotice("");
    setShowForm(true);
  };

  const updateName = (name: string) => {
    setForm((current) => ({
      ...current,
      name,
      slug: slugEdited ? current.slug : slugify(name),
    }));
  };

  const updateField = (field: keyof MemberForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const markTouched = (field: keyof MemberForm) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    setPhoto(null);
    setPhotoPreview("");
    setPhotoError("");

    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(selected.type)) {
      setPhotoError("Choose a JPG, PNG, WebP, or GIF image.");
      event.target.value = "";
      return;
    }
    if (selected.size > MAX_PHOTO_BYTES) {
      setPhotoError("The photo must be 4 MB or smaller.");
      event.target.value = "";
      return;
    }
    setPhoto(selected);
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setPhotoPreview(typeof reader.result === "string" ? reader.result : "");
    });
    reader.addEventListener("error", () => setPhotoPreview(""));
    reader.readAsDataURL(selected);
  };

  const submitMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const missingCreatePhoto = !editingMember && !photo;
    if (missingCreatePhoto) setPhotoError("A team member photo is required.");
    if (hasValidationErrors(errors) || photoError || missingCreatePhoto) return;

    setSaving(true);
    setError("");
    setNotice("");

    const body = new FormData();
    if (editingMember) body.append("id", String(editingMember.id));
    body.append("name", form.name.trim());
    body.append("slug", form.slug.trim());
    body.append("role", form.role.trim());
    body.append("bio", form.bio.trim());
    body.append("email", form.email.trim());
    body.append("phone", form.phone.trim());
    body.append("sort_order", form.sort_order);
    body.append("is_active", form.is_active ? "1" : "0");
    if (photo) body.append("photo", photo);

    try {
      const response = await fetch(
        editingMember ? UPDATE_ENDPOINT : CREATE_ENDPOINT,
        { method: "POST", body },
      );
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload = await readPayload(response);
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to save the team member.");
      }

      const successMessage = editingMember
        ? "Team member updated."
        : "Team member added.";
      setShowForm(false);
      setEditingMember(null);
      setPhoto(null);
      setPhotoPreview("");
      setPhotoError("");
      setTouched({});
      setSubmitted(false);
      setNotice(successMessage);
      await loadMembers();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the team member.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (member: TeamMember) => {
    if (!window.confirm(`Delete ${member.name}? This cannot be undone.`)) return;

    setDeletingId(member.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(DELETE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id }),
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload = await readPayload(response);
      if (!response.ok || payload.status !== "success") {
        throw new Error(payload.message || "Unable to delete the team member.");
      }

      setNotice("Team member deleted.");
      await loadMembers();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the team member.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass = (field: keyof MemberForm) =>
    `mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#2f87a8]/30 ${
      fieldError(field)
        ? "border-red-300 focus:border-red-400"
        : "border-slate-200 focus:border-[#2f87a8]"
    }`;

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f7895]">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#003251] sm:text-3xl">
            Team members
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the people shown on the website and their individual profiles.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#003251] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b2e4c]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add team member
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {notice}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-[#dbe5ea] bg-white shadow-sm shadow-[#003251]/5">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading team members…</div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <UsersRound className="h-10 w-10 text-slate-300" aria-hidden="true" />
            <h2 className="mt-4 font-semibold text-[#003251]">No team members yet</h2>
            <p className="mt-1 text-sm text-slate-500">Add the first profile to publish it on the website.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((member) => {
              const imageUrl = memberPhotoUrl(member.photo);
              return (
                <article
                  key={member.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  {imageUrl ? (
                    // The image host is configured by the PHP API at runtime.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={member.name}
                      className="h-24 w-24 shrink-0 border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-slate-200 bg-slate-50">
                      <UsersRound className="h-7 w-7 text-slate-300" aria-hidden="true" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-[#003251]">{member.name}</h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          member.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {member.is_active ? "Published" : "Hidden"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{member.role}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {member.bio || "No biography has been added yet."}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      /meet-the-team/{member.slug} · display order {member.sort_order}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2 sm:self-start">
                    <button
                      type="button"
                      onClick={() => openEdit(member)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#2f87a8] hover:text-[#2f7895]"
                      aria-label={`Edit ${member.name}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMember(member)}
                      disabled={deletingId === member.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                      aria-label={`Delete ${member.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {deletingId === member.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 px-4 py-8 sm:py-12">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="team-form-title">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 id="team-form-title" className="text-lg font-semibold text-[#003251]">
                  {editingMember ? "Edit team member" : "Add team member"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">Changes appear on the public team pages.</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close team member form"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={submitMember} className="space-y-6 p-5 sm:p-6" noValidate>
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="team-name" className="text-sm font-medium text-slate-700">Name</label>
                  <input
                    id="team-name"
                    value={form.name}
                    onChange={(event) => updateName(event.target.value)}
                    onBlur={() => markTouched("name")}
                    maxLength={150}
                    className={inputClass("name")}
                    aria-invalid={Boolean(fieldError("name"))}
                  />
                  <p className="mt-1 min-h-4 text-xs text-red-600">{fieldError("name")}</p>
                </div>

                <div>
                  <label htmlFor="team-role" className="text-sm font-medium text-slate-700">Role or title</label>
                  <input
                    id="team-role"
                    value={form.role}
                    onChange={(event) => updateField("role", event.target.value)}
                    onBlur={() => markTouched("role")}
                    maxLength={180}
                    className={inputClass("role")}
                    aria-invalid={Boolean(fieldError("role"))}
                  />
                  <p className="mt-1 min-h-4 text-xs text-red-600">{fieldError("role")}</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="team-slug" className="text-sm font-medium text-slate-700">Profile URL slug</label>
                  <div className="mt-1 flex rounded-lg border border-slate-200 focus-within:border-[#2f87a8] focus-within:ring-2 focus-within:ring-[#2f87a8]/30">
                    <span className="hidden items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 sm:flex">/meet-the-team/</span>
                    <input
                      id="team-slug"
                      value={form.slug}
                      onChange={(event) => {
                        setSlugEdited(true);
                        updateField("slug", slugify(event.target.value));
                      }}
                      onBlur={() => markTouched("slug")}
                      maxLength={160}
                      className="min-w-0 flex-1 rounded-lg px-3 py-2.5 text-sm outline-none sm:rounded-l-none"
                      aria-invalid={Boolean(fieldError("slug"))}
                    />
                  </div>
                  <p className="mt-1 min-h-4 text-xs text-red-600">{fieldError("slug")}</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="team-bio" className="text-sm font-medium text-slate-700">Biography</label>
                  <textarea
                    id="team-bio"
                    value={form.bio}
                    onChange={(event) => updateField("bio", event.target.value)}
                    onBlur={() => markTouched("bio")}
                    maxLength={20000}
                    rows={7}
                    className={inputClass("bio")}
                    aria-invalid={Boolean(fieldError("bio"))}
                    placeholder="Write the profile description shown on the individual member page."
                  />
                  <div className="mt-1 flex justify-between gap-4 text-xs">
                    <span className="text-red-600">{fieldError("bio")}</span>
                    <span className="text-slate-400">{form.bio.length.toLocaleString()} / 20,000</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="team-email" className="text-sm font-medium text-slate-700">Email <span className="font-normal text-slate-400">(optional)</span></label>
                  <input
                    id="team-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    onBlur={() => markTouched("email")}
                    maxLength={254}
                    className={inputClass("email")}
                    aria-invalid={Boolean(fieldError("email"))}
                  />
                  <p className="mt-1 min-h-4 text-xs text-red-600">{fieldError("email")}</p>
                </div>

                <div>
                  <label htmlFor="team-phone" className="text-sm font-medium text-slate-700">Phone <span className="font-normal text-slate-400">(optional)</span></label>
                  <input
                    id="team-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    onBlur={() => markTouched("phone")}
                    maxLength={40}
                    className={inputClass("phone")}
                    aria-invalid={Boolean(fieldError("phone"))}
                  />
                  <p className="mt-1 min-h-4 text-xs text-red-600">{fieldError("phone")}</p>
                </div>

                <div>
                  <label htmlFor="team-order" className="text-sm font-medium text-slate-700">Display order</label>
                  <input
                    id="team-order"
                    type="number"
                    min="0"
                    max="9999"
                    step="1"
                    value={form.sort_order}
                    onChange={(event) => updateField("sort_order", event.target.value)}
                    onBlur={() => markTouched("sort_order")}
                    className={inputClass("sort_order")}
                    aria-invalid={Boolean(fieldError("sort_order"))}
                  />
                  <p className="mt-1 min-h-4 text-xs text-red-600">{fieldError("sort_order")}</p>
                  <p className="text-xs text-slate-400">Lower numbers appear first.</p>
                </div>

                <div className="flex items-start pt-6">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) => updateField("is_active", event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#003251]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-700">Publish this member</span>
                      <span className="mt-0.5 block text-xs text-slate-400">Hidden profiles remain editable in admin.</span>
                    </span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="team-photo" className="text-sm font-medium text-slate-700">
                    Photo {editingMember && <span className="font-normal text-slate-400">(leave empty to keep the current image)</span>}
                  </label>
                  <p className="mt-1 text-xs text-slate-400">JPG, PNG, WebP, or GIF. Maximum 4 MB.</p>
                  <input
                    key={`${editingMember?.id || "new"}-${showForm ? "open" : "closed"}`}
                    id="team-photo"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    onChange={handlePhoto}
                    onClick={() => setPhotoError("")}
                    className="mt-2 w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#2f7895] hover:file:bg-sky-100"
                    aria-invalid={Boolean(photoError)}
                  />
                  <p className="mt-1 min-h-4 text-xs text-red-600">{photoError}</p>
                  {(photoPreview || (editingMember && memberPhotoUrl(editingMember.photo))) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreview || memberPhotoUrl(editingMember?.photo || null)}
                      alt="Team member preview"
                      className="mt-3 h-36 w-36 border border-slate-200 object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#003251] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b2e4c] disabled:cursor-wait disabled:opacity-60"
                >
                  {saving ? "Saving…" : editingMember ? "Update member" : "Add member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
