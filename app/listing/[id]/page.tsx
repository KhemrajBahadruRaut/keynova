"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import {
  hasValidationErrors,
  validateEmail,
  validatePhone,
  validateText,
  validateVerificationCode,
} from "@/lib/validation";

interface Property {
  id: number;
  title: string;
  address: string;
  price: string;
  building_size: string;
  units: string;
  year_built: string;
  description: string;
  highlights: string[];
  images: string[];
  documents: { name: string; file: string }[];
  agent_name: string;
  agent_title: string;
  agent_phone: string;
  agent_email: string;
  agent_photo: string;
}

type ContactForm = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

type ContactField = keyof ContactForm;
type DocumentField = "name" | "email" | "code";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function PropertyListingPage() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const [showDocModal, setShowDocModal] = useState(false);
  const [docStep, setDocStep] = useState<"request" | "verify">("request");
  const [docEmail, setDocEmail] = useState("");
  const [docName, setDocName] = useState("");
  const [docCode, setDocCode] = useState("");
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docError, setDocError] = useState("");
  const [docTouched, setDocTouched] = useState<
    Partial<Record<DocumentField, boolean>>
  >({});

  const [unlockedEmail, setUnlockedEmail] = useState<string | null>(null);

  const [contact, setContact] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactTouched, setContactTouched] = useState<
    Partial<Record<ContactField, boolean>>
  >({});

  const contactErrors = {
    name: validateText(contact.name, "Name", {
      required: true,
      min: 2,
      max: 80,
    }),
    email: validateEmail(contact.email),
    phone: validatePhone(contact.phone),
    message: validateText(contact.message, "Message", { max: 2000 }),
  };

  const documentErrors = {
    name: validateText(docName, "Full name", {
      required: true,
      min: 2,
      max: 80,
    }),
    email: validateEmail(docEmail),
    code: validateVerificationCode(docCode),
  };

  const updateContact = (field: ContactField, value: string) => {
    setContact((current) => ({ ...current, [field]: value }));
    setContactTouched((current) => ({ ...current, [field]: true }));
    setContactError("");
  };

  const contactFieldError = (field: ContactField) =>
    contactTouched[field] ? contactErrors[field] : "";

  const documentFieldError = (field: DocumentField) =>
    docTouched[field] ? documentErrors[field] : "";

  const validatedFieldClass = (error: string, extra = "") =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${extra} ${
      error
        ? "border-red-500 focus:ring-red-200"
        : "border-gray-200 focus:ring-[#c8862a]"
    }`;

  // Storage key scoped to this specific property
  const storageKey = `doc_unlock_property_${id}`;

  // On mount: check if this property was already unlocked previously
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!id) return;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Optional: expire the unlock after 30 days so it's not forever
          const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
          if (parsed.email && Date.now() - parsed.unlockedAt < THIRTY_DAYS) {
            setUnlockedEmail(parsed.email);
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      } catch {
        // ignore corrupted storage
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [id, storageKey]);

  useEffect(() => {
    fetch(`${API}/property/get_property.php?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") {
          const item = Array.isArray(d.data) ? d.data[0] : d.data;
          if (typeof item.highlights === "string") {
            item.highlights = item.highlights
              .split("\n")
              .map((h: string) => h.trim())
              .filter(Boolean);
          } else if (!Array.isArray(item.highlights)) {
            item.highlights = [];
          }
          item.images = Array.isArray(item.images)
            ? item.images.filter((img: string) => img && img.trim() !== "")
            : [];
          setProperty(item);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API}/property/get_property.php?id=${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status === "success") {
            const item = Array.isArray(d.data) ? d.data[0] : d.data;
            if (typeof item.highlights === "string") {
              item.highlights = item.highlights
                .split("\n")
                .map((h: string) => h.trim())
                .filter(Boolean);
            } else if (!Array.isArray(item.highlights)) {
              item.highlights = [];
            }
            item.images = Array.isArray(item.images)
              ? item.images.filter((img: string) => img && img.trim() !== "")
              : [];
            setProperty(item);
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const handleDocRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const requestErrors = {
      name: documentErrors.name,
      email: documentErrors.email,
    };
    if (hasValidationErrors(requestErrors)) {
      setDocTouched((current) => ({ ...current, name: true, email: true }));
      setDocError("Please correct the highlighted fields.");
      return;
    }

    setDocSubmitting(true);
    setDocError("");
    try {
      const res = await fetch(`${API}/property/request_document.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: id,
          name: docName.trim(),
          email: docEmail.trim(),
        }),
      });
      const d = await res.json();
      if (d.status === "success") {
        setDocStep("verify");
      } else {
        setDocError(d.message || "Failed. Try again.");
      }
    } catch {
      setDocError("Network error. Try again.");
    }
    setDocSubmitting(false);
  };

  const handleDocVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (documentErrors.code) {
      setDocTouched((current) => ({ ...current, code: true }));
      setDocError("Enter the 6-digit verification code.");
      return;
    }
    setDocSubmitting(true);
    setDocError("");
    try {
      const res = await fetch(`${API}/property/verify_document_code.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: id,
          email: docEmail,
          code: docCode,
        }),
      });
      const d = await res.json();
      if (d.status === "success") {
        setUnlockedEmail(docEmail);
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ email: docEmail, unlockedAt: Date.now() }),
          );
        } catch {}
        setShowDocModal(false);
        setDocStep("request");
        setDocCode("");
        setDocTouched({});

        // Auto-open the first document in a new tab right after unlocking
        // if (property && property.documents && property.documents.length > 0) {
        //   window.open(
        //     `${API}/uploads/${property.documents[0].file}`,
        //     "_blank",
        //     "noopener,noreferrer",
        //   );
        // }
        // Jump them to the Documents tab so they see all files, not just the one that opened
        setActiveTab("documents");
      } else {
        setDocError(d.message || "Invalid or expired code. Try again.");
      }
    } catch {
      setDocError("Network error. Try again.");
    }
    setDocSubmitting(false);
  };

  const closeDocModal = () => {
    setShowDocModal(false);
    setDocStep("request");
    setDocError("");
    setDocCode("");
    setDocTouched({});
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasValidationErrors(contactErrors)) {
      setContactTouched({
        name: true,
        email: true,
        phone: true,
        message: true,
      });
      setContactError("Please correct the highlighted fields.");
      return;
    }

    setContactSending(true);
    setContactError("");
    try {
      const response = await fetch(`${API}/property/contact_inquiry.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim(),
          message: contact.message.trim(),
          property_id: id,
        }),
      });
      if (!response.ok) throw new Error("Request failed");
      setContactSuccess(true);
      setContact({ name: "", email: "", phone: "", message: "" });
      setContactTouched({});
    } catch {
      setContactError("Unable to send your inquiry. Please try again.");
    } finally {
      setContactSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#c8862a] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading property…</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3]">
        <p className="text-gray-500">Property not found.</p>
      </div>
    );
  }

  const tabs = ["Overview", "Documents", "Photos", "Map"];
  const isUnlocked = !!unlockedEmail;

  return (
    <div className="min-h-screen bg-[#f7f6f3] font-sans">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <button
          onClick={() => history.back()}
          className="text-sm text-[#c8862a] hover:underline flex items-center gap-1"
        >
          ‹ back to search
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {property.title}
            </h1>
            <p className="text-gray-500 mt-1">{property.address}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {property.price}
            </div>
            <div className="text-sm text-gray-500 uppercase tracking-wide">
              Sale Price
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-6 gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.toLowerCase()
                  ? "border-[#c8862a] text-[#c8862a]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === "overview" && (
              <>
                {property.images?.length > 0 && (
                  <div>
                    <div className="rounded-xl overflow-hidden bg-gray-200 h-80 relative">
                      <img
                        src={`${API}/uploads/${property.images[activeImage]}`}
                        alt="Property"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {property.images.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                        {property.images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImage(i)}
                            className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                              activeImage === i
                                ? "border-[#c8862a] opacity-100 scale-105"
                                : "border-transparent opacity-50 hover:opacity-80"
                            }`}
                          >
                            <img
                              src={`${API}/uploads/${img}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-[#c8862a] mb-4">
                    Property Details
                  </h2>
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: "Sale Price", value: property.price },
                      { label: "Building Size", value: property.building_size },
                      { label: "Units", value: property.units },
                      { label: "Year Built", value: property.year_built },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex justify-between py-3 text-sm"
                      >
                        <span className="font-medium text-gray-700">
                          {label}
                        </span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-[#c8862a] mb-3">
                    Property Description
                  </h2>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {property.description}
                  </p>
                </div>

                {property.highlights?.length > 0 && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-[#c8862a] mb-3">
                      Highlights
                    </h2>
                    <ul className="space-y-2">
                      {property.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <span className="mt-1 w-2 h-2 rounded-full bg-[#c8862a] shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {activeTab === "documents" && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#c8862a]">
                    Documents
                  </h2>
                  {isUnlocked && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                      <Check size={14} /> Verified as {unlockedEmail}
                    </span>
                  )}
                </div>
                {property.documents?.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {property.documents.map((doc, i) => (
                      <li
                        key={i}
                        className="flex justify-between items-center py-3 text-sm"
                      >
                        <span className="text-gray-700">📄 {doc.name}</span>
                        {/* {isUnlocked ? (
                          <button
                            onClick={() =>
                              window.open(`${API}/uploads/${doc.file}`, "_blank", "noopener,noreferrer")
                            }
                            className="text-white bg-[#c8862a] hover:bg-[#b5721f] transition-colors px-3 py-1.5 rounded-lg font-medium"
                          >
                            Download
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowDocModal(true)}
                            className="text-[#c8862a] hover:underline font-medium"
                          >
                            🔒 Request Access
                          </button>
                        )} */}
                        {isUnlocked ? (
                          <a
                            href={`${API}/uploads/${doc.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white bg-[#c8862a] hover:bg-[#b5721f] transition-colors px-3 py-1.5 rounded-lg font-medium"
                          >
                            Download
                          </a>
                        ) : (
                          <button
                            onClick={() => setShowDocModal(true)}
                            className="text-[#c8862a] hover:underline font-medium"
                          >
                            🔒 Request Access
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No documents have been added for this property yet.
                  </p>
                )}
              </div>
            )}

            {activeTab === "photos" && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#c8862a] mb-4">
                  Photos
                </h2>
                {property.images?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setActiveImage(i);
                          setActiveTab("overview");
                        }}
                        className="rounded-lg overflow-hidden h-32 bg-gray-200"
                      >
                        <img
                          src={`${API}/uploads/${img}`}
                          alt=""
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No photos available for this property.
                  </p>
                )}
              </div>
            )}

            {activeTab === "map" && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#c8862a] mb-4">
                  Location
                </h2>
                {property.address ? (
                  <div className="rounded-lg overflow-hidden h-96">
                    <iframe
                      title="Property location"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://www.google.com/maps?q=${encodeURIComponent(property.address)}&output=embed`}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No address available to show on the map.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="bg-[#c8862a] rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{isUnlocked ? "🔓" : "🔒"}</span>
                <h3 className="font-semibold">
                  {isUnlocked
                    ? "Documents Unlocked"
                    : "Access Secure Documents"}
                </h3>
              </div>

              <div className="bg-white rounded-lg p-4 text-gray-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    {property.agent_photo ? (
                      <img
                        src={`${API}/uploads/${property.agent_photo}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                        👤
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {property.agent_name}
                    </div>
                    <div className="text-xs text-[#c8862a]">
                      {property.agent_title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {property.agent_phone}
                    </div>
                    <div className="text-xs text-[#c8862a]">
                      {property.agent_email}
                    </div>
                  </div>
                </div>
                {isUnlocked ? (
                  <button
                    onClick={() => setActiveTab("documents")}
                    className="w-full bg-green-600 text-white text-sm py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check size={16} /> View Documents
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDocModal(true)}
                    className="w-full bg-[#c8862a] text-white text-sm py-2 rounded-lg font-medium hover:bg-[#b5721f] transition-colors"
                  >
                    Request Document Access
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                Request More Info
              </h3>
              {contactSuccess ? (
                <p className="text-green-600 text-sm text-center flex gap-2 justify-center items-center border rounded-3xl py-2">
                  <Check /> Inquiry sent successfully!
                </p>
              ) : (
                <form onSubmit={handleContact} className="space-y-3" noValidate>
                  {contactError && (
                    <p className="text-sm text-red-600" role="alert">
                      {contactError}
                    </p>
                  )}
                  <label htmlFor="contact-name" className="sr-only">
                    Full name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    className={validatedFieldClass(contactFieldError("name"))}
                    placeholder="John Smith"
                    value={contact.name}
                    onChange={(e) => updateContact("name", e.target.value)}
                    onBlur={() =>
                      setContactTouched((current) => ({
                        ...current,
                        name: true,
                      }))
                    }
                    aria-invalid={Boolean(contactFieldError("name"))}
                    aria-describedby="contact-name-error"
                    required
                  />
                  <p
                    id="contact-name-error"
                    className="min-h-4 text-xs text-red-600"
                    aria-live="polite"
                  >
                    {contactFieldError("name")}
                  </p>
                  <label htmlFor="contact-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    className={validatedFieldClass(contactFieldError("email"))}
                    placeholder="john@example.com"
                    value={contact.email}
                    onChange={(e) => updateContact("email", e.target.value)}
                    onBlur={() =>
                      setContactTouched((current) => ({
                        ...current,
                        email: true,
                      }))
                    }
                    aria-invalid={Boolean(contactFieldError("email"))}
                    aria-describedby="contact-email-error"
                    required
                  />
                  <p
                    id="contact-email-error"
                    className="min-h-4 text-xs text-red-600"
                    aria-live="polite"
                  >
                    {contactFieldError("email")}
                  </p>
                  <label htmlFor="contact-phone" className="sr-only">
                    Phone number
                  </label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={30}
                    className={validatedFieldClass(contactFieldError("phone"))}
                    placeholder="(111) 111-1111"
                    value={contact.phone}
                    onChange={(e) => updateContact("phone", e.target.value)}
                    onBlur={() =>
                      setContactTouched((current) => ({
                        ...current,
                        phone: true,
                      }))
                    }
                    aria-invalid={Boolean(contactFieldError("phone"))}
                    aria-describedby="contact-phone-error"
                  />
                  <p
                    id="contact-phone-error"
                    className="min-h-4 text-xs text-red-600"
                    aria-live="polite"
                  >
                    {contactFieldError("phone")}
                  </p>
                  <label htmlFor="contact-message" className="sr-only">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    className={validatedFieldClass(
                      contactFieldError("message"),
                      "resize-none",
                    )}
                    rows={3}
                    maxLength={2000}
                    placeholder="Enter message text..."
                    value={contact.message}
                    onChange={(e) => updateContact("message", e.target.value)}
                    onBlur={() =>
                      setContactTouched((current) => ({
                        ...current,
                        message: true,
                      }))
                    }
                    aria-invalid={Boolean(contactFieldError("message"))}
                    aria-describedby="contact-message-error"
                  />
                  <p
                    id="contact-message-error"
                    className="min-h-4 text-xs text-red-600"
                    aria-live="polite"
                  >
                    {contactFieldError("message")}
                  </p>
                  <button
                    type="submit"
                    disabled={
                      contactSending || hasValidationErrors(contactErrors)
                    }
                    className="w-full bg-[#c8862a] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#b5721f] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {contactSending ? "Sending…" : "Submit"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                🔒 Access Secure Documents
              </h3>
              <button
                onClick={closeDocModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            {docStep === "request" && (
              <form
                onSubmit={handleDocRequest}
                className="space-y-4"
                noValidate
              >
                <p className="text-sm text-gray-500">
                  Enter your details and we&apos;ll email you a verification
                  code to unlock the documents for this property.
                </p>
                {docError && (
                  <p
                    className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg"
                    role="alert"
                  >
                    {docError}
                  </p>
                )}
                <div>
                  <label
                    htmlFor="document-name"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="document-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    className={validatedFieldClass(documentFieldError("name"))}
                    placeholder="John Smith"
                    value={docName}
                    onChange={(e) => {
                      setDocName(e.target.value);
                      setDocTouched((current) => ({ ...current, name: true }));
                      setDocError("");
                    }}
                    onBlur={() =>
                      setDocTouched((current) => ({ ...current, name: true }))
                    }
                    aria-invalid={Boolean(documentFieldError("name"))}
                    aria-describedby="document-name-error"
                    required
                  />
                  <p
                    id="document-name-error"
                    className="mt-1 min-h-4 text-xs text-red-600"
                    aria-live="polite"
                  >
                    {documentFieldError("name")}
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="document-email"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="document-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    className={validatedFieldClass(documentFieldError("email"))}
                    placeholder="john@example.com"
                    value={docEmail}
                    onChange={(e) => {
                      setDocEmail(e.target.value);
                      setDocTouched((current) => ({ ...current, email: true }));
                      setDocError("");
                    }}
                    onBlur={() =>
                      setDocTouched((current) => ({ ...current, email: true }))
                    }
                    aria-invalid={Boolean(documentFieldError("email"))}
                    aria-describedby="document-email-error"
                    required
                  />
                  <p
                    id="document-email-error"
                    className="mt-1 min-h-4 text-xs text-red-600"
                    aria-live="polite"
                  >
                    {documentFieldError("email")}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={
                    docSubmitting ||
                    Boolean(documentErrors.name || documentErrors.email)
                  }
                  className="w-full bg-[#c8862a] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#b5721f] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {docSubmitting ? "Sending code…" : "Send Verification Code"}
                </button>
              </form>
            )}

            {docStep === "verify" && (
              <form onSubmit={handleDocVerify} className="space-y-4" noValidate>
                <p className="text-sm text-gray-500">
                  We sent a verification code to{" "}
                  <span className="font-medium text-gray-800">{docEmail}</span>.
                  Enter it below to unlock the documents.
                </p>
                {docError && (
                  <p
                    className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg"
                    role="alert"
                  >
                    {docError}
                  </p>
                )}
                <div>
                  <label
                    htmlFor="document-code"
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    Verification Code
                  </label>
                  <input
                    id="document-code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    className={validatedFieldClass(
                      documentFieldError("code"),
                      "tracking-[0.3em] text-center font-semibold",
                    )}
                    placeholder="••••••"
                    value={docCode}
                    onChange={(e) => {
                      setDocCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setDocTouched((current) => ({ ...current, code: true }));
                      setDocError("");
                    }}
                    onBlur={() =>
                      setDocTouched((current) => ({ ...current, code: true }))
                    }
                    aria-invalid={Boolean(documentFieldError("code"))}
                    aria-describedby="document-code-error"
                    required
                  />
                  <p
                    id="document-code-error"
                    className="mt-1 min-h-4 text-xs text-red-600 text-center"
                    aria-live="polite"
                  >
                    {documentFieldError("code")}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={docSubmitting || Boolean(documentErrors.code)}
                  className="w-full bg-[#c8862a] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#b5721f] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {docSubmitting ? "Verifying…" : "Verify & Unlock"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDocStep("request");
                    setDocError("");
                    setDocCode("");
                    setDocTouched((current) => ({
                      ...current,
                      code: false,
                    }));
                  }}
                  className="w-full text-xs text-gray-400 hover:text-gray-600"
                >
                  Use a different email
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
