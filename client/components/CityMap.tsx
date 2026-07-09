"use client";

// Hyderabad map drawn with plain Leaflet (no React wrapper).
// Incidents = circles sized by priority and coloured by severity.
// Units = small squares; a dashed line joins each busy unit to the incident it was sent to.
import { useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

export type MapIncident = {
  _id: string;
  incidentCode: string;
  title: string;
  severity: string;
  priorityScore: number;
  latitude?: number;
  longitude?: number;
  locationText?: string;
};

export type MapResource = {
  _id: string;
  resourceCode: string;
  name: string;
  resourceType: string;
  status: string;
  currentLatitude: number;
  currentLongitude: number;
  assignedIncidentId?: string;
};

const severityHex: Record<string, string> = {
  CRITICAL: "#b42318",
  HIGH: "#c4520f",
  MEDIUM: "#a37b00",
  LOW: "#2f7a43"
};

const HYDERABAD: [number, number] = [17.41, 78.43];

export function CityMap({
  incidents,
  resources,
  height = 420
}: {
  incidents: MapIncident[];
  resources: MapResource[];
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const fittedRef = useRef(false);

  // Create the map once. Leaflet needs `window`, so it's imported on the client only.
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(HYDERABAD, 11);
      // Standard OpenStreetMap tiles; globals.css greys them out so the markers stand out.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      drawLayers(L, map);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw markers whenever the data changes.
  useEffect(() => {
    if (!mapRef.current) return;
    void import("leaflet").then((L) => mapRef.current && drawLayers(L, mapRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents, resources]);

  function drawLayers(L: typeof import("leaflet"), map: LeafletMap) {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    const placed = incidents.filter((incident) => incident.latitude && incident.longitude);
    const byId = new Map(placed.map((incident) => [incident._id, incident]));

    for (const unit of resources) {
      const target = unit.assignedIncidentId ? byId.get(unit.assignedIncidentId) : undefined;
      if (unit.status === "BUSY" && target) {
        L.polyline(
          [
            [unit.currentLatitude, unit.currentLongitude],
            [target.latitude as number, target.longitude as number]
          ],
          { color: "#1a6b6e", weight: 1.5, dashArray: "4 4", opacity: 0.8 }
        ).addTo(layer);
      }
    }

    for (const unit of resources) {
      const busy = unit.status === "BUSY";
      L.marker([unit.currentLatitude, unit.currentLongitude], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:9px;height:9px;border:1.5px solid #1a6b6e;background:${busy ? "#1a6b6e" : "#fff"}"></div>`,
          iconSize: [9, 9],
          iconAnchor: [4, 4]
        })
      })
        .bindPopup(
          `<strong>${unit.resourceCode}</strong><br/>${unit.name}<br/><span style="color:#6b6f76">${unit.resourceType.replaceAll("_", " ").toLowerCase()} · ${unit.status.toLowerCase()}</span>`
        )
        .addTo(layer);
    }

    for (const incident of placed) {
      const color = severityHex[incident.severity] || "#323c4a";
      L.circleMarker([incident.latitude as number, incident.longitude as number], {
        radius: 6 + Math.round((incident.priorityScore || 0) / 14),
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.25
      })
        .bindPopup(
          `<strong>${incident.title}</strong><br/><span style="color:#6b6f76">${incident.locationText || ""}</span><br/>Priority ${incident.priorityScore} · <a href="/incidents/${incident._id}">${incident.incidentCode}</a>`
        )
        .addTo(layer);
    }

    // Zoom to the incidents (and the units heading to them) the first time we have some.
    if (!fittedRef.current && placed.length > 0) {
      const points: Array<[number, number]> = placed.map((incident) => [incident.latitude as number, incident.longitude as number]);
      for (const unit of resources) {
        if (unit.assignedIncidentId && byId.has(unit.assignedIncidentId)) points.push([unit.currentLatitude, unit.currentLongitude]);
      }
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds.pad(0.25), { maxZoom: 14 });
      fittedRef.current = true;
    }
  }

  return <div ref={containerRef} style={{ height }} className="w-full" />;
}

export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {Object.entries(severityHex).map(([severity, color]) => (
        <span key={severity} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: color, background: `${color}40` }} />
          {severity.toLowerCase()}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 border-[1.5px] border-teal bg-white" /> unit free
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 border-[1.5px] border-teal bg-teal" /> unit assigned
      </span>
    </div>
  );
}
