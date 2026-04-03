"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { DivIcon, Icon } from "leaflet";

interface PoliceStation {
  name: string;
  lat: number;
  lon: number;
}

type OverpassElement = {
  lat: number;
  lon: number;
  tags?: {
    name?: string;
  };
};

type OverpassResponse = {
  elements: OverpassElement[];
};

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

export default function PoliceLocator() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocationIcon, setUserLocationIcon] = useState<Icon | DivIcon | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initLeaflet() {
      const leaflet = await import("leaflet");

      const defaultProto = leaflet.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
      delete defaultProto._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const icon = new leaflet.DivIcon({
        className: "custom-user-marker",
        html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-10 w-10 rounded-full bg-red-500 opacity-75 animate-ping"></span>
          <span class="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white"></span>
        </div>
        `,
        iconSize: [30, 30],
      });

      if (mounted) {
        setUserLocationIcon(icon);
      }
    }

    initLeaflet();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setUserLocation([lat, lon]);

        const query = `
        [out:json];
        node(around:5000,${lat},${lon})["amenity"="police"];
        out;
        `;

        fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
          },
          body: query,
        })
          .then((res) => res.json())
          .then((data: OverpassResponse) => {
            const policeStations = data.elements.map((el) => ({
              name: el.tags?.name || "Police Station",
              lat: el.lat,
              lon: el.lon,
            }));
            setStations(policeStations);
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
          });
      },
      () => {
        setIsLoading(false);
      }
    );
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">🔍</div>
          <p className="text-xl">Locating nearby police stations...</p>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl">Please allow location access to find nearby police stations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl md:text-5xl font-bold text-red-500 mb-8">
        🚓 Nearby Police Stations
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAP */}
        <div className="lg:col-span-2 border border-red-600 rounded-2xl overflow-hidden shadow-lg">
          <MapContainer
            center={userLocation}
            zoom={14}
            style={{ height: "600px", width: "100%" }}
            className="h-full w-full"
          >
            <TileLayer
              attribution="© OpenStreetMap & CARTO"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* USER LOCATION */}
            <Marker position={userLocation} {...(userLocationIcon ? { icon: userLocationIcon } : {})}>
              <Popup>
                <div className="text-center font-semibold text-red-600">You are here</div>
              </Popup>
            </Marker>

            {/* POLICE MARKERS */}
            {stations.map((station, index) => (
              <Marker key={index} position={[station.lat, station.lon]}>
                <Popup>
                  <div className="space-y-2">
                    <h2 className="font-semibold text-red-600">{station.name}</h2>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline text-sm hover:text-blue-400"
                    >
                      Navigate →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* STATION LIST */}
        <div className="space-y-4 max-h-150 overflow-y-auto pr-2">
          {stations.length > 0 ? (
            stations.map((station, index) => (
              <div
                key={index}
                className="bg-neutral-900 border border-red-600 p-5 rounded-xl hover:border-red-500 hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <h2 className="text-red-400 font-semibold text-lg mb-2">
                  {station.name}
                </h2>

                <p className="text-xs text-gray-400 mb-3 font-mono">
                  Lat: {station.lat.toFixed(4)} | Lng: {station.lon.toFixed(4)}
                </p>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full text-center bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Navigate
                </a>
              </div>
            ))
          ) : (
            <div className="bg-neutral-900 border border-red-600 p-10 rounded-xl text-center text-gray-400">
              <p>No nearby police stations found in this area.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
