"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { ToastNotice } from "@/components/ui/FeedbackProvider";
import ImageCropModal from "@/components/ui/ImageCropModal";
import {
  ArrowRight,
  Camera,
  ChevronDown,
  Clock,
  Heart,
  History,
  Home,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Shield,
  Send,
  User,
} from "lucide-react";
import {
  clearPropertyAccess,
  readPropertyAccess,
  savePropertyAccess,
  type PropertyAccessVisitor,
  type StoredPropertyAccess,
} from "@/lib/property-access";
import { displayPrice, propertyUploadUrl } from "@/lib/property-data";
import {
  changeVisitorPassword,
  fetchVisitorProfile,
  loginVisitor,
  logoutVisitor,
  requestVisitorEmailChange,
  toggleVisitorSavedHome,
  updateVisitorProfile,
  uploadVisitorProfileImage,
  verifyVisitorEmailChange,
  VisitorAccountError,
  type VisitorProfile,
} from "@/lib/visitor-account";
import {
  validateEmail,
  validatePhone,
  validateText,
  validateVerificationCode,
} from "@/lib/validation";

type Notice = { kind: "success" | "error"; message: string } | null;

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function FieldError({ children }: { children?: string }) {
  return children ? <p className="mt-1.5 text-xs text-red-600">{children}</p> : null;
}

function NoticeBox({ notice }: { notice: Notice }) {
  return <ToastNotice message={notice?.message} kind={notice?.kind || "info"} />;
}

