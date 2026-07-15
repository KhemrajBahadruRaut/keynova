"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons breaking under Next.js/webpack
delete (
  L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string }
)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapProperty {
  id: number;
  title: string;
  address: string;
  price: string;
  lat?: number;
  lng?: number;
}

interface Props {
  properties: MapProperty[];
  hoveredId: number | null;
  onMarkerClick: (id: number) => void;
}

const CT_CENTER: [number, number] = [41.6032, -73.0877]; // fallback center

export default function ListingsMap({ properties, hoveredId, onMarkerClick }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: CT_CENTER,
      zoom: 8,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers whenever the property list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear stale markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const validProps = properties.filter(
      (p) => typeof p.lat === "number" && typeof p.lng === "number"
    );

    validProps.forEach((p) => {
      const marker = L.marker([p.lat as number, p.lng as number]).addTo(map);
      marker.bindPopup(
        `<div style="font-size:13px;font-weight:600;">${p.title}</div>
         <div style="font-size:12px;color:#666;">${p.address}</div>
         <div style="font-size:12px;color:#c8862a;font-weight:600;">${p.price}</div>`
      );
      marker.on("click", () => onMarkerClick(p.id));
      markersRef.current.set(p.id, marker);
    });

    // Fit bounds to show every marker
    if (validProps.length > 0) {
      const bounds = L.latLngBounds(
        validProps.map((p) => [p.lat as number, p.lng as number] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [properties, onMarkerClick]);

  // Highlight + pan to hovered marker, open its popup
  useEffect(() => {
    if (!hoveredId) return;
    const marker = markersRef.current.get(hoveredId);
    const map = mapRef.current;
    if (marker && map) {
      marker.openPopup();
      map.panTo(marker.getLatLng());
    }
  }, [hoveredId]);

  return <div ref={containerRef} className="w-full h-full" />;
}
