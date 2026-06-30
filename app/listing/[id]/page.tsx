"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";

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

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function PropertyListingPage() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  // Document access modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [docEmail, setDocEmail] = useState("");
  const [docName, setDocName] = useState("");
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docSuccess, setDocSuccess] = useState(false);
  const [docError, setDocError] = useState("");

  // Contact form
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

useEffect(() => {
  fetch(`${API}/property/get_property.php?id=${id}`)
    .then((r) => r.json())
    .then((d) => {
      console.log("PROPERTY RESPONSE:", d);
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
        // Filter out blank/missing image filenames
        item.images = Array.isArray(item.images)
          ? item.images.filter((img: string) => img && img.trim() !== "")
          : [];
        setProperty(item);
      }
      setLoading(false);
    })
    .catch((err) => {
      console.log("FETCH ERROR:", err);
      setLoading(false);
    });
}, [id]);

useEffect(() => {
  const interval = setInterval(() => {
    fetch(`${API}/property/get_property.php?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") {
          const item = Array.isArray(d.data) ? d.data[0] : d.data;
          if (typeof item.highlights === "string") {
            item.highlights = item.highlights.split("\n").map((h: string) => h.trim()).filter(Boolean);
          } else if (!Array.isArray(item.highlights)) {
            item.highlights = [];
          }
          item.images = Array.isArray(item.images)
            ? item.images.filter((img: string) => img && img.trim() !== "")
            : [];
          setProperty(item);
        }
      })
      .catch((err) => console.log("POLL ERROR:", err));
  }, 5000);

  return () => clearInterval(interval);
}, [id]);

  const handleDocRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocSubmitting(true);
    setDocError("");
    try {
      const res = await fetch(`${API}/property/request_document.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: id,
          name: docName,
          email: docEmail,
        }),
      });
      const d = await res.json();
      if (d.status === "success") setDocSuccess(true);
      else setDocError(d.message || "Failed. Try again.");
    } catch {
      setDocError("Network error. Try again.");
    }
    setDocSubmitting(false);
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    await fetch(`${API}/property/contact_inquiry.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...contact, property_id: id }),
    });
    setContactSending(false);
    setContactSuccess(true);
    setContact({ name: "", email: "", phone: "", message: "" });
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

  return (
    <div className="min-h-screen bg-[#f7f6f3] font-sans">
      {/* Top Nav */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <button
          onClick={() => history.back()}
          className="text-sm text-[#c8862a] hover:underline flex items-center gap-1"
        >
          ‹ back to search
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
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

        {/* Tabs */}
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
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <>
                {/* Main Image */}
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

                {/* Property Details */}
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

                {/* Description */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-[#c8862a] mb-3">
                    Property Description
                  </h2>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {property.description}
                  </p>
                </div>

                {/* Highlights */}
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

            {/* DOCUMENTS TAB */}
            {activeTab === "documents" && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-[#c8862a] mb-4">
                  Documents
                </h2>
                {property.documents?.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {property.documents.map((doc, i) => (
                      <li
                        key={i}
                        className="flex justify-between items-center py-3 text-sm"
                      >
                        <span className="text-gray-700">📄 {doc.name}</span>
                        <button
                          onClick={() => setShowDocModal(true)}
                          className="text-[#c8862a] hover:underline font-medium"
                        >
                          Request Access
                        </button>
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

            {/*PHOTOS TAB */}
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
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        property.address,
                      )}&output=embed`}
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

          {/* Right Column (always visible regardless of tab) */}
          <div className="space-y-5">
            {/* Access Secure Documents */}
            <div className="bg-[#c8862a] rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔒</span>
                <h3 className="font-semibold">Access Secure Documents</h3>
              </div>

              {/* Agent */}
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
                <button
                  onClick={() => setShowDocModal(true)}
                  className="w-full bg-[#c8862a] text-white text-sm py-2 rounded-lg font-medium hover:bg-[#b5721f] transition-colors"
                >
                  Request Document Access
                </button>
              </div>
            </div>

            {/* Contact / Request Info */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">
                Request More Info
              </h3>
              {contactSuccess ? (
                <p className="text-green-600 text-sm text-center flex gap-2 justify-center items-center border rounded-3xl py-2">
                  <Check /> Inquiry sent successfully!
                </p>
              ) : (
                <form onSubmit={handleContact} className="space-y-3">
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                    placeholder="John Smith"
                    value={contact.name}
                    onChange={(e) =>
                      setContact({ ...contact, name: e.target.value })
                    }
                    required
                  />
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                    placeholder="john@example.com"
                    value={contact.email}
                    onChange={(e) =>
                      setContact({ ...contact, email: e.target.value })
                    }
                    required
                  />
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                    placeholder="(111) 111-1111"
                    value={contact.phone}
                    onChange={(e) =>
                      setContact({ ...contact, phone: e.target.value })
                    }
                  />
                  <textarea
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a] resize-none"
                    rows={3}
                    placeholder="Enter message text..."
                    value={contact.message}
                    onChange={(e) =>
                      setContact({ ...contact, message: e.target.value })
                    }
                  />
                  <button
                    type="submit"
                    disabled={contactSending}
                    className="w-full bg-[#c8862a] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#b5721f] transition-colors disabled:opacity-60"
                  >
                    {contactSending ? "Sending…" : "Submit"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Access Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                🔒 Access Secure Documents
              </h3>
              <button
                onClick={() => {
                  setShowDocModal(false);
                  setDocSuccess(false);
                  setDocError("");
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            {docSuccess ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-800 font-medium">
                  Access Request Submitted
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  We'll review your request and send the documents to your
                  email.
                </p>
                <button
                  onClick={() => {
                    setShowDocModal(false);
                    setDocSuccess(false);
                  }}
                  className="mt-4 bg-[#c8862a] text-white px-6 py-2 rounded-lg text-sm font-medium"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleDocRequest} className="space-y-4">
                <p className="text-sm text-gray-500">
                  Enter your details to request access to secure documents for
                  this property.
                </p>
                {docError && (
                  <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    {docError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                    placeholder="John Smith"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                    placeholder="john@example.com"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={docSubmitting}
                  className="w-full bg-[#c8862a] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#b5721f] transition-colors disabled:opacity-60"
                >
                  {docSubmitting ? "Submitting…" : "Request Access"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
