import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface StagePoint {
  id: string;
  stage_type: string;
  sequence_no: number;
  lat: number | null;
  lng: number | null;
  address_text: string | null;
  status: string;
}

interface ProviderRouteMapProps {
  stages: StagePoint[];
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
}

const stageColors: Record<string, string> = {
  purchase: '#f59e0b',
  pickup: '#3b82f6',
  dropoff: '#10b981',
  handover: '#8b5cf6',
  onsite: '#ec4899',
};

const stageIcons: Record<string, string> = {
  purchase: '🛒',
  pickup: '📦',
  dropoff: '📍',
  handover: '🤝',
  onsite: '🏠',
};

export default function ProviderRouteMap({ stages, pickupLat, pickupLng, dropoffLat, dropoffLng }: ProviderRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layerGroup = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([24.7136, 46.6753], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OSM',
      }).addTo(mapInstance.current);
      layerGroup.current = L.layerGroup().addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!layerGroup.current || !mapInstance.current) return;
    layerGroup.current.clearLayers();

    const points: { lat: number; lng: number; label: string; color: string; icon: string; seq: number; done: boolean }[] = [];

    // Add pickup/dropoff from order if stages don't have coords
    if (pickupLat && pickupLng) {
      points.push({ lat: pickupLat, lng: pickupLng, label: 'Pickup', color: '#3b82f6', icon: '📦', seq: 0, done: false });
    }

    stages
      .filter(s => s.lat && s.lng)
      .sort((a, b) => a.sequence_no - b.sequence_no)
      .forEach(s => {
        points.push({
          lat: s.lat!,
          lng: s.lng!,
          label: s.address_text || s.stage_type,
          color: stageColors[s.stage_type] || '#6b7280',
          icon: stageIcons[s.stage_type] || '📍',
          seq: s.sequence_no,
          done: s.status === 'completed',
        });
      });

    if (dropoffLat && dropoffLng) {
      points.push({ lat: dropoffLat, lng: dropoffLng, label: 'Dropoff', color: '#10b981', icon: '🏁', seq: 999, done: false });
    }

    if (points.length === 0) return;

    // Add markers
    points.forEach(p => {
      const markerIcon = L.divIcon({
        className: 'provider-route-marker',
        html: `
          <div style="
            background: ${p.done ? '#10b981' : p.color};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            ${p.done ? 'opacity: 0.7;' : ''}
          ">${p.done ? '✅' : p.icon}</div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([p.lat, p.lng], { icon: markerIcon })
        .bindPopup(`<strong>${p.seq}. ${p.label}</strong>`)
        .addTo(layerGroup.current!);
    });

    // Draw route polyline
    if (points.length >= 2) {
      const sorted = [...points].sort((a, b) => a.seq - b.seq);
      const latlngs = sorted.map(p => [p.lat, p.lng] as [number, number]);

      // Dashed background line
      L.polyline(latlngs, {
        color: '#94a3b8',
        weight: 3,
        dashArray: '8, 8',
        opacity: 0.5,
      }).addTo(layerGroup.current!);

      // Solid route line
      L.polyline(latlngs, {
        color: 'hsl(35, 85%, 52%)',
        weight: 4,
        opacity: 0.85,
      }).addTo(layerGroup.current!);

      // Direction arrows along route
      for (let i = 0; i < latlngs.length - 1; i++) {
        const mid: [number, number] = [
          (latlngs[i][0] + latlngs[i + 1][0]) / 2,
          (latlngs[i][1] + latlngs[i + 1][1]) / 2,
        ];
        const arrowIcon = L.divIcon({
          className: 'route-arrow',
          html: `<div style="
            color: hsl(35, 85%, 52%);
            font-size: 18px;
            font-weight: bold;
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
          ">→</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        L.marker(mid, { icon: arrowIcon, interactive: false }).addTo(layerGroup.current!);
      }
    }

    // Fit bounds
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
  }, [stages, pickupLat, pickupLng, dropoffLat, dropoffLng]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-xl overflow-hidden border"
      style={{ height: '220px' }}
    />
  );
}
