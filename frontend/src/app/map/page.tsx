"use client";

import { useState, useEffect, useMemo } from "react";
import { Map as MapIcon, Filter, Flame, Search, ShieldAlert, Navigation, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import type { MapMarker } from "@/lib/data";
import IncidentReportingModal from "@/components/IncidentReportingModal";
import { supabase } from "@/lib/supabase";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/40 animate-pulse flex items-center justify-center text-white/40 font-mono tracking-widest uppercase">Initializing Tactical Grid...</div>
});

const crimeToTips: Record<string, string[]> = {
  "Theft": ["Keep your belongings secure in crowded areas.", "Use anti-theft bags when traveling.", "Avoid displaying expensive gadgets."],
  "Robbery": ["Avoid isolated ATMs after dark.", "Stay in well-lit, populated routes.", "Immediately report suspicious behavior to local nodes."],
  "Assault": ["Travel in groups whenever possible.", "Maintain high situational awareness.", "Enroll in basic self-defense programs."],
  "Murder": ["Maintain extreme caution in critical hazard zones.", "Report any organized crime activity immediately.", "Restrict late-night movement to minimum."],
  "Rape": ["Stick to busy streets and avoid unlit alleys.", "Share your live location with trusted friends/family.", "Keep emergency safety apps and contacts on speed dial."],
  "Kidnapping Abduction": ["Stay vigilant of surroundings in transit areas.", "Verify identity before engaging with strangers in remote areas.", "Avoid traveling through unmonitored sectors at night."],
  "Cyber Crime": ["Use multi-factor authentication for all sensitive accounts.", "Do not click on suspicious links or download unverified attachments.", "Regularly update security software and encrypt sensitive data."],
  "Dacoity": ["Travel in convoys through known hazard zones.", "Minimize travel time in high-intensity rural sectors.", "Avoid carrying bulk liquid assets or valuable goods."],
  "Grievous Hurt": ["De-escalate any verbal conflicts immediately.", "Identify escape routes in every operational sector.", "Call for node backup if local tension rises."]
};

