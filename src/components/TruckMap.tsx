"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapTruck = { slug: string; name: string; note: string | null; lat: number; lng: number; until: string };

export default function TruckMap({ trucks, center }: { trucks: MapTruck[]; center: [number, number] }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { scrollWheelZoom: false }).setView(center, trucks.length ? 11 : 9);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    const pts: L.LatLngExpression[] = [];
    for (const t of trucks) {
      const icon = L.divIcon({ className: "truckpin", html: "🚚", iconSize: [34, 34], iconAnchor: [17, 17] });
      const m = L.marker([t.lat, t.lng], { icon, title: t.name }).addTo(map);
      const box = document.createElement("div");
      const a = document.createElement("a");
      a.href = `/channel/${t.slug}`;
      a.textContent = t.name;
      a.style.fontWeight = "700";
      box.append(a);
      if (t.note) { const p = document.createElement("div"); p.textContent = t.note; box.append(p); }
      const u = document.createElement("small");
      u.textContent = `Here until ${new Date(t.until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
      box.append(u);
      m.bindPopup(box);
      pts.push([t.lat, t.lng]);
    }
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
    else if (pts.length === 1) map.setView(pts[0], 14);
    return () => { map.remove(); };
  }, [trucks, center]);
  return <div ref={el} className="truckmap" role="region" aria-label="Map of food trucks open right now" />;
}
