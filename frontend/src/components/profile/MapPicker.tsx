"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, Layers } from "lucide-react";

// Fix for default marker icon in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  onLocate: () => void;
}

function LocationMarker({ lat, lng, onChange }: Omit<MapPickerProps, "onLocate">) {
  const [position, setPosition] = useState<L.LatLng | null>(lat && lng ? new L.LatLng(lat, lng) : null);
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (lat && lng) {
      const newPos = new L.LatLng(lat, lng);
      setPosition(newPos);
      map.flyTo(newPos, map.getZoom() < 16 ? 16 : map.getZoom()); 
    }
  }, [lat, lng, map]);

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function MapPicker({ lat, lng, onChange, onLocate }: MapPickerProps) {
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");

  return (
    <div className="w-full h-[250px] md:h-[300px] rounded-2xl overflow-hidden border border-border shadow-inner relative group isolate">
      <MapContainer
        center={[lat || 10.762622, lng || 106.660172]}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        {mapType === "standard" ? (
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; Google Maps'
            url="http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}"
          />
        )}

        {/* Manual Toggle Button for cleaner UI */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
            <button 
                type="button"
                onClick={() => setMapType(prev => prev === "standard" ? "satellite" : "standard")}
                className="p-2.5 bg-background border border-border rounded-xl shadow-lg text-foreground hover:bg-muted transition-all active:scale-95 flex items-center gap-2 text-xs font-bold"
            >
                <Layers size={16} />
                {mapType === "standard" ? "Satellite View" : "Street View"}
            </button>
        </div>

        <LocationMarker lat={lat} lng={lng} onChange={onChange} />
      </MapContainer>
      
      {/* Floating Locate Button */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); onLocate(); }}
        className="absolute bottom-4 right-4 z-[400] p-3 bg-background border border-border rounded-full shadow-lg text-primary hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
        title="Locate Me"
      >
        <Navigation size={20} />
      </button>
    </div>
  );
}
