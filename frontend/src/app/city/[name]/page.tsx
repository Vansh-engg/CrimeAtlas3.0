"use client";

import { usePathname, useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingDown, MapPin, AlertTriangle, Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import type { CityTrendData } from "@/lib/data";

export default function CityInsightsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const city = pathname.split('/').pop()?.toUpperCase() || "MUMBAI";
  const [data, setData] = useState<CityTrendData[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [summary, setSummary] = useState({ 
    score: 42, 
    total: "3.2k", 
    crimes: [{ type: "Theft", count: 1200 }, { type: "Assault", count: 850 }, { type: "Robbery", count: 500 }],
    lat: 19.07,
    lng: 72.87,
    nodeId: "NOD-101"
  });
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedCrime, setSelectedCrime] = useState("Total");

  useEffect(() => {
    async function loadControls() {
       const { fetchAllCities, fetchAvailableYears } = await import('@/app/actions');
       const [cityList, yearList] = await Promise.all([fetchAllCities(), fetchAvailableYears()]);
       setCities(cityList);
       setYears(yearList);
       if (yearList.length > 0) setSelectedYear(yearList[0]);
    }
    loadControls();
  }, []);

  useEffect(() => {
    async function loadData() {
      const { fetchCityData, fetchSafetyData } = await import('@/app/actions');
      const stats = await fetchCityData(city, selectedYear, selectedCrime);
      const safety = await fetchSafetyData(city, selectedYear);
      
      setData(stats);
      if (safety) {
        setSummary({
          score: safety.score,
          total: stats.reduce((acc: number, curr: CityTrendData) => acc + curr.crimes, 0).toLocaleString(),
          crimes: safety.crimes,
          lat: safety.lat,
          lng: safety.lng,
          nodeId: `NOD-${Math.floor(Math.random()*900+100)}`
        });
      }
    }
    loadData();
  }, [city, selectedYear, selectedCrime]);

  const handleCityChange = (newCity: string) => {
    router.push(`/city/${newCity.toLowerCase()}`);
  };

  return (
    <div className="pt-24 pb-16 w-full max-w-7xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
      
      {/* Header Profile */}
      <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full" />
        
        <div className="z-10 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <span className="bg-red-500/10 text-red-500 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest border border-red-500/20 whitespace-nowrap">High Risk Zone</span>
            <div className="relative group w-full sm:w-auto">
              <select 
                value={city.charAt(0) + city.slice(1).toLowerCase()}
                onChange={(e) => handleCityChange(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 text-white appearance-none cursor-pointer w-full sm:w-64 hover:bg-white/10 transition-all font-semibold"
              >
                {cities.map(c => (
                  <option key={c} value={c} className="bg-neutral-900 text-white">{c}</option>
                ))}
              </select>
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500/60" />
            </div>

            <div className="relative group w-full sm:w-auto">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 text-white appearance-none cursor-pointer w-full sm:w-32 hover:bg-white/10 transition-all font-bold"
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-neutral-900 text-white">{y}</option>
                ))}
              </select>
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500/60" />
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/30">{city}</h1>
          <p className="text-white/50 text-2xl font-light mt-3">Comprehensive safety and zone analysis.</p>
        </div>

        <div className="flex items-center gap-8 z-10 w-full md:w-auto p-6 bg-black/40 rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="text-center">
            <span className="text-5xl font-bold text-red-500 block">{summary.score}</span>
            <span className="text-white/40 text-sm uppercase tracking-widest mt-1 block">Safety Score</span>
          </div>
          <div className="h-16 w-px bg-white/10" />
          <div className="text-center">
             <span className="text-5xl font-bold text-white block">{summary.total}</span>
             <span className="text-white/40 text-sm uppercase tracking-widest mt-1 block">{selectedYear} YTD Crimes</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-8 rounded-[2rem] flex flex-col gap-2 h-fit">
          <div className="flex items-center justify-between mb-2">
             <h3 className="text-xl font-bold text-white/90 tracking-tight">Crime Distribution</h3>
             <AlertTriangle className="h-6 w-6 text-red-500/80" />
          </div>
          <p className="text-white/40 text-sm mb-4">Categorized breakdown of annual reported offences.</p>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             {summary.crimes.map((item, i) => (
                <div key={item.type} className="group p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white/80 font-medium">{i+1}. {item.type}</span>
                    <span className="text-red-500 font-bold tabular-nums">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-500 h-full rounded-full opacity-60" 
                      style={{ width: `${Math.min(100, item.count / 10)}%` }} 
                    />
                  </div>
                </div>
             ))}
          </div>
        </div>
        
        <div className="glass-panel p-8 rounded-[2rem] lg:col-span-2 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[60px] rounded-full pointer-events-none" />
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
             <div className="space-y-1">
                <h3 className="text-xl font-bold text-white/90 tracking-tight">Monthly Trend Analysis</h3>
                <p className="text-xs text-white/40 font-medium">Tracking {selectedCrime.toLowerCase()} patterns over {selectedYear}.</p>
             </div>
             
             <div className="flex items-center gap-3">
               <div className="relative group">
                 <select 
                   value={selectedCrime}
                   onChange={(e) => setSelectedCrime(e.target.value)}
                   className="bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 text-white appearance-none cursor-pointer hover:bg-white/10 transition-all font-semibold"
                   style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: '#fff' }}
                 >
                   <option value="Total" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Total Crimes</option>
                   {summary.crimes.map(c => (
                     <option key={c.type} value={c.type} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{c.type}</option>
                   ))}
                 </select>
                 <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-red-500/60 pointer-events-none" />
               </div>
               <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/10 font-bold">
                 <TrendingDown className="h-4 w-4" /> 12%
               </div>
             </div>
           </div>
           <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="crimes" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#000', stroke: '#ef4444', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Mini Map Section */}
      <div className="glass-panel p-8 rounded-[2rem] overflow-hidden relative min-h-[300px]">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#ff0000 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center h-full">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <MapPin className="text-red-500" /> Spatial Intelligence
            </h3>
            <p className="text-white/40 max-w-md">
              Targeted monitoring active for the {city} sector. Cross-referencing real-time incident reports with historical density patterns.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/60 border border-white/10 uppercase tracking-widest font-mono">Lat: {summary.lat.toFixed(2)}° N</span>
              <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/60 border border-white/10 uppercase tracking-widest font-mono">Lng: {summary.lng.toFixed(2)}° E</span>
            </div>
          </div>
          <div className="w-full md:w-1/2 aspect-video bg-black/40 rounded-3xl border border-white/10 relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 opacity-20" 
                  style={{ backgroundImage: 'linear-gradient(to right, #ffffff11 1px, transparent 1px), linear-gradient(to bottom, #ffffff11 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             <div className="relative">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-ping absolute duration-1000" />
                <div className="w-4 h-4 bg-red-600 rounded-full relative z-10 shadow-[0_0_15px_#dc2626]" />
             </div>
             <div className="absolute bottom-4 right-4 text-[10px] text-white/20 font-mono tracking-tighter uppercase">
               Active Monitoring Node: {city.slice(0,3)}-{summary.nodeId}
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
