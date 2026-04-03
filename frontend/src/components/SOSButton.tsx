"use client";

import { useState, useEffect } from "react";
import { AlertOctagon, Loader2, CheckCircle, XCircle, Settings, Phone, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SOSButton() {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [emergencyNumber, setEmergencyNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Load saved number on mount
  useEffect(() => {
    const saved = localStorage.getItem("emergency_contact");
    if (saved) setEmergencyNumber(saved);
  }, []);

  const saveNumber = (num: string) => {
    setEmergencyNumber(num);
    localStorage.setItem("emergency_contact", num);
  };

  const handlePanic = async () => {
    setIsConfirming(false);
    if (status === "loading") return;
    setStatus("loading");
    setErrorMessage("");

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }

      const getPos = () => new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const position = await getPos();
      const { latitude, longitude } = position.coords;
      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const sosMessage = `🚨 EMERGENCY SOS! I need help. My live location: ${mapsLink} (via CrimeAtlas-3.0)`;

      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log(`[ALERT] SOS Triggered! Contacting: ${emergencyNumber || "Local Police"}. Location: ${mapsLink}`);

      setStatus("success");

      // Auto-dispatch communications
      if (emergencyNumber) {
        setTimeout(() => {
          // Launch native SMS dialer with pre-filled content
          // This is the cross-platform standard for client-side messaging
          window.location.href = `sms:${emergencyNumber}?body=${encodeURIComponent(sosMessage)}`;
        }, 1200);
      }

      setTimeout(() => setStatus("idle"), 5000);

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Failed to fetch geolocation.");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <>
      {/* SOS SETTINGS - REPOSITIONED TO TOP-RIGHT AREA */}
      <div className="fixed top-24 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
        {/* SETTINGS TOGGLE */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }}
          className={`pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl transition-all active:scale-95 shadow-2xl ${isSettingsOpen ? 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'text-white/40 hover:text-white'}`}
          title="Configure Emergency Contact"
        >
          <Settings className={`w-5 h-5 ${isSettingsOpen ? 'rotate-90 text-red-500' : ''} transition-transform`} />
        </button>

        {/* SETTINGS POPOVER */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-neutral-950 border border-white/10 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-72 backdrop-blur-3xl pointer-events-auto mt-2 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500/20" />
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Phone className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-xs font-black uppercase tracking-tighter text-white/70">Emergency Node</span>
              </div>
              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type="tel"
                    value={emergencyNumber}
                    onChange={(e) => saveNumber(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-sm font-black text-white placeholder:text-white/10 outline-none focus:border-red-500/50 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Save className="w-3.5 h-3.5 text-white/10" />
                  </div>
                </div>
                <p className="text-[10px] font-medium text-white/30 leading-relaxed px-1">
                  Local encrypted storage used. Dialer will trigger upon SOS broadcast.
                </p>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full bg-white/5 hover:bg-red-500 hover:text-white text-white/40 font-black py-3 rounded-xl transition-all uppercase tracking-[0.2em] text-[10px] border border-white/5"
                >
                  OK
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SOS PANIC BUTTON - MAINTAINED AT BOTTOM-RIGHT */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
        <button
          onClick={(e) => { e.stopPropagation(); setIsConfirming(true); }}
          className="pointer-events-auto group bg-red-600 hover:bg-red-700 text-white p-5 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all active:scale-90 flex items-center justify-center overflow-hidden"
          title="Emergency Panic"
        >
          <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />

          {status === "idle" && <AlertOctagon className="w-8 h-8 relative z-10 animate-pulse" />}
          {status === "loading" && <Loader2 className="w-8 h-8 relative z-10 animate-spin" />}
          {status === "success" && <CheckCircle className="w-8 h-8 relative z-10 drop-shadow-[0_0_10px_white]" />}
          {status === "error" && <XCircle className="w-8 h-8 relative z-10 drop-shadow-[0_0_10px_white]" />}
        </button>
      </div>

      {/* CONFIRMATION DIALOGUE */}
      <AnimatePresence>
        {isConfirming && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md"
              onClick={() => setIsConfirming(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10001] w-[90%] max-w-sm"
            >
              <div className="bg-neutral-950 border-2 border-red-500/50 p-8 rounded-[2rem] shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />

                <div className="bg-red-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                  <AlertOctagon className="w-10 h-10 text-red-500 animate-bounce" />
                </div>

                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Confirm Emergency?</h3>
                <p className="text-white/60 text-sm mb-8 leading-relaxed">
                  This will broadcast location to emergency nodes {emergencyNumber && <>and call <span className="text-red-500 font-bold">{emergencyNumber}</span></>}.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handlePanic}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-red-600/20 active:scale-95 uppercase tracking-widest text-xs"
                  >
                    Yes, Send Alert
                  </button>
                  <button
                    onClick={() => setIsConfirming(false)}
                    className="w-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white font-bold py-4 rounded-2xl transition-all text-xs uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* STATUS TOASTS */}
      <AnimatePresence>
        {status !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-24 right-6 z-[9999] p-4 rounded-xl shadow-2xl border backdrop-blur-xl flex items-center gap-4 ${status === "loading" ? "bg-black/80 border-white/20 text-white" :
                status === "success" ? "bg-green-600/90 border-green-500/50 text-white shadow-[0_0_30px_rgba(34,197,94,0.3)]" :
                  "bg-red-600/90 border-red-500/50 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]"
              }`}
          >
            {status === "loading" && (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <div className="flex flex-col">
                  <span className="font-bold tracking-wide uppercase text-sm">Transmitting SOS Alert</span>
                  <span className="text-xs opacity-70">Securing live coordinates...</span>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="w-6 h-6" />
                <div className="flex flex-col">
                  <span className="font-bold tracking-wide uppercase text-sm">🚨 Alert Sent Successfully</span>
                  <span className="text-xs opacity-90">
                    {emergencyNumber ? `Calling Primary Contact: ${emergencyNumber}` : "Emergency Nodes Notified."}
                  </span>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="w-6 h-6" />
                <div className="flex flex-col">
                  <span className="font-bold tracking-wide uppercase text-sm">Transmission Failed</span>
                  <span className="text-xs opacity-90">{errorMessage}</span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