function ProfileAccordion({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const contentId = `profile-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="flex items-center gap-2 text-base font-semibold text-[#003251]">
          {icon}
          {title}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[#003251]">
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-500 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>

      <div
        id={contentId}
        aria-hidden={!open}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
          open
            ? "grid-rows-[1fr] opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pt-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function VisitorProfilePage() {
  const [access, setAccess] = useState<StoredPropertyAccess | null>(null);
  const [profile, setProfile] = useState<VisitorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginNotice, setLoginNotice] = useState<Notice>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<Notice>(null);
  const [profileCropFile, setProfileCropFile] = useState<File | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const saved = readPropertyAccess();
      setAccess(saved);
      if (!saved) {
        setLoading(false);
        return;
      }

      fetchVisitorProfile(saved.token)
        .then((data) => {
          if (active) setProfile(data);
        })
        .catch((error: unknown) => {
          if (!active) return;
          if (error instanceof VisitorAccountError && error.status === 401) {
            clearPropertyAccess();
            setAccess(null);
          } else {
            setLoginNotice({ kind: "error", message: messageFrom(error) });
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailError = validateEmail(loginEmail);
    if (emailError || !loginPassword) {
      setLoginNotice({
        kind: "error",
        message: emailError || "Password is required.",
      });
      return;
    }

    setLoginBusy(true);
    setLoginNotice(null);
    try {
      const nextAccess = await loginVisitor(loginEmail.trim(), loginPassword);
      savePropertyAccess(nextAccess);
      setAccess(nextAccess);
      const nextProfile = await fetchVisitorProfile(nextAccess.token);
      setProfile(nextProfile);
      setLoginPassword("");
    } catch (error) {
      setLoginNotice({ kind: "error", message: messageFrom(error) });
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    if (access) {
      try {
        await logoutVisitor(access.token);
      } catch {
        // The browser session is still cleared if the server is unavailable.
      }
    }
    clearPropertyAccess();
    setAccess(null);
    setProfile(null);
    setLoginNotice({ kind: "success", message: "You have been signed out." });
  }

  function syncVisitor(visitor: PropertyAccessVisitor) {
    setProfile((current) => (current ? { ...current, visitor } : current));
    if (!access) return;

    const nextAccess = { ...access, visitor };
    setAccess(nextAccess);
    savePropertyAccess(nextAccess);
  }

  function handleProfileImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !access) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoNotice({ kind: "error", message: "Choose a JPG, PNG, or WebP image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoNotice({ kind: "error", message: "The profile image must be 5 MB or smaller." });
      return;
    }

    setPhotoNotice(null);
    setProfileCropFile(file);
  }

  async function uploadCroppedProfileImage(file: File) {
    if (!access) return;
    setProfileCropFile(null);
    setPhotoBusy(true);
    setPhotoNotice(null);
    try {
      const visitor = await uploadVisitorProfileImage(access.token, file);
      syncVisitor(visitor);
      setPhotoNotice({ kind: "success", message: "Profile image updated." });
    } catch (error) {
      setPhotoNotice({ kind: "error", message: messageFrom(error) });
    } finally {
      setPhotoBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-6 pt-28">
        <div className="flex items-center gap-3 text-[#003251]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-semibold">Loading your profile…</span>
        </div>
      </main>
    );
  }

  if (!access || !profile) {
    return (
      <main className="min-h-screen bg-[#f4f7f8] px-5 pb-16 pt-28 sm:px-8">
        <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="bg-[#003251] px-7 py-10 text-white sm:px-10 lg:py-14">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <User className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
              Your Keynova account
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">Welcome back.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
              When you verify your email to view a property, you will create a password and your
              profile will be opened automatically. Return here to manage it from any device.
            </p>
            <Link
              href="/listing"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2.5 text-sm font-semibold transition hover:bg-white hover:text-[#003251]"
            >
              Browse properties <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          <section className="px-7 py-10 sm:px-10 lg:py-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#003251]/55">
              Returning visitor
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#003251]">Sign in to your profile</h2>
            <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
              <label className="block text-sm font-semibold text-slate-700">
                Email address
                <span className="mt-2 flex items-center rounded-xl border border-slate-300 bg-white px-3 focus-within:border-[#003251]">
                  <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    className="w-full bg-transparent px-3 py-2.5 font-normal outline-none"
                    placeholder="you@example.com"
                  />
                </span>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Password
                <span className="mt-2 flex items-center rounded-xl border border-slate-300 bg-white px-3 focus-within:border-[#003251]">
                  <Lock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    className="w-full bg-transparent px-3 py-2.5 font-normal outline-none"
                    placeholder="Your password"
                  />
                </span>
              </label>
              <NoticeBox notice={loginNotice} />
              <button
                type="submit"
                disabled={loginBusy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#003251] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#004b78] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Sign in
              </button>
            </form>
            <p className="mt-6 text-xs leading-5 text-slate-500">
              Don&apos;t have a profile yet? Open any property, verify your email, and create your
              password when prompted. Your profile will then be ready automatically.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const profileImageUrl = propertyUploadUrl(profile.visitor.profile_image);

  return (
    <main className="min-h-screen bg-[#f4f7f8] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      {profileCropFile && (
        <ImageCropModal
          file={profileCropFile}
          aspect={1}
          outputWidth={800}
          title="Crop your profile image"
          circularPreview
          onCancel={() => setProfileCropFile(null)}
          onComplete={uploadCroppedProfileImage}
        />
      )}
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-3xl bg-[#003251] px-5 py-6 text-white shadow-xl shadow-[#003251]/10 sm:px-7 md:flex md:items-center md:justify-between md:gap-6">
          <div className="relative flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <div
                role={profileImageUrl ? "img" : undefined}
                aria-label={profileImageUrl ? `${profile.visitor.name}'s profile` : undefined}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white bg-cover bg-center text-lg font-bold text-[#003251] ring-4 ring-white/10"
                style={
                  profileImageUrl ? { backgroundImage: `url("${profileImageUrl}")` } : undefined
                }
              >
                {!profileImageUrl &&
                  (profile.visitor.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase() || "K")}
              </div>
              <label
                className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#003251] bg-white text-[#003251] shadow-md transition hover:bg-slate-100 ${
                  photoBusy || profileCropFile
                    ? "cursor-wait opacity-70"
                    : "cursor-pointer"
                }`}
                title="Upload profile image"
              >
                {photoBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span className="sr-only">Upload profile image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={photoBusy || Boolean(profileCropFile)}
                  onChange={handleProfileImage}
                  className="sr-only"
                />
              </label>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em]">My account</p>
              <h1 className="mt-1 text-xl font-semibold sm:text-2xl">{profile.visitor.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/65">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" /> Verified visitor
              </p>
              <NoticeBox notice={photoNotice} />
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="relative mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-white/20  px-4 py-2.5 text-sm font-semibold transition hover:bg-white hover:text-[#003251] md:mt-0"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.82fr_1.5fr]">
          <div className="space-y-6">
            <PersonalDetails
              access={access}
              visitor={profile.visitor}
              onVisitorChange={syncVisitor}
            />
            <AccountSecurity
              access={access}
              profile={profile}
              onVisitorChange={syncVisitor}
              onPasswordCreated={() =>
                setProfile((current) => (current ? { ...current, has_password: true } : current))
              }
            />
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold text-[#003251]">
                <Clock className="h-4.5 w-4.5" aria-hidden="true" /> Account status
              </h2>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Member since</dt>
                  <dd className="mt-1 font-semibold text-slate-800">{formatDate(profile.member_since)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Session expires</dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {formatDate(profile.session_expires_at)}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <div className="space-y-6">
            <SavedHomes
              access={access}
              homes={profile.saved_homes || []}
              onHomesChange={(savedHomes) =>
                setProfile((current) =>
                  current ? { ...current, saved_homes: savedHomes } : current,
                )
              }
            />
            <VisitHistory history={profile.history} />
            <InquiryHistory inquiries={profile.inquiries || []} />
          </div>
        </div>
      </div>
    </main>
  );
}

function PersonalDetails({
  access,
  visitor,
  onVisitorChange,
}: {
  access: StoredPropertyAccess;
  visitor: PropertyAccessVisitor;
  onVisitorChange: (visitor: PropertyAccessVisitor) => void;
}) {
  const [name, setName] = useState(visitor.name);
  const [phone, setPhone] = useState(visitor.phone);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [errors, setErrors] = useState({ name: "", phone: "" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      name: validateText(name, "Name", { required: true, min: 2, max: 150 }),
      phone: validatePhone(phone, true),
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.phone) return;

    setBusy(true);
    setNotice(null);
    try {
      const nextVisitor = await updateVisitorProfile(access.token, { name: name.trim(), phone });
      onVisitorChange(nextVisitor);
      setNotice({ kind: "success", message: "Your personal details were updated." });
    } catch (error) {
      setNotice({ kind: "error", message: messageFrom(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProfileAccordion
      title="Personal details"
      icon={<User className="h-5 w-5" aria-hidden="true" />}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <label className="block text-sm font-semibold text-slate-700">
          Full name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#003251]"
          />
          <FieldError>{errors.name}</FieldError>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Phone number
          <span className="mt-2 flex items-center rounded-xl border border-slate-300 px-3 focus-within:border-[#003251]">
            <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              className="w-full px-3 py-2.5 font-normal outline-none"
            />
          </span>
          <FieldError>{errors.phone}</FieldError>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Verified email
          <span className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500">
            <Mail className="h-4 w-4" aria-hidden="true" />
            <input
              value={visitor.email}
              readOnly
              className="w-full bg-transparent px-3 py-2.5 font-normal outline-none"
            />
          </span>
        </label>
        <NoticeBox notice={notice} />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-[#003251] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#004b78] disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Save details
        </button>
      </form>
    </ProfileAccordion>
  );
}

function AccountSecurity({
  access,
  profile,
  onVisitorChange,
  onPasswordCreated,
}: {
  access: StoredPropertyAccess;
  profile: VisitorProfile;
  onVisitorChange: (visitor: PropertyAccessVisitor) => void;
  onPasswordCreated: () => void;
}) {
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailNotice, setEmailNotice] = useState<Notice>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);

  async function sendEmailCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateEmail(newEmail);
    if (validation) {
      setEmailNotice({ kind: "error", message: validation });
      return;
    }
    if (newEmail.trim().toLowerCase() === profile.visitor.email.toLowerCase()) {
      setEmailNotice({ kind: "error", message: "Enter a different email address." });
      return;
    }
    setEmailBusy(true);
    setEmailNotice(null);
    try {
      const message = await requestVisitorEmailChange(access.token, newEmail.trim());
      setCodeSent(true);
      setEmailNotice({ kind: "success", message });
    } catch (error) {
      setEmailNotice({ kind: "error", message: messageFrom(error) });
    } finally {
      setEmailBusy(false);
    }
  }

  async function verifyEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateVerificationCode(emailCode);
    if (validation) {
      setEmailNotice({ kind: "error", message: validation });
      return;
    }
    setEmailBusy(true);
    setEmailNotice(null);
    try {
      const visitor = await verifyVisitorEmailChange(access.token, emailCode);
      onVisitorChange(visitor);
      setNewEmail("");
      setEmailCode("");
      setCodeSent(false);
      setEmailNotice({ kind: "success", message: "Your email address was changed." });
    } catch (error) {
      setEmailNotice({ kind: "error", message: messageFrom(error) });
    } finally {
      setEmailBusy(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profile.has_password && !currentPassword) {
      setPasswordNotice({ kind: "error", message: "Enter your current password." });
      return;
    }
    if (newPassword.length < 10 || newPassword.length > 128) {
      setPasswordNotice({
        kind: "error",
        message: "Your new password must be between 10 and 128 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ kind: "error", message: "The new passwords do not match." });
      return;
    }
    setPasswordBusy(true);
    setPasswordNotice(null);
    try {
      const message = await changeVisitorPassword(access.token, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onPasswordCreated();
      setPasswordNotice({ kind: "success", message });
    } catch (error) {
      setPasswordNotice({ kind: "error", message: messageFrom(error) });
    } finally {
      setPasswordBusy(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#003251]";

  return (
    <ProfileAccordion
      title="Account security"
      icon={<KeyRound className="h-5 w-5" aria-hidden="true" />}
    >
      <div className="border-b border-slate-200 pb-6">
        <h3 className="text-sm font-bold text-slate-800">Change email</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          We will send a six-digit verification code to the new address.
        </p>
        {!codeSent ? (
          <form onSubmit={sendEmailCode} className="mt-4" noValidate>
            <label className="block text-sm font-semibold text-slate-700">
              New email address
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                autoComplete="email"
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={emailBusy}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#003251] px-4 py-2.5 text-sm font-bold text-[#003251] transition hover:bg-[#003251] hover:text-white disabled:opacity-60"
            >
              {emailBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Send verification code
            </button>
          </form>
        ) : (
          <form onSubmit={verifyEmail} className="mt-4" noValidate>
            <label className="block text-sm font-semibold text-slate-700">
              Verification code sent to {newEmail}
              <input
                inputMode="numeric"
                maxLength={6}
                value={emailCode}
                onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, ""))}
                className={`${inputClass} tracking-[0.35em]`}
                placeholder="000000"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={emailBusy}
                className="inline-flex items-center gap-2 rounded-xl bg-[#003251] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {emailBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Verify and change
              </button>
              <button
                type="button"
                onClick={() => {
                  setCodeSent(false);
                  setEmailCode("");
                  setEmailNotice(null);
                }}
                className="px-3 py-2.5 text-sm font-semibold text-slate-600"
              >
                Use another email
              </button>
            </div>
          </form>
        )}
        <div className="mt-4">
          <NoticeBox notice={emailNotice} />
        </div>
      </div>

      <form onSubmit={savePassword} className="mt-6 space-y-4" noValidate>
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            {profile.has_password ? "Change password" : "Create a password"}
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Use at least 10 characters. Changing it signs out your other active sessions.
          </p>
        </div>
        {profile.has_password && (
          <label className="block text-sm font-semibold text-slate-700">
            Current password
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={inputClass}
            />
          </label>
        )}
        <label className="block text-sm font-semibold text-slate-700">
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClass}
          />
        </label>
        <NoticeBox notice={passwordNotice} />
        <button
          type="submit"
          disabled={passwordBusy}
          className="inline-flex items-center gap-2 rounded-xl bg-[#003251] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#004b78] disabled:opacity-60"
        >
          {passwordBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {profile.has_password ? "Update password" : "Create password"}
        </button>
      </form>
    </ProfileAccordion>
  );
}

function SavedHomes({
  access,
  homes,
  onHomesChange,
}: {
  access: StoredPropertyAccess;
  homes: VisitorProfile["saved_homes"];
  onHomesChange: (homes: VisitorProfile["saved_homes"]) => void;
}) {
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  async function removeHome(propertyId: number) {
    setRemovingId(propertyId);
    setNotice(null);
    try {
      const remainingIds = await toggleVisitorSavedHome(access.token, propertyId, false);
      onHomesChange(homes.filter((home) => remainingIds.includes(home.id)));
      setNotice({ kind: "success", message: "The home was removed from Saved Homes." });
    } catch (error) {
      setNotice({ kind: "error", message: messageFrom(error) });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#003251]/55">
            Your favourites
          </p>
          <h2 className="mt-1.5 flex items-center gap-2 text-xl font-semibold text-[#003251]">
            <Heart className="h-5 w-5" aria-hidden="true" /> Saved Homes
          </h2>
        </div>
        <span className="text-sm text-slate-500">
          {homes.length} {homes.length === 1 ? "home" : "homes"}
        </span>
      </div>

      {notice && <div className="mt-4"><NoticeBox notice={notice} /></div>}

      {homes.length === 0 ? (
        <div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <Heart className="h-8 w-8 text-[#003251]/45" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-[#003251]">No saved homes yet</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Tap the heart on an agent&apos;s property to keep it here for later.
          </p>
          <Link
            href="/meet-the-team"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#003251] px-4 py-2.5 text-sm font-bold text-white"
          >
            Find an agent <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {homes.map((property) => {
            const imageUrl = propertyUploadUrl(property.cover_image);
            return (
              <article
                key={property.id}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-16/10 overflow-hidden bg-slate-200">
                  <Link
                    href={`/details?id=${property.id}&source=profile`}
                    aria-label={`View ${property.title}`}
                    className="block h-full"
                  >
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={property.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Home className="h-10 w-10 text-slate-400" aria-hidden="true" />
                      </div>
                    )}
                  </Link>
                  <span className="absolute bottom-3 left-3 bg-[#003251] px-3 py-1.5 text-sm font-bold text-white">
                    {displayPrice(property.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeHome(property.id)}
                    disabled={removingId === property.id}
                    aria-label={`Remove ${property.title} from Saved Homes`}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1c878f] shadow disabled:opacity-60"
                  >
                    {removingId === property.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <div className="p-4">
                  <Link
                    href={`/details?id=${property.id}&source=profile`}
                    className="text-base font-semibold leading-snug text-[#003251] hover:underline"
                  >
                    {property.title}
                  </Link>
                  <p className="mt-2 flex items-start gap-1.5 text-sm leading-5 text-slate-500">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {property.address}
                  </p>
                  <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    Saved {formatDate(property.saved_at)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function VisitHistory({ history }: { history: VisitorProfile["history"] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#003251]/55">
            Saved automatically
          </p>
          <h2 className="mt-1.5 flex items-center gap-2 text-xl font-semibold text-[#003251]">
            <History className="h-5 w-5" aria-hidden="true" /> Recently viewed
          </h2>
        </div>
        <span className="text-sm text-slate-500">
          {history.length} {history.length === 1 ? "property" : "properties"}
        </span>
      </div>

      {history.length === 0 ? (
        <div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <Home className="h-8 w-8 text-[#003251]/45" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-[#003251]">No viewed properties yet</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Properties you open while signed in will appear here for quick access later.
          </p>
          <Link
            href="/listing"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#003251] px-4 py-2.5 text-sm font-bold text-white"
          >
            Explore listings <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {history.map((property) => {
            const imageUrl = propertyUploadUrl(property.cover_image);
            return (
              <article
                key={property.id}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Link
                  href={`/details?id=${property.id}&source=profile`}
                  className="block"
                  aria-label={`View ${property.title}`}
                >
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-200">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={property.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Home className="h-10 w-10 text-slate-400" aria-hidden="true" />
                      </div>
                    )}
                    <span className="absolute bottom-3 left-3 bg-[#003251] px-3 py-1.5 text-sm font-bold text-white">
                      {displayPrice(property.price)}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold leading-snug text-[#003251]">
                      {property.title}
                    </h3>
                    <p className="mt-2 flex items-start gap-1.5 text-sm leading-5 text-slate-500">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {property.address}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span>Viewed {formatDate(property.last_visited_at)}</span>
                      <ArrowRight
                        className="h-4 w-4 text-[#003251] transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function InquiryHistory({ inquiries }: { inquiries: VisitorProfile["inquiries"] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#003251]/55">
            Messages you sent
          </p>
          <h2 className="mt-1.5 flex items-center gap-2 text-xl font-semibold text-[#003251]">
            <MessageSquare className="h-5 w-5" aria-hidden="true" /> Property inquiries
          </h2>
        </div>
        <span className="text-sm text-slate-500">
          {inquiries.length} {inquiries.length === 1 ? "inquiry" : "inquiries"}
        </span>
      </div>

      {inquiries.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-[#003251]/40" aria-hidden="true" />
          <h3 className="mt-3 font-semibold text-[#003251]">No property inquiries yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Messages sent from a property page will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {inquiries.map((inquiry) => {
            const imageUrl = propertyUploadUrl(inquiry.cover_image);
            const content = (
              <>
                <div
                  className="h-24 w-28 shrink-0 bg-slate-200 bg-cover bg-center sm:h-28 sm:w-36"
                  style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
                  aria-hidden="true"
                >
                  {!imageUrl && (
                    <div className="flex h-full items-center justify-center">
                      <Home className="h-7 w-7 text-slate-400" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug text-[#003251]">{inquiry.title}</h3>
                    <time className="shrink-0 text-xs text-slate-400">
                      {formatDate(inquiry.created_at)}
                    </time>
                  </div>
                  {inquiry.address && (
                    <p className="mt-1 truncate text-xs text-slate-500">{inquiry.address}</p>
                  )}
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                    “{inquiry.message}”
                  </p>
                  <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <Send className="h-3.5 w-3.5 text-[#003251]" aria-hidden="true" />
                    Inquiry contact
                    <span className="font-semibold text-slate-700">{inquiry.recipient_name}</span>
                    {inquiry.recipient_email && (
                      <a
                        href={`mailto:${inquiry.recipient_email}`}
                        className="text-[#003251] hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        ({inquiry.recipient_email})
                      </a>
                    )}
                  </p>
                  {inquiry.property_id && (
                    <Link
                      href={`/details?id=${inquiry.property_id}&source=profile`}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#003251] hover:underline"
                    >
                      View property <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </>
            );

            return (
              <article
                key={inquiry.id}
                className="flex gap-4 rounded-xl border border-slate-200 p-3 transition hover:border-[#003251]/40 hover:shadow-md"
              >
                {content}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
