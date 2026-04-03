"use client";

import { useState, useEffect } from "react";
import { X, Camera, MapPin, Loader2, AlertTriangle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { MapMarker } from "@/lib/data";

interface IncidentReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: MapMarker) => void;
}

export default function IncidentReportingModal({ isOpen, onClose, onSubmit }: IncidentReportingModalProps) {
  const [type, setType] = useState("Suspicious Activity");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fetch location on open
  useEffect(() => {
    if (isOpen && !location) {
      handleGetLocation();
    }
  }, [isOpen]);

  const handleGetLocation = () => {
    setIsFetchingLocation(true);
    setLocationError("");
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported.");
      setIsFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setIsFetchingLocation(false);
      },
      (err) => {
        setLocationError("Failed to pinpoint location.");
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      setLocationError("Location is required.");
      return;
    }

    setIsSubmitting(true);

    // Simulate backend network request to supabase/firebase
    await new Promise((res) => setTimeout(res, 1500));

    // Handle image preview URL for local demo
    let imageUrl = "";
    if (image) {
      imageUrl = URL.createObjectURL(image);
    }

    const newIncident: MapMarker = {
      id: `inc_${Math.random().toString(36).substr(2, 9)}`,
      x: 0,
      y: 0,
      lat: location.lat,
      lng: location.lng,
      type: type,
      severity: "critical", // treat user reported as critical initially
      details: description || "User reported incident. Pending verification.",
      imageUrl: imageUrl,
      trueHits: 0,
      falseHits: 0,
      categoryCounts: {
         [type]: 1
      }
    };

    onSubmit(newIncident);
    setIsSubmitting(false);
    
    // Reset form
    setType("Suspicious Activity");
    setDescription("");
    setImage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1001] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1002] w-full max-w-lg"
          >
            <div className="bg-neutral-950 border border-white/10 p-6 md:p-7 rounded-[2.5rem] shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
               {/* Decorative background glow */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[80px] rounded-full pointer-events-none" />

               <div className="flex items-center justify-between mb-8 relative flex-shrink-0">
                 <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                   <AlertTriangle className="text-red-500 h-6 w-6" />
                   Report Incident
                 </h2>
                 <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                   <X className="h-5 w-5 text-white/60" />
                 </button>
               </div>

               <form onSubmit={handleSubmit} className="space-y-12 relative overflow-y-auto flex-1 pr-4 pl-1 pb-4">
                 
                 {/* Incident Type */}
                 <div className="space-y-3">
                   <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Type</label>
                   <select 
                     value={type}
                     onChange={(e) => setType(e.target.value)}
                     className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-500/50 outline-none text-sm font-medium hover:bg-white/5 transition-all text-white appearance-none cursor-pointer"
                   >
                     <option value="Theft">Theft</option>
                     <option value="Harassment">Harassment</option>
                     <option value="Suspicious Activity">Suspicious Activity</option>
                     <option value="Road Block">Road Block</option>
                     <option value="Violence">Violence / Assault</option>
                   </select>
                 </div>

                 {/* GPS Location Area */}
                 <div className="space-y-3">
                   <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Coordinates (Live)</label>
                   <div 
                      className={`w-full border rounded-2xl p-4 flex items-center justify-between transition-colors ${location ? 'bg-red-500/10 border-red-500/30' : 'bg-black/50 border-white/10'}`}
                    >
                      <div className="flex items-center gap-3">
                        {isFetchingLocation ? (
                           <Loader2 className="h-5 w-5 text-red-500 animate-spin" />
                        ) : (
                           <MapPin className={`h-5 w-5 ${location ? 'text-red-500' : 'text-white/40'}`} />
                        )}
                        <div>
                          {location ? (
                            <p className="text-sm font-mono font-bold text-red-400">
                              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                            </p>
                          ) : (
                            <p className="text-sm font-medium text-white/40">
                              {locationError || "Awaiting GPS Signal..."}
                            </p>
                          )}
                        </div>
                      </div>
                      {!location && !isFetchingLocation && (
                         <button type="button" onClick={handleGetLocation} className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wider">
                           Retry
                         </button>
                      )}
                   </div>
                 </div>

                 {/* Description */}
                 <div className="space-y-3">
                   <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Context</label>
                   <textarea 
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     placeholder="Provide any identifiable details, suspect descriptions, or immediate risks..."
                     rows={2}
                     className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 focus:ring-2 focus:ring-red-500/50 outline-none text-sm font-medium hover:bg-white/5 transition-all text-white placeholder:text-white/20 resize-none"
                   />
                 </div>

                 {/* Image Upload */}
                 <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-2">Evidence (Optional)</label>
                    <label className="flex items-center gap-3 w-full bg-black/50 border border-white/10 border-dashed rounded-2xl p-4 cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all">
                       <div className="bg-white/10 p-3 rounded-xl">
                         <Camera className="text-white/60 h-5 w-5" />
                       </div>
                       <div className="text-sm font-medium text-white/60">
                         {image ? image.name : "Tap to capture or upload photo"}
                       </div>
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         onChange={handleFileChange}
                       />
                    </label>

                    {image && (
                       <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-white/10 bg-black">
                          <img 
                             src={URL.createObjectURL(image)} 
                             alt="Preview" 
                             className="w-full h-full object-cover opacity-80" 
                          />
                          <button 
                             type="button"
                             onClick={() => setImage(null)}
                             className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black rounded-full"
                          >
                             <X className="w-4 h-4 text-white" />
                          </button>
                       </div>
                    )}
                 </div>

                 {/* Submit */}
                 <button
                    type="submit"
                    disabled={isSubmitting || !location}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 flex-shrink-0 mt-12"
                  >
                    {isSubmitting ? (
                      <>Transmitting <Loader2 className="h-5 w-5 animate-spin" /></>
                    ) : (
                      <>Broadcast Alert <Send className="h-5 w-5" /></>
                    )}
                 </button>
               </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
