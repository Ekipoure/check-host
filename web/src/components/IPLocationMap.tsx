"use client";

import { useEffect, useRef, useState } from "react";

interface IPLocationMapProps {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  className?: string;
}

// Fix for default marker icon in Next.js
const createIcon = (leaflet: any) => {
  if (!leaflet) return null;
  return leaflet.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const IPLocationMap: React.FC<IPLocationMapProps> = ({
  latitude,
  longitude,
  city,
  country,
  className = "",
}) => {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<any>(null);

  // Dynamically import Leaflet only on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => {
        // Import CSS dynamically
        import("leaflet/dist/leaflet.css");
        setL(leaflet.default);
        setIsClient(true);
      });
    }
  }, []);

  // Initialize map once when client is ready
  useEffect(() => {
    if (!isClient || !L || !mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 10,
      zoomControl: true,
      attributionControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Add marker
    const icon = createIcon(L);
    const marker = L.marker([latitude, longitude], { icon: icon || undefined });
    
    // Add popup if city/country info available
    const popupText = [city, country].filter(Boolean).join(", ") || "IP Location";
    marker.bindPopup(popupText).openPopup();
    
    marker.addTo(mapRef.current);
    markerRef.current = marker;

    // Cleanup function - only on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isClient]);

  // Update map center and marker when coordinates change
  useEffect(() => {
    if (!isClient || !L || !mapRef.current) return;

    mapRef.current.setView([latitude, longitude], 10);
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      const popupText = [city, country].filter(Boolean).join(", ") || "IP Location";
      markerRef.current.setPopupContent(popupText).openPopup();
    }
  }, [isClient, latitude, longitude, city, country]);

  if (!isClient) {
    return (
      <div className={`relative ${className} bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center`} style={{ minHeight: "300px" }}>
        <div className="text-center text-slate-500 dark:text-slate-400">
          <svg className="animate-spin h-6 w-6 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: "300px" }}>
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
        style={{ minHeight: "300px", height: "100%" }}
      />
    </div>
  );
};

export default IPLocationMap;

