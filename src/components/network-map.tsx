"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const coordinates: Record<string, [number, number]> = {
  NG: [8.7, 9.1], GH: [-1, 7.95], KE: [37.9, 0.2], ZA: [24, -29], EG: [30.8, 26.8], RW: [29.9, -1.94], SN: [-14.45, 14.5], UG: [32.3, 1.37], GB: [-2.6, 54.5], US: [-98.6, 39.8],
};

export function NetworkMap({ counts, token }: { counts: { country: string; countryCode: string; total: number }[]; token?: string }) {
  const element = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(Boolean(token && !token.includes("xxxx")));
  const total = counts.reduce((sum, row) => sum + Number(row.total), 0);
  useEffect(() => {
    if (!element.current || !token || token.includes("xxxx")) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({ container: element.current, style: "mapbox://styles/mapbox/light-v11", center: [18, 8], zoom: 1.35, minZoom: 1, maxZoom: 7, attributionControl: false });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    counts.forEach((row) => { const point = coordinates[row.countryCode]; if (!point) return; const marker = document.createElement("a"); marker.href = `/love-ambassadors/network/${row.countryCode}`; marker.setAttribute("aria-label", `${row.country}: ${row.total} ambassadors`); marker.className = "network-marker"; marker.textContent = String(row.total); new mapboxgl.Marker({ element: marker, anchor: "center" }).setLngLat(point).setPopup(new mapboxgl.Popup({ offset: 20 }).setHTML(`<strong>${row.country}</strong><br>${row.total} Ambassador${row.total === 1 ? "" : "s"}`)).addTo(map); });
    map.on("error", () => setAvailable(false));
    return () => map.remove();
  }, [counts, token]);
  return <figure className="overflow-hidden rounded-2xl border border-brand/10 bg-brand shadow-[0_24px_60px_rgba(16,42,67,.18)]">
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-5 text-paper sm:px-7"><div><p className="eyebrow text-sunshine">Live network index</p><p className="mt-2 text-sm text-paper/75">Use the controls to zoom or explore each country marker.</p></div><p className="font-display text-3xl text-sunshine">{total} <span className="font-sans text-sm font-medium text-paper/75">ambassadors</span></p></div>
    {available ? <div ref={element} className="h-[420px] w-full resize-y overflow-hidden bg-mist sm:h-[540px]" /> : <div className="surface-grid m-5 rounded-xl bg-paper/8 p-8 text-paper"><p className="font-display text-2xl">Global presence</p><p className="mt-2 max-w-xl text-sm text-paper/75">The interactive geographic map will appear once a valid Mapbox public token is available. The country directory remains fully available below.</p><div className="mt-6 flex flex-wrap gap-2">{counts.map((row) => <Link className="rounded-full border border-paper/15 px-3 py-1.5 text-sm hover:bg-paper/10" href={`/love-ambassadors/network/${row.countryCode}`} key={row.countryCode}>{row.country} · {row.total}</Link>)}</div></div>}
    <figcaption className="px-5 py-4 text-xs text-paper/65 sm:px-7">Country totals include every approved Ambassador. Profile visibility always follows each member’s consent.</figcaption>
  </figure>;
}
