"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Map, LayoutDashboard, Building2, Brain, Crosshair, Menu, X, AlertCircle } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const routes = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "City Insights", path: "/city/mumbai", icon: Building2 },
    { name: "Prediction", path: "/predict", icon: Brain },
    { name: "Map", path: "/map", icon: Map },
    { name: "Police Locator", path: "/police", icon: Crosshair },
  ];

  const isActive = (path: string) => {
    return pathname.startsWith(path.split('/')[1] === '' ? 'nomatch' : `/${path.split('/')[1]}`);
  };

  return (
    <>
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50 transition-all duration-300 rounded-full ${
        scrolled 
          ? "bg-black/40 backdrop-blur-xl border border-red-500/30 shadow-[0_0_40px_-10px_#dc2626]" 
          : "bg-black/30 backdrop-blur-lg border border-white/10"
      } px-6 py-2 mb-4 flex items-center`}>
        <div className="flex items-center justify-between gap-4">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2.5 group px-3 py-1.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_-5px_#dc2626] transition-all duration-300">
              <Image 
                src="/logo.png" 
                alt="CrimeAtlas" 
                width={32} 
                height={32}
                className="rounded-lg object-contain"
              />
            </div>
            <span className="font-bold text-sm hidden sm:block tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-red-400 group-hover:to-red-300 transition-all">
              CrimeAtlas
            </span>
          </Link>

          {/* Divider */}
          <div className="h-6 w-px bg-white/10 mx-3 hidden sm:block"></div>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-2">
            {routes.map((route) => {
              const active = isActive(route.path);
              return (
                <Link 
                  key={route.path} 
                  href={route.path}
                  className="relative px-3 py-1.5 group"
                >
                  <div className={`flex items-center gap-1.5 text-xs font-semibold transition-all duration-300 ${
                    active 
                      ? "text-red-400" 
                      : "text-white/60 group-hover:text-white"
                  }`}>
                    <route.icon className={`h-3.5 w-3.5 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`} />
                    <span className="hidden xl:inline">{route.name}</span>
                  </div>
                  
                  {/* Active Indicator */}
                  {active && (
                    <div className="absolute bottom-1 left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full"></div>
                  )}
                  
                  {/* Hover Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </Link>
              )
            })}
          </div>

          {/* SOS Button */}
          <a 
            href="#sos"
            className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-full text-xs flex items-center gap-1.5 shadow-[0_0_20px_-5px_#dc2626] hover:shadow-[0_0_30px_-5px_#dc2626] transition-all duration-300 group ml-4 hidden sm:flex"
          >
            <AlertCircle className="h-3.5 w-3.5 group-hover:animate-pulse" />
            <span className="hidden sm:inline">SOS</span>
          </a>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="lg:hidden p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] bg-gradient-to-b from-black/95 to-black/85 backdrop-blur-xl border border-red-500/20 rounded-2xl p-3 flex flex-col gap-2 lg:hidden z-40 animate-in fade-in scale-95 duration-300">
          {routes.map((route, i) => {
            const active = isActive(route.path);
            return (
              <Link 
                key={route.path} 
                href={route.path}
                onClick={() => setIsOpen(false)}
                style={{ animationDelay: `${i * 50}ms` }}
                className="group animate-in fade-in slide-in-from-left-4 duration-300"
              >
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-300 ${
                  active 
                    ? "bg-gradient-to-r from-red-500/20 to-red-500/10 border border-red-500/30 text-red-400" 
                    : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-transparent hover:border-white/10"
                }`}>
                  <route.icon className={`h-4 w-4 transition-transform duration-300 ${active ? "text-red-500 scale-110" : "group-hover:scale-110"}`} />
                  <span className="font-medium text-sm flex-1">{route.name}</span>
                  {active && <div className="h-2 w-2 rounded-full bg-red-500"></div>}
                </div>
              </Link>
            )
          })}
          
          {/* Mobile SOS Button */}
          <button className="mt-2 w-full px-3 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_#dc2626] transition-all duration-300 text-sm">
            <AlertCircle className="h-4 w-4" />
            Emergency SOS
          </button>
        </div>
      )}
    </>
  );
}
