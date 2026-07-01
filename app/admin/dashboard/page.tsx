"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Property {
  id: number;
  title: string;
  address: string;
  price: string;
  building_size: string;
  units: string;
  year_built: string;
  description: string;
  highlights: string;
  agent_name: string;
  agent_title: string;
  agent_phone: string;
  agent_email: string;
  created_at: string;
}

interface DocumentRequest {
  id: number;
  property_id: number;
  property_title: string;
  name: string;
  email: string;
  requested_at: string;
  status: string;
}

interface Inquiry {
  id: number;
  property_title: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "properties" | "requests" | "inquiries"
  >("properties");
  const [properties, setProperties] = useState<Property[]>([]);
  const [docRequests, setDocRequests] = useState<DocumentRequest[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<
    { name: string; file: string }[]
  >([]);

  // Form state
  const [form, setForm] = useState({
    title: "",
    address: "",
    price: "",
    building_size: "",
    units: "",
    year_built: "",
    description: "",
    highlights: "",
    agent_name: "",
    agent_title: "",
    agent_phone: "",
    agent_email: "",
  });

  // Geocoding state — resolved silently in the background
  const [geocodedLat, setGeocodedLat] = useState<number | null>(null);
  const [geocodedLng, setGeocodedLng] = useState<number | null>(null);
  const [geocodeStatus, setGeocodeStatus] = useState<
    "idle" | "loading" | "ok" | "fail"
  >("idle");

  const [images, setImages] = useState<File[]>([]);
  const [agentPhoto, setAgentPhoto] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: "", text: "" });

  // ── Auto-geocode whenever address changes ──────────────────────────────────
  useEffect(() => {
    const address = form.address.trim();
    if (address.length < 8) {
      setGeocodedLat(null);
      setGeocodedLng(null);
      setGeocodeStatus("idle");
      return;
    }

    setGeocodeStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const url =
          "https://nominatim.openstreetmap.org/search?" +
          new URLSearchParams({
            q: address,
            format: "json",
            limit: "1",
            addressdetails: "0",
          });

        const res = await fetch(url, {
          headers: {
            "User-Agent": "PropertyListingsApp/1.0",
          },
        });
        const data = await res.json();

        if (data && data.length > 0) {
          setGeocodedLat(parseFloat(data[0].lat));
          setGeocodedLng(parseFloat(data[0].lon));
          setGeocodeStatus("ok");
        } else {
          setGeocodedLat(null);
          setGeocodedLng(null);
          setGeocodeStatus("fail");
        }
      } catch {
        setGeocodedLat(null);
        setGeocodedLng(null);
        setGeocodeStatus("fail");
      }
    }, 800); // debounce 800 ms

    return () => clearTimeout(timer);
  }, [form.address]);
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin");
      return;
    }
    loadData();
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [pRes, dRes, iRes] = await Promise.all([
        fetch(`${API}/property/get_properties.php`, { headers }),
        fetch(`${API}/property/get_doc_requests.php`, { headers }),
        fetch(`${API}/property/get_inquiries.php`, { headers }),
      ]);
      const [pData, dData, iData] = await Promise.all([
        pRes.json(),
        dRes.json(),
        iRes.json(),
      ]);
      if (pData.status === "success") setProperties(pData.data || []);
      if (dData.status === "success") setDocRequests(dData.data || []);
      if (iData.status === "success") setInquiries(iData.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    router.push("/admin");
  };

  const resetForm = () => {
    setForm({
      title: "",
      address: "",
      price: "",
      building_size: "",
      units: "",
      year_built: "",
      description: "",
      highlights: "",
      agent_name: "",
      agent_title: "",
      agent_phone: "",
      agent_email: "",
    });
    setImages([]);
    setAgentPhoto(null);
    setDocuments([]);
    setFormMsg({ type: "", text: "" });
    setExistingImages([]);
    setExistingDocuments([]);
    setGeocodedLat(null);
    setGeocodedLng(null);
    setGeocodeStatus("idle");
  };

  const openCreateForm = () => {
    setEditProperty(null);
    resetForm();
    setShowForm(true);
  };

  const openEditForm = async (p: Property) => {
    setEditProperty(p);
    resetForm();
    setForm({
      title: p.title,
      address: p.address,
      price: p.price,
      building_size: p.building_size,
      units: p.units,
      year_built: p.year_built,
      description: p.description,
      highlights: p.highlights,
      agent_name: p.agent_name,
      agent_title: p.agent_title,
      agent_phone: p.agent_phone,
      agent_email: p.agent_email,
    });

    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${API}/property/get_property.php?id=${p.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.status === "success") {
        const item = Array.isArray(d.data) ? d.data[0] : d.data;
        setExistingImages(
          Array.isArray(item.images)
            ? item.images.filter((img: string) => img && img.trim() !== "")
            : []
        );
        setExistingDocuments(
          Array.isArray(item.documents) ? item.documents : []
        );
        // Pre-fill geocoords if already stored on the property
        if (item.lat && item.lng) {
          setGeocodedLat(parseFloat(item.lat));
          setGeocodedLng(parseFloat(item.lng));
          setGeocodeStatus("ok");
        }
      }
    } catch (err) {
      console.error("Failed to load existing images/documents", err);
    }

    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMsg({ type: "", text: "" });
    const token = localStorage.getItem("admin_token");

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (editProperty) fd.append("id", String(editProperty.id));

    // ── Attach geocoords so the backend can store them ──────────────────────
    if (geocodedLat !== null) fd.append("lat", String(geocodedLat));
    if (geocodedLng !== null) fd.append("lng", String(geocodedLng));
    // ────────────────────────────────────────────────────────────────────────

    images.forEach((f) => fd.append("images[]", f));
    documents.forEach((f) => fd.append("documents[]", f));
    if (agentPhoto) fd.append("agent_photo", agentPhoto);

    const url = editProperty
      ? `${API}/property/update_property.php`
      : `${API}/property/create_property.php`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await res.json();
      if (d.status === "success") {
        setFormMsg({
          type: "success",
          text: editProperty ? "Property updated!" : "Property created!",
        });
        loadData();
        setTimeout(() => {
          setShowForm(false);
          setFormMsg({ type: "", text: "" });
        }, 1500);
      } else {
        setFormMsg({
          type: "error",
          text: d.message || "Something went wrong.",
        });
      }
    } catch {
      setFormMsg({ type: "error", text: "Network error." });
    }
    setFormLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this property?")) return;
    const token = localStorage.getItem("admin_token");
    await fetch(`${API}/property/delete_property.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  const handleDeleteExistingImage = async (filename: string) => {
    if (!confirm("Remove this image?")) return;
    const token = localStorage.getItem("admin_token");
    try {
      await fetch(`${API}/property/delete_property_image.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ property_id: editProperty?.id, filename }),
      });
      setExistingImages((prev) => prev.filter((img) => img !== filename));
    } catch (err) {
      console.error("Failed to delete image", err);
    }
  };

  const handleDeleteExistingDocument = async (filename: string) => {
    if (!confirm("Remove this document?")) return;
    const token = localStorage.getItem("admin_token");
    try {
      await fetch(`${API}/property/delete_property_document.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ property_id: editProperty?.id, filename }),
      });
      setExistingDocuments((prev) =>
        prev.filter((doc) => doc.file !== filename)
      );
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const tabs = [
    { key: "properties", label: "Properties", count: properties.length },
    {
      key: "requests",
      label: "Doc Requests",
      count: docRequests.filter((d) => d.status !== "verified").length,
    },
    { key: "inquiries", label: "Inquiries", count: inquiries.length },
  ] as const;

  // Geocode status badge shown below the address field
  const geocodeBadge = () => {
    if (form.address.trim().length < 8) return null;
    if (geocodeStatus === "loading")
      return (
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          Locating address…
        </p>
      );
    if (geocodeStatus === "ok")
      return (
        <p className="text-xs text-green-600 mt-1">
          ✓ Location found — pin will appear on map
        </p>
      );
    if (geocodeStatus === "fail")
      return (
        <p className="text-xs text-amber-500 mt-1">
          ⚠ Address not found on map — property will still be saved
        </p>
      );
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#c8862a] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <span className="font-semibold text-gray-900">Keynova Admin</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700 font-medium"
        >
          Logout
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Properties", value: properties.length, icon: "🏢" },
            {
              label: "Verified Doc Requests",
              value: docRequests.filter((d) => d.status === "verified").length,
              icon: "📄",
            },
            { label: "Total Inquiries", value: inquiries.length, icon: "✉️" },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4"
            >
              <div className="text-3xl">{icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === key
                    ? "border-b-2 border-[#c8862a] text-[#c8862a] bg-orange-50"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === key
                        ? "bg-[#c8862a] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Properties Tab */}
            {activeTab === "properties" && (
              <div>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-semibold text-gray-900">
                    All Properties
                  </h2>
                  <button
                    onClick={openCreateForm}
                    className="bg-[#c8862a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#b5721f] transition-colors flex items-center gap-2"
                  >
                    + Add Property
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-400">
                    Loading…
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🏢</div>
                    <p className="text-gray-500">
                      No properties yet. Add your first listing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {properties.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {p.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {p.address}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-semibold text-[#c8862a]">
                              {p.price}
                            </span>
                            <span className="text-xs text-gray-400">
                              {p.building_size} · {p.units} units
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Link
                            href={`/listing/${p.id}`}
                            target="_blank"
                            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => openEditForm(p)}
                            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Doc Requests Tab */}
            {activeTab === "requests" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Document Access Requests
                </h2>
                <p className="text-xs text-gray-400 mb-5">
                  Read-only log. Visitors unlock documents themselves by
                  verifying the code sent to their email — no action needed
                  here.
                </p>
                {docRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No document requests yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-gray-100">
                          <th className="pb-3 font-medium text-gray-600">Name</th>
                          <th className="pb-3 font-medium text-gray-600">Email</th>
                          <th className="pb-3 font-medium text-gray-600">Property</th>
                          <th className="pb-3 font-medium text-gray-600">Date</th>
                          <th className="pb-3 font-medium text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {docRequests.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="py-3 font-medium text-gray-900">
                              {r.name}
                            </td>
                            <td className="py-3 text-[#c8862a]">{r.email}</td>
                            <td className="py-3 text-gray-600 max-w-32 truncate">
                              {r.property_title}
                            </td>
                            <td className="py-3 text-gray-400">
                              {new Date(r.requested_at).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  r.status === "verified"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {r.status === "verified" ? "Verified" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Inquiries Tab */}
            {activeTab === "inquiries" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-5">
                  Contact Inquiries
                </h2>
                {inquiries.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No inquiries yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="border border-gray-100 rounded-xl p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-gray-900">
                              {inq.name}
                            </span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-[#c8862a] text-sm">
                              {inq.email}
                            </span>
                            {inq.phone && (
                              <>
                                <span className="text-gray-400 mx-2">·</span>
                                <span className="text-gray-500 text-sm">
                                  {inq.phone}
                                </span>
                              </>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(inq.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#c8862a] mb-1">
                          Re: {inq.property_title}
                        </p>
                        <p className="text-sm text-gray-600">{inq.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4 flex items-start justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editProperty ? "Edit Property" : "Add New Property"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formMsg.text && (
                <div
                  className={`px-4 py-3 rounded-lg text-sm ${
                    formMsg.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {formMsg.text}
                </div>
              )}

              {/* Property Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Property Info
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Property Title *
                    </label>
                    <input
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      placeholder="South End Plaza"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Address *
                    </label>
                    <input
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      placeholder="310 S Main St, Thomaston, CT 06787"
                    />

                    {/* Geocode status badge */}
                    {geocodeBadge()}

                    {/* Map preview — only shown once geocode succeeds */}
                    {geocodeStatus === "ok" &&
                      geocodedLat &&
                      geocodedLng && (
                        <div className="mt-2 rounded-lg overflow-hidden h-40 border border-gray-200">
                          <iframe
                            title="Address preview"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={`https://www.google.com/maps?q=${geocodedLat},${geocodedLng}&z=14&output=embed`}
                          />
                        </div>
                      )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Sale Price *
                    </label>
                    <input
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      placeholder="$2,450,000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Building Size
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                      value={form.building_size}
                      onChange={(e) =>
                        setForm({ ...form, building_size: e.target.value })
                      }
                      placeholder="14,614 SF"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Units
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                      value={form.units}
                      onChange={(e) =>
                        setForm({ ...form, units: e.target.value })
                      }
                      placeholder="17"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Year Built
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                      value={form.year_built}
                      onChange={(e) =>
                        setForm({ ...form, year_built: e.target.value })
                      }
                      placeholder="1971"
                    />
                  </div>
                </div>
              </div>

              {/* Description & Highlights */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Property Description
                </label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a] resize-none"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the property…"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Highlights (one per line)
                </label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a] resize-none"
                  value={form.highlights}
                  onChange={(e) =>
                    setForm({ ...form, highlights: e.target.value })
                  }
                  placeholder={
                    "Residential Rents Below Achievable Levels\nCommercial Lease-Up and Mark-to-Market"
                  }
                />
              </div>

              {/* Agent Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Agent Info
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Agent Name
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                      value={form.agent_name}
                      onChange={(e) =>
                        setForm({ ...form, agent_name: e.target.value })
                      }
                      placeholder="Brad Balletto"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Title
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                      value={form.agent_title}
                      onChange={(e) =>
                        setForm({ ...form, agent_title: e.target.value })
                      }
                      placeholder="Managing Director"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Phone
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                      value={form.agent_phone}
                      onChange={(e) =>
                        setForm({ ...form, agent_phone: e.target.value })
                      }
                      placeholder="860.420.9775"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8862a]"
                      value={form.agent_email}
                      onChange={(e) =>
                        setForm({ ...form, agent_email: e.target.value })
                      }
                      placeholder="agent@firm.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Agent Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-[#c8862a] hover:file:bg-orange-100"
                      onChange={(e) =>
                        setAgentPhoto(e.target.files?.[0] || null)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Files */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Files
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Property Images
                    </label>
                    {editProperty && existingImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {existingImages.map((img) => (
                          <div
                            key={img}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                          >
                            <img
                              src={`${API}/uploads/${img}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingImage(img)}
                              className="absolute top-0 right-0 bg-black/60 text-white text-xs w-4 h-4 flex items-center justify-center rounded-bl-md"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-[#c8862a] hover:file:bg-orange-100"
                      onChange={handleAddImages}
                    />
                    {images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {images.map((file, i) => (
                          <div
                            key={i}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-0 right-0 bg-black/60 text-white text-xs w-4 h-4 flex items-center justify-center rounded-bl-md"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <p className="w-full text-xs text-gray-400 mt-1">
                          {images.length} new image(s) to upload
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Secure Documents (PDF)
                    </label>
                    {editProperty && existingDocuments.length > 0 && (
                      <ul className="space-y-1 mb-3">
                        {existingDocuments.map((doc) => (
                          <li
                            key={doc.file}
                            className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded-lg"
                          >
                            <span className="text-gray-700 truncate">
                              📄 {doc.name}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteExistingDocument(doc.file)
                              }
                              className="text-red-500 hover:text-red-700 text-xs font-medium"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      multiple
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-[#c8862a] hover:file:bg-orange-100"
                      onChange={(e) =>
                        setDocuments(Array.from(e.target.files || []))
                      }
                    />
                    {documents.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {documents.length} new document(s) to upload
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 bg-[#c8862a] text-white rounded-lg text-sm font-medium hover:bg-[#b5721f] transition-colors disabled:opacity-60"
                >
                  {formLoading
                    ? "Saving…"
                    : editProperty
                      ? "Update Property"
                      : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}