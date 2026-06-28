"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Property {
  id: number;
  title: string;
  address: string;
  price: string;
  building_size: string;
  units: string;
  year_built: string;
  agent_name: string;
  agent_photo: string;
  cover_image: string | null; // ← add this
}

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function ListingsPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/property/get_properties.php`)
      .then((r) => r.json())
      .then((d) => {
        if (d.status === "success") setProperties(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f3]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#c8862a] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading listings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6f3]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">
            Property Listings
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {properties.length} properties available
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {properties.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏢</div>
            <p className="text-gray-500">
              No properties available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/listing/${p.id}`)}
                className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
              >
                {/* Image placeholder */}
                <div className="h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                  {p.cover_image ? (
                    <img
                      src={`${API}/uploads/${p.cover_image}`}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-5xl">🏢</div>
                  )}
                  <div className="absolute top-3 right-3 bg-[#c8862a] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    For Sale
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h2 className="font-bold text-gray-900 text-lg truncate">
                    {p.title}
                  </h2>
                  <p className="text-gray-500 text-sm truncate mt-1">
                    {p.address}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[#c8862a] font-bold text-xl">
                      {p.price}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    {p.building_size && <span>📐 {p.building_size}</span>}
                    {p.units && <span>🏠 {p.units} units</span>}
                    {p.year_built && <span>📅 Built {p.year_built}</span>}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {p.agent_photo ? (
                        <img
                          src={`${API}/uploads/${p.agent_photo}`}
                          alt={p.agent_name}
                          className="w-7 h-7 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          👤
                        </div>
                      )}
                      <span className="text-xs text-gray-500 font-medium">
                        {p.agent_name}
                      </span>
                    </div>
                    <span className="text-xs text-[#c8862a] font-medium group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