export default function MapPage() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [historyMarkers, setHistoryMarkers] = useState<MapMarker[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [cityName, setCityName] = useState("");
  const [timeFilter, setTimeFilter] = useState("24H");
  const [isReportingOpen, setIsReportingOpen] = useState(false);
  const [userRatings, setUserRatings] = useState<Record<string, 'real' | 'false'>>({});

  useEffect(() => {
    async function loadData() {
      const { fetchMapData } = await import('@/app/actions');
      const apiData = await fetchMapData();
      
      // LOAD FROM SUPABASE
      const { data: cloudLive, error: liveError } = await supabase
        .from('live_incidents')
        .select('*')
        .eq('is_live', true);

      const { data: cloudHistory, error: historyError } = await supabase
        .from('incident_history')
        .select('*')
        .limit(100);

      let liveIncidents: MapMarker[] = cloudLive || [];
      let historicalIncidents: MapMarker[] = cloudHistory || [];

      // FALLBACK TO LOCAL IF SUPABASE FAILS OR NOT SETUP
      if (liveError || !cloudLive) {
        const savedLive = localStorage.getItem("live_incidents");
        if (savedLive) liveIncidents = JSON.parse(savedLive);
      }

      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      // LIFECYCLE MANAGEMENT: Check 24H threshold
      const newlyExpired = liveIncidents.filter(m => m.timestamp && (now - m.timestamp > twentyFourHours));
      const stillLive = liveIncidents.filter(m => !m.timestamp || (now - m.timestamp <= twentyFourHours));
      
      if (newlyExpired.length > 0) {
         // Migration logic (Archival)
         for (const incident of newlyExpired) {
            await supabase.from('incident_history').upsert({ ...incident, archived_at: new Date().toISOString() });
            await supabase.from('live_incidents').delete().eq('id', incident.id);
         }
         localStorage.setItem("incident_history", JSON.stringify([...newlyExpired, ...historicalIncidents]));
         localStorage.setItem("live_incidents", JSON.stringify(stillLive));
         setHistoryMarkers([...newlyExpired, ...historicalIncidents]);
      } else {
         setHistoryMarkers(historicalIncidents);
      }

      setMarkers([...stillLive, ...apiData]);
    }
    loadData();
  }, []);

  const persistLiveIncident = async (incident: MapMarker) => {
     // Cloud Insert
     const { error } = await supabase
        .from('live_incidents')
        .insert([{
           lat: incident.lat,
           lng: incident.lng,
           type: incident.type,
           severity: incident.severity,
           details: incident.details,
           description: incident.description,
           image_url: incident.imageUrl,
           true_hits: incident.trueHits || 0,
           false_hits: incident.falseHits || 0,
           timestamp: incident.timestamp,
           is_live: true
        }]);

     // Local Fallback Persistence
     const saved = localStorage.getItem("live_incidents");
     const live: MapMarker[] = saved ? JSON.parse(saved) : [];
     localStorage.setItem("live_incidents", JSON.stringify([incident, ...live]));
  };

  const handleSearch = async () => {
    if (!searchTerm) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchTerm}`);
      const data = await res.json();

      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        
        setCenter([lat, lon]);
        setCityName(data[0].display_name.split(",")[0]);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  const handleRateIncident = (id: string | number, isTrue: boolean) => {
    const stringId = String(id);
    const existingRating = userRatings[stringId];
    const newRating = isTrue ? 'real' : 'false';

    // If already rated the same way, do nothing (or toggle off)
    if (existingRating === newRating) return;

    setUserRatings(prev => ({ ...prev, [stringId]: newRating }));

    // CLOUD UPDATE (Supabase)
    const updateCloudRating = async (tHits: number, fHits: number) => {
       await supabase
         .from('live_incidents')
         .update({ true_hits: tHits, false_hits: fHits })
         .eq('id', id);
    };

    setMarkers(prev => prev.map(m => {
       if (m.id === id) {
          let updatedTrue = m.trueHits || 0;
          let updatedFalse = m.falseHits || 0;

          if (existingRating === 'false' && newRating === 'real') {
             updatedFalse = Math.max(0, updatedFalse - 1);
             updatedTrue += 1;
          } 
          else if (existingRating === 'real' && newRating === 'false') {
             updatedTrue = Math.max(0, updatedTrue - 1);
             updatedFalse += 1;
          }
          else if (!existingRating) {
             if (isTrue) updatedTrue += 1;
             else updatedFalse += 1;
          }

          updateCloudRating(updatedTrue, updatedFalse);

          return {
             ...m,
             trueHits: updatedTrue,
             falseHits: updatedFalse
          };
       }
       return m;
    }));
  };

  const currentRiskMarkers = useMemo(() => {
    if (!cityName) return [];
    return markers.filter(m => {
       const lat = center?.[0] || 0;
       const lon = center?.[1] || 0;
       const distance = Math.sqrt(Math.pow(m.lat - lat, 2) + Math.pow(m.lng - lon, 2)) * 111;
       return distance < 50;
    });
  }, [center, markers, cityName]);

  const topCrimes = useMemo(() => {
    if (currentRiskMarkers.length === 0) return [];
    
    const combinedCounts = new Map<string, number>();
    currentRiskMarkers.forEach(m => {
       if (m.categoryCounts) {
          Object.entries(m.categoryCounts).forEach(([type, count]) => {
             combinedCounts.set(type, (combinedCounts.get(type) || 0) + count);
          });
       }
    });

    return Array.from(combinedCounts.entries())
      .sort((a,b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  }, [currentRiskMarkers]);

  const riskLevel = useMemo(() => {
    if (currentRiskMarkers.length === 0) return "Low";
    const totalCount = currentRiskMarkers.reduce((acc, m) => acc + (m.details?.includes('Total recent reported crimes') ? parseInt(m.details.split(': ')[1]) : 0), 0);
    if (totalCount > 2000) return "High";
    if (totalCount > 500) return "Moderate";
    return "Low";
  }, [currentRiskMarkers]);

  const safetyTips = useMemo(() => {
    let tips: string[] = [];
    topCrimes.forEach(type => {
       const mapped = crimeToTips[type];
       if (mapped) tips.push(...mapped);
    });

    if (riskLevel === "High") tips.push("Restrict all non-essential movement in this sector.");
    if (riskLevel === "Moderate") tips.push("Maintain operational awareness levels.");

    return Array.from(new Set(tips)).slice(0, 5);
  }, [topCrimes, riskLevel]);

  return (
    <div className="fixed inset-0 pt-20 w-full h-full overflow-hidden animate-in fade-in duration-700 bg-black">
      
      {/* HUD OVERLAY - SEARCH */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-lg px-6">
          <div className="relative group flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30 group-focus-within:text-red-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search district, city or sector..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 text-white placeholder:text-white/20 shadow-2xl transition-all font-semibold"
              />
            </div>
            <button 
              onClick={handleSearch}
              className="bg-red-600 hover:bg-red-700 text-white px-8 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
            >
              LOCATE
            </button>
          </div>
          
          <div className="flex justify-center gap-2 mt-4">
             {["1H", "24H", "7D"].map(f => (
                <button 
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all uppercase tracking-widest border ${
                    timeFilter === f 
                    ? "bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                    : "bg-black/50 text-white/50 border-white/10 hover:bg-white/10"
                  }`}
                >
                  Last {f}
                </button>
             ))}
          </div>
      </div>

      {/* INTELLIGENCE PANEL */}
      {cityName && (
        <div className="absolute top-48 left-8 z-[1000] w-96 max-h-[calc(100vh-14rem)] overflow-y-auto no-scrollbar hidden lg:block">
            <div className="bg-black/60 backdrop-blur-3xl p-8 border border-white/10 rounded-[2.5rem] shadow-2xl space-y-6 animate-in slide-in-from-left-4 duration-500">
               <div>
                  <h2 className="text-3xl font-black tracking-tighter text-white">{cityName}</h2>
                  <div className="mt-3">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      riskLevel === "Low" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                      riskLevel === "Moderate" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                      "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {riskLevel} Risk Sector
                    </span>
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" /> Top Ranked Hazards
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topCrimes.map(type => (
                      <span key={type} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] text-red-500 font-black tracking-tight uppercase shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                        {type}
                      </span>
                    ))}
                    {topCrimes.length === 0 && <span className="text-white/20 text-xs italic">Operational clearance confirmed.</span>}
                  </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-blue-500" /> Directed Safety Protocols
                  </h3>
                  <ul className="space-y-3">
                    {safetyTips.map((tip, i) => (
                      <li key={i} className="flex gap-3 items-start group">
                         <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 group-hover:scale-150 transition-all shadow-[0_0_8px_#ef4444]" />
                         <span className="text-xs text-white/60 leading-relaxed font-medium">{tip}</span>
                      </li>
                    ))}
                  </ul>
               </div>

               <div className="pt-4 flex justify-between items-end border-t border-white/10 text-white/20 text-[10px] font-mono uppercase tracking-tighter">
                  <span>Feed Active</span>
                  <span>Grid: {center?.[0].toFixed(2)}, {center?.[1].toFixed(2)}</span>
               </div>
            </div>
        </div>
      )}

      {/* MAP VIEWER */}
      <div className="w-full h-full relative">
        <MapComponent 
          markers={markers} 
          center={center} 
          onRateIncident={handleRateIncident} 
          userRatings={userRatings}
        />
        
        {/* HUD - ACTION CONTROLS */}
        <div className="absolute top-24 right-8 z-[1000] flex flex-col gap-3">
           <button 
             onClick={() => setIsReportingOpen(true)}
             className="p-4 bg-red-600/90 backdrop-blur-3xl border border-red-500/50 rounded-2xl hover:bg-red-500 transition-all text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] group flex items-center justify-center relative hover:scale-105 active:scale-95"
             title="Report Incident"
           >
              <div className="absolute inset-0 bg-red-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
              <Plus className="h-6 w-6 relative z-10 animate-pulse group-hover:animate-none" />
           </button>
           <button className="p-4 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-red-500/30 transition-all text-white/70 shadow-2xl group">
              <Filter className="h-6 w-6 group-active:text-red-500 transition-colors" />
           </button>
           <button className="p-4 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-red-500/30 transition-all text-white/70 shadow-2xl group">
              <Navigation className="h-6 w-6 group-active:text-red-500 transition-colors" />
           </button>
        </div>

        {/* HUD - LEGEND */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[1000] px-4 w-full md:w-auto">
          <div className="bg-black/60 backdrop-blur-3xl px-8 py-3 rounded-full border border-white/10 flex items-center gap-8 text-[11px] text-white/40 font-bold uppercase tracking-widest shadow-2xl overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_#ef4444]" />
              Hazard
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_12px_#eab308]" />
              Monitored
            </div>
            <div className="flex items-center gap-3 whitespace-nowrap">
               <span className="text-red-500 font-mono tracking-tighter mr-2">LIVE</span>
               <span className="opacity-50">Operational Intelligence Enabled</span>
            </div>
          </div>
        </div>
      </div>

        <IncidentReportingModal 
           isOpen={isReportingOpen} 
           onClose={() => setIsReportingOpen(false)} 
           onSubmit={(newIncident) => {
             const incidentWithMeta = { ...newIncident, timestamp: Date.now(), isLive: true };
             setMarkers(prev => [incidentWithMeta, ...prev]);
             persistLiveIncident(incidentWithMeta);
             setCenter([newIncident.lat, newIncident.lng]);
             setCityName("Live Sector");
           }}
        />
    </div>
  );
}
