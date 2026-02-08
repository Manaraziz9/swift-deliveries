import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  score?: number;
}

interface MerchantsMapProps {
  markers: MapMarker[];
  onMarkerClick?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
}

export default function MerchantsMap({ markers, onMarkerClick, center = [24.7136, 46.6753], zoom = 12 }: MerchantsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView(center, zoom);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstance.current);

      markersLayer.current = L.layerGroup().addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!markersLayer.current) return;

    markersLayer.current.clearLayers();

    markers.forEach(marker => {
      if (marker.lat && marker.lng) {
        const goldIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background: linear-gradient(135deg, hsl(35, 85%, 52%) 0%, hsl(38, 80%, 65%) 100%);
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="
                transform: rotate(45deg);
                color: white;
                font-weight: bold;
                font-size: 11px;
              ">${marker.score ? marker.score.toFixed(1) : '★'}</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const m = L.marker([marker.lat, marker.lng], { icon: goldIcon })
          .bindPopup(`<strong>${marker.name}</strong>`)
          .addTo(markersLayer.current!);

        m.on('click', () => {
          onMarkerClick?.(marker.id);
        });
      }
    });

    // Fit bounds if markers exist
    if (markers.length > 0) {
      const validMarkers = markers.filter(m => m.lat && m.lng);
      if (validMarkers.length > 0) {
        const bounds = L.latLngBounds(validMarkers.map(m => [m.lat, m.lng]));
        mapInstance.current?.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [markers, onMarkerClick]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: '200px' }}
    />
  );
}
