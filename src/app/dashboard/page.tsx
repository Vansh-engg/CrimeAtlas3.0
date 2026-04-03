"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Search, Filter, ShieldAlert, Activity, PieChart as PieIcon, MapPin } from "lucide-react";
import type { ChartData, CategoryData } from "@/lib/data";

interface StatItem {
  title: string;
  value: string;
  trend: string;
  icon: React.ElementType;
  color: string;
}

export default function DashboardPage() {

  const [trendData, setTrendData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [categoryTotal, setCategoryTotal] = useState(0);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("All Locations");
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(2024);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const { fetchAllCities, fetchAvailableYears } = await import('@/app/actions');
        const [cityData, yearData] = await Promise.all([fetchAllCities(), fetchAvailableYears()]);
        setCities(["All Locations", ...cityData]);
        setYears(yearData);
        if (yearData.length > 0) setSelectedYear(yearData[0]);
      } catch (e) {
        console.error("Failed to fetch initial controls data", e);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { fetchDashboardData } = await import('@/app/actions');
        const data = await fetchDashboardData(selectedCity, selectedYear);
        setTrendData(data.trendData);
        setCategoryData(data.categoryData);
        setCategoryTotal(data.categoryTotal);
        setStats([
          { title: "Total Crimes", value: data.stats.totalCrimes, trend: `${selectedYear} YTD`, icon: Activity, color: "text-red-500" },
          { title: "Risk Level", value: data.stats.riskLevel, trend: "Annual", icon: ShieldAlert, color: "text-orange-500" },
          { title: "Most Common", value: data.stats.mostCommon, trend: "Type", icon: PieIcon, color: "text-red-400" },
          { title: "Active Zones", value: data.stats.activeZones, trend: selectedCity === "All Locations" ? "Cities" : "Local", icon: MapPin, color: "text-white" }
        ]);
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedCity, selectedYear]);

  const COLORS = ['#ef4444', '#f87171', '#991b1b', '#fca5a5'];

  if (isLoading) {
    return (
      <div className="pt-8 pb-12 w-full max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-12 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Crime Dashboard</h1>
          <p className="text-white/50 text-lg">Real-time analytics and predictive trends overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-red-500 transition-colors" />
            <select 
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 w-64 text-white appearance-none cursor-pointer hover:bg-white/10 transition-all"
            >
              {cities.map(city => (
                <option key={city} value={city} className="bg-neutral-900 text-white">{city}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            </div>
          </div>

          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-red-500 transition-colors" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-full pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 w-32 text-white appearance-none cursor-pointer hover:bg-white/10 transition-all font-bold"
            >
              {years.map(y => (
                <option key={y} value={y} className="bg-neutral-900 text-white">{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group hover:bg-white/10 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl rounded-full" />
            <div className="flex justify-between items-start">
              <span className="text-white/60 font-medium">{stat.title}</span>
              <stat.icon className={`h-5 w-5 ${stat.color} opacity-80`} />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-white">{stat.value}</span>
              <span className="text-sm font-medium text-red-400/80">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Line */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl min-h-[400px]">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            Crime Trends (6 Months)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCrimes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="crimes" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCrimes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl min-h-[400px] flex flex-col">
          <h3 className="text-xl font-semibold mb-6">Distribution</h3>
          <div className="flex-1 h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-2xl font-bold text-white block">
                {categoryTotal > 1000 ? `${(categoryTotal/1000).toFixed(1)}k` : categoryTotal}
              </span>
              <span className="text-xs text-white/50 uppercase tracking-widest">Total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
