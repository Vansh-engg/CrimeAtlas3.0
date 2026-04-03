"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { CheckCircle2, Flag } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { MapMarker } from "@/lib/data";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  markers: MapMarker[];
  center?: [number, number] | null;
  onRateIncident?: (id: string | number, isTrue: boolean) => void;
  userRatings?: Record<string, 'real' | 'false'>;
}

function ZoomHandler({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && (center[0] !== 20.5937 || center[1] !== 78.9629)) {
      map.flyTo(center, 10, {
        duration: 2.5,
        easeLinearity: 0.25
      });
    }
  }, [center, map]);
  return null;
}

export default function MapComponent({ markers, center, onRateIncident, userRatings = {} }: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="w-full h-full bg-black animate-pulse" />;

  const initialCenter: [number, number] = [20.5937, 78.9629]; // India center

  return (
    <MapContainer 
      center={initialCenter} 
      zoom={5} 
      style={{ height: "100%", width: "100%", background: "#0c0c0c" }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {markers.map((marker) => (
        <Marker 
          key={marker.id} 
          position={[marker.lat, marker.lng]}
          icon={L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="pulse-marker" style="--marker-color: ${marker.severity === 'critical' ? '#ef4444' : '#eab308'}"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })}
        >
          <Popup>
            <div className="text-black min-w-[240px] max-w-[300px] font-sans">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-2">
                 <h3 className="font-black text-xs bg-red-100 text-red-800 px-2.5 py-1 rounded-md uppercase tracking-widest">{marker.type}</h3>
                 <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${marker.severity === 'critical' ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(220,38,38,0.4)]' : 'bg-amber-400 text-black'}`}>{marker.severity}</span>
              </div>

              {/* Photo Evidence */}
              {marker.imageUrl && (
                 <div className="mb-3 rounded-xl overflow-hidden border border-black/5 bg-neutral-100 h-32 w-full flex items-center justify-center">
                    <img src={marker.imageUrl} alt="Incident view" className="w-full h-full object-cover" />
                 </div>
              )}

              {/* Description */}
              <p className="text-xs text-neutral-800 leading-relaxed font-medium mb-4">
                 {marker.details}
              </p>
              
              {/* Community Validation Card */}
              <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-2xl">
                 <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">Trust Index</span>
                    <div className="flex gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-20" />
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500 opacity-20" />
                    </div>
                 </div>
                 
                  <div className="flex items-center gap-2">
                    {(() => {
                        const userVote = userRatings[String(marker.id)];
                        return (
                          <>
                            <button 
                              disabled={!!userVote}
                              onClick={(e) => { e.stopPropagation(); onRateIncident?.(marker.id, true); }} 
                              className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all border active:scale-95 group ${
                                userVote === 'real' 
                                  ? 'bg-green-500 text-white border-green-600 shadow-lg' 
                                  : 'bg-white hover:bg-green-50 text-green-600 border-neutral-200'
                              } ${userVote && userVote !== 'real' ? 'opacity-50 grayscale' : ''}`}
                            >
                              <CheckCircle2 className={`w-4 h-4 ${userVote === 'real' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                              <span className="text-[9px] font-black uppercase">Real ({marker.trueHits || 0})</span>
                            </button>
                            <button 
                              disabled={!!userVote}
                              onClick={(e) => { e.stopPropagation(); onRateIncident?.(marker.id, false); }} 
                              className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all border active:scale-95 group ${
                                userVote === 'false' 
                                  ? 'bg-red-600 text-white border-red-700 shadow-lg' 
                                  : 'bg-white hover:bg-red-50 text-red-600 border-neutral-200'
                              } ${userVote && userVote !== 'false' ? 'opacity-50 grayscale' : ''}`}
                            >
                              <Flag className={`w-4 h-4 ${userVote === 'false' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                              <span className="text-[9px] font-black uppercase">False ({marker.falseHits || 0})</span>
                            </button>
                          </>
                        );
                    })()}
                  </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      <ZoomHandler center={center || initialCenter} />
      
      <style>{`
        .pulse-marker {
          width: 12px;
          height: 12px;
          background: var(--marker-color);
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px var(--marker-color);
          animation: pulse-ring 1.5s infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          70% { transform: scale(3); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      `}</style>
    </MapContainer>
  );
}
