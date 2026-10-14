"use client";

import { Avatar, Button, Checkbox, Space, Tag, Typography } from "antd";
import {
  AdminTable,
  AdminButton,
  AdminCard,
  AdminDialog,
  AdminForm,
  AdminInput,
  AdminNotice as ToastNotice,
  AdminPhoneInput as PhoneInput,
  AdminTextArea,
  AdminUploadInput,
  useAdminFeedback as useFeedback,
} from "@/app/admin/dashboard/_components/AdminUI";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, UsersRound } from "lucide-react";

import ImageCropModal from "@/components/ui/ImageCropModal";

import { phoneDigits } from "@/lib/phone";

import {
  hasValidationErrors,
  validateEmail,
  validateContactPhone,
  validateName,
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
const RESERVED_ROUTES = new Set([
  "about",
  "admin",
  "agent",
  "api",
  "buywithus",
  "contact",
  "details",
  "exclusive",
  "grandliving",
  "homevaluation",
  "listing",
  "listwithus",
  "meet-the-team",
  "off-market",
  "testimonials",
]);

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
    .slice(0, 63);
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
  const { confirm } = useFeedback();
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
  const [cropFile, setCropFile] = useState<File | null>(null);
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
    name: validateName(form.name, "Name", 150),
    slug:
      !form.slug.trim()
        ? "URL slug is required."
        : !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)
          ? "Use lowercase letters, numbers, and single hyphens only."
          : form.slug.length > 63
            ? "URL slug must be 63 characters or fewer."
            : RESERVED_ROUTES.has(form.slug)
              ? "That URL is reserved. Choose another slug."
              : "",
    role: validateText(form.role, "Role", { required: true, max: 180 }),
    bio: validateText(form.bio, "Biography", { max: 20000 }),
    email: validateEmail(form.email, false),
    phone: form.phone.trim() ? validateContactPhone(form.phone) : "",
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
    setCropFile(null);
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
    setCropFile(null);
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
      phone: phoneDigits(member.phone || ""),
      sort_order: String(member.sort_order),
      is_active: member.is_active,
    });
    setSlugEdited(true);
    setPhoto(null);
    setPhotoPreview("");
    setPhotoError("");
    setCropFile(null);
    setTouched({});
    setSubmitted(false);
    setNotice("");
    setShowForm(true);
  };

  const updateName = (name: string) => {
    setTouched((current) => ({ ...current, name: true }));
    setForm((current) => ({
      ...current,
      name,
      slug: slugEdited ? current.slug : slugify(name),
    }));
  };

  const updateField = (field: keyof MemberForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const markTouched = (field: keyof MemberForm) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    event.target.value = "";
    setPhotoError("");

    if (!selected) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(selected.type)) {
      setPhotoError("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (selected.size > MAX_PHOTO_BYTES) {
      setPhotoError("The photo must be 4 MB or smaller.");
      return;
    }
    setCropFile(selected);
  };

  const handleCroppedPhoto = (croppedPhoto: File) => {
    setCropFile(null);
    setPhoto(croppedPhoto);
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setPhotoPreview(typeof reader.result === "string" ? reader.result : "");
    });
    reader.addEventListener("error", () => setPhotoPreview(""));
    reader.readAsDataURL(croppedPhoto);
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
    const confirmed = await confirm({
      title: "Delete team member?",
      message: `${member.name} will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete member",
      tone: "danger",
    });
    if (!confirmed) return;

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
    `mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-[#2f87a8]/30 ${fieldError(field)
      ? "border-red-300 focus:border-red-400"
      : "border-slate-200 focus:border-[#2f87a8]"
    }`;

  return (
    <>
      {cropFile && (
        <ImageCropModal zIndex={1200}
          file={cropFile}
          outputWidth={800}
          title="Crop the team member photo"
          freeCrop
          onCancel={() => setCropFile(null)}
          onComplete={handleCroppedPhoto}
        />
      )}
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
        <AdminButton
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#003251] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b2e4c]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add team member
        </AdminButton>
      </div>

      <ToastNotice message={error} kind="error" />
      <ToastNotice message={notice} kind="success" />

      <AdminCard className="overflow-hidden rounded-xl border border-[#dbe5ea] bg-white shadow-sm shadow-[#003251]/5">
        <AdminTable<TeamMember>
          dataSource={members}
          loading={loading}
          locale={{ emptyText: "No team members yet. Add the first profile to publish it on the website." }}
          columns={[
            {
              title: "Team member", key: "member", width: 400, render: (_, member) => <Space align="start">
                <Avatar shape="square" size={64} src={memberPhotoUrl(member.photo) || undefined} icon={<UsersRound size={24} />} />
                <div><Typography.Text strong>{member.name}</Typography.Text><p className="mt-1 text-sm text-slate-600">{member.role}</p><p className="mt-1 max-w-72 line-clamp-2 text-xs text-slate-500">{member.bio || "No biography has been added yet."}</p></div>
              </Space>
            },
            { title: "Status", key: "status", width: 130, render: (_, member) => <Tag color={member.is_active ? "success" : "default"}>{member.is_active ? "Published" : "Hidden"}</Tag> },
            { title: "Profile", key: "profile", width: 220, render: (_, member) => <div><Typography.Link href={`/${member.slug}`} target="_blank" rel="noreferrer">/{member.slug}</Typography.Link><p className="mt-1 text-xs text-slate-500">Display order {member.sort_order}</p></div> },
            {
              title: "Actions", key: "actions", width: 210, render: (_, member) => <Space>
                <Button onClick={() => openEdit(member)} icon={<Pencil size={16} />} aria-label={`Edit ${member.name}`}>Edit</Button>
                <Button danger loading={deletingId === member.id} onClick={() => deleteMember(member)} icon={<Trash2 size={16} />} aria-label={`Delete ${member.name}`}>Delete</Button>
              </Space>
            },
          ]}
        />
      </AdminCard>

      {showForm && (
        <AdminDialog title={editingMember ? "Edit team member" : "Add team member"} onClose={closeForm} busy={saving} width={800} open={!cropFile}><p className="mb-4 text-sm text-slate-500">Changes appear on the public team pages.</p>
          <AdminForm onSubmit={submitMember} className="space-y-6 p-5 sm:p-6" noValidate>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <div>
                <label htmlFor="team-name" className="text-sm font-medium text-slate-700">Name</label>
                <AdminInput
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
                <AdminInput
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
                <label htmlFor="team-slug" className="text-sm font-medium text-slate-700">Agent profile URL</label>
                <div className="mt-1 flex rounded-lg border border-slate-200 focus-within:border-[#2f87a8] focus-within:ring-2 focus-within:ring-[#2f87a8]/30">
                  <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">/</span>
                  <AdminInput
                    id="team-slug"
                    value={form.slug}
                    onChange={(event) => {
                      setSlugEdited(true);
                      updateField("slug", slugify(event.target.value));
                    }}
                    onBlur={() => markTouched("slug")}
                    maxLength={63}
                    className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none"
                    aria-invalid={Boolean(fieldError("slug"))}
                  />
                </div>
                <p className="mt-1 min-h-4 text-xs text-red-600">{fieldError("slug")}</p>
                <p className="text-xs text-slate-400">
                  Local preview: http://localhost:3000/{form.slug || "agent-slug"}
                </p>
                <p className="text-xs text-slate-400">
                  Property site: http://{form.slug || "agent-slug"}.localhost:3000
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="team-bio" className="text-sm font-medium text-slate-700">Biography</label>
                <AdminTextArea
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
                <AdminInput
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
                <PhoneInput
                  id="team-phone"
                  value={form.phone}
                  onValueChange={(value) => updateField("phone", value)}
                  onBlur={() => markTouched("phone")}
                  className={inputClass("phone")}
                  aria-invalid={Boolean(fieldError("phone"))}
                />
                <p className="mt-1 min-h-4 text-xs text-red-600">{fieldError("phone")}</p>
              </div>

              <div>
                <label htmlFor="team-order" className="text-sm font-medium text-slate-700">Display order</label>
                <AdminInput
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
                <Checkbox
                  checked={form.is_active}
                  onChange={(event) => updateField("is_active", event.target.checked)}
                  className="flex cursor-pointer items-start gap-3"
                >
                  <span>
                    <span className="block text-sm font-medium text-slate-700">Publish this member</span>
                    <span className="mt-0.5 block text-xs text-slate-400">Hidden profiles remain editable in admin.</span>
                  </span>
                </Checkbox>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="team-photo" className="text-sm font-medium text-slate-700">
                  Photo {editingMember && <span className="font-normal text-slate-400">(leave empty to keep the current image)</span>}
                </label>
                <p className="mt-1 text-xs text-slate-400">
                  JPG, PNG, WebP, or GIF. Maximum 4 MB. Choose any crop size or proportion after selecting.
                </p>
                <AdminUploadInput
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
                    className="mt-3 max-h-48 max-w-full border border-slate-200 object-contain"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <AdminButton
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </AdminButton>
              <AdminButton
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#003251] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0b2e4c] disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? "Saving…" : editingMember ? "Update member" : "Add member"}
              </AdminButton>
            </div>
          </AdminForm>
        </AdminDialog>
      )}
    </>
  );
}
