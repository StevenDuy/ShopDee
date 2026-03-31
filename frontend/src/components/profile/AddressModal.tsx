"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MapPin, Loader2, Navigation, Check } from "lucide-react";
import axios from "axios";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => <div className="w-full h-[250px] md:h-[300px] bg-muted animate-pulse rounded-[2rem] flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">Loading Immersive Map...</div>
});

interface Address {
  id: number;
  type: string;
  address_line_1: string;
  city: string;
  country: string;
  lat?: string;
  lng?: string;
  is_default: boolean;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  address?: Address | null;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    quarter?: string;
    neighbourhood?: string;
    hamlet?: string;
    village?: string;
    city?: string;
    town?: string;
    state?: string;
    country?: string;
    postcode?: string;
    name?: string;
  };
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AddressModal({ isOpen, onClose, onSuccess, token, address }: AddressModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    type: "Home",
    custom_type: "",
    address_line_1: "",
    city: "",
    country: "Vietnam",
    lat: "",
    lng: "",
    is_default: false,
  });

  useEffect(() => {
    if (address && isOpen) {
      const isKnownType = ["Home", "Office"].includes(address.type);
      setFormData({
        type: isKnownType ? address.type : "Other",
        custom_type: isKnownType ? "" : address.type,
        address_line_1: address.address_line_1 || "",
        city: address.city || "",
        country: address.country || "Vietnam",
        lat: address.lat || "",
        lng: address.lng || "",
        is_default: !!address.is_default
      });
      setSearch(address.address_line_1);
    } else if (isOpen) {
      setFormData({
        type: "Home",
        custom_type: "",
        address_line_1: "",
        city: "",
        country: "Vietnam",
        lat: "",
        lng: "",
        is_default: false,
      });
      setSearch("");
      setResults([]);
      setShowResults(false);
    }
  }, [address, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getErrorMessage = (error: any) => {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      return t("profile_page.map_busy");
    }
    return t("profile_page.map_error");
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    setSearchError("");

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/proxy/search`, {
          params: { q: query },
          headers: { Authorization: `Bearer ${token}` }
        });
        setResults(res.data);
        setShowResults(true);
      } catch (error) {
        console.error("Search failed", error);
        setSearchError(getErrorMessage(error));
        setShowResults(false);
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  const handleSelect = (result: NominatimResult) => {
    const addr = result.address;
    const city = addr.city || addr.town || addr.village || addr.state || "";

    setFormData(prev => ({
      ...prev,
      address_line_1: result.display_name,
      city: city,
      country: addr.country || "Vietnam",
      lat: result.lat,
      lng: result.lon,
    }));
    setSearch(result.display_name);
    setShowResults(false);
  };

  const handleMapChange = async (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat: lat.toString(), lng: lng.toString() }));
    setSearchError("");

    try {
      const res = await axios.get(`${API}/proxy/reverse`, {
        params: { lat, lng },
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      if (data) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.state || "";
        setFormData(prev => ({
          ...prev,
          address_line_1: data.display_name,
          city: city,
        }));
        setSearch(data.display_name);
      }
    } catch (error) {
      console.warn("Reverse geocoding failed", error);
      setSearchError(getErrorMessage(error));
    }
  };

  const handleLocateMe = () => {
    setSearchError("");
    if (!navigator.geolocation) {
      setSearchError(t("profile_page.geo_not_supported"));
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleMapChange(position.coords.latitude, position.coords.longitude);
        setLoading(false);
      },
      (error) => {
        setSearchError(t("profile_page.geo_error"));
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const finalType = formData.type === "Other" ? formData.custom_type : formData.type;

    if (formData.type === "Other" && !formData.custom_type.trim()) {
      setSearchError(t("profile_page.custom_type_required"));
      setSaving(false);
      return;
    }

    const submissionData = {
      ...formData,
      type: (finalType || "Other").trim(),
    };

    try {
      if (address?.id) {
        await axios.put(`${API}/profile/addresses/${address.id}`, submissionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API}/profile/addresses`, submissionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-xl bg-card border border-border/50 rounded-t-[3rem] md:rounded-[3rem] shadow-2xl flex flex-col mt-auto md:my-auto max-h-[98vh] md:max-h-[90vh] overflow-hidden"
          >
            {/* Elite Header */}
            <div className="px-8 py-6 border-b border-border/10 flex items-center justify-between bg-card/80 backdrop-blur-xl z-30">
               <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <MapPin className="text-primary" size={24} />
                    {address ? t("profile_page.edit_address") : t("profile_page.add_address")}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-50">Specify delivery location</p>
               </div>
               <button title={t("profile_page.cancel")} onClick={onClose} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-white transition-all">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/5">
              <div className="p-8 md:p-10 space-y-10">

                {/* Global Search Interface */}
                <div className="space-y-4 relative z-[60]" ref={searchRef}>
                   <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Global Address Search</label>
                   <div className="relative group">
                      <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={20} />
                      <Input
                         placeholder={t("profile_page.search_placeholder")}
                         value={search}
                         onChange={(e) => handleSearch(e.target.value)}
                         className="h-14 pl-16 pr-6 bg-card border-border/50 rounded-2xl font-black text-sm tracking-tight shadow-sm focus-visible:bg-background focus-visible:ring-primary/10 transition-all placeholder:opacity-30 relative z-10"
                      />
                      {loading && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-primary opacity-50" size={18} />}
                   </div>
                   {searchError && <p className="text-[10px] text-destructive mt-1 font-black uppercase tracking-widest ml-4">{searchError}</p>}

                   <AnimatePresence>
                     {showResults && results.length > 0 && (
                       <motion.div
                         initial={{ opacity: 0, y: -10, scale: 0.98 }} 
                         animate={{ opacity: 1, y: 0, scale: 1 }} 
                         exit={{ opacity: 0, y: -10, scale: 0.98 }}
                         className="absolute z-[100] w-full mt-4 bg-card/80 backdrop-blur-2xl border border-border/50 rounded-[2rem] shadow-2xl overflow-hidden"
                       >
                         <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                           {results.map((res) => (
                             <button
                               key={res.place_id}
                               type="button"
                               onClick={() => handleSelect(res)}
                               className="w-full px-5 py-4 text-left hover:bg-primary/5 transition-all flex items-start gap-5 border-b border-border/5 last:border-0 group rounded-xl"
                             >
                               <div className="mt-1 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                 <Navigation size={18} />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <p className="text-[13px] font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2">{res.display_name}</p>
                                 <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                                   <span>{res.address.city || res.address.town || res.address.state || "Location"}</span>
                                   <span className="opacity-20">•</span>
                                   <span>{res.address.country}</span>
                                 </p>
                               </div>
                             </button>
                           ))}
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                   {/* Interactive Map Picker */}
                   <div className="space-y-4 relative z-0">
                      <div className="flex items-center justify-between ml-4">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t("profile_page.map_pick")}</label>
                         <button 
                            type="button" 
                            onClick={handleLocateMe}
                            className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
                         >
                            <Navigation size={10} className="fill-current" /> Use My Location
                         </button>
                      </div>
                      <div className="rounded-[2rem] overflow-hidden border border-border/50 shadow-inner bg-muted/20 h-[300px]">
                         <MapPicker
                           lat={parseFloat(formData.lat) || 10.762622}
                           lng={parseFloat(formData.lng) || 106.660172}
                           onChange={handleMapChange}
                           onLocate={handleLocateMe}
                         />
                      </div>
                   </div>

                   {/* Legacy Select Replacement (Premium Combobox) */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("profile_page.address_type")}</label>
                         <Select 
                           value={formData.type} 
                           onValueChange={(val) => setFormData({ ...formData, type: val })}
                         >
                            <SelectTrigger className="w-full h-14 px-6 bg-muted/20 border-border/50 rounded-2xl font-black text-sm uppercase tracking-widest focus:ring-primary/10 transition-all">
                               <SelectValue placeholder="TYPE" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-border/50 backdrop-blur-xl bg-card/80">
                               <SelectItem value="Home" className="font-bold uppercase text-[10px] tracking-widest">🏠 {t("profile_page.home") || "HOME"}</SelectItem>
                               <SelectItem value="Office" className="font-bold uppercase text-[10px] tracking-widest">🏢 {t("profile_page.office") || "OFFICE"}</SelectItem>
                               <SelectItem value="Other" className="font-bold uppercase text-[10px] tracking-widest">✨ {t("profile_page.other") || "OTHER"}</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>

                      {formData.type === "Other" && (
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("profile_page.custom_type_placeholder")}</label>
                            <Input
                              placeholder="e.g. GYM, VACATION HOUSE"
                              value={formData.custom_type}
                              onChange={(e) => setFormData({ ...formData, custom_type: e.target.value })}
                              className="h-14 bg-muted/20 border-border/50 rounded-2xl font-black text-sm uppercase tracking-tight"
                              required
                            />
                         </div>
                      )}
                   </div>

                   {/* High-Fidelity Textarea */}
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t("profile_page.detail_address")}</label>
                      <textarea
                        value={formData.address_line_1}
                        onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                        placeholder={t("profile_page.detail_placeholder")}
                        className="w-full px-6 py-5 bg-muted/20 border border-border/50 rounded-[2rem] font-black text-sm tracking-tight min-h-[140px] resize-none focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:opacity-20 leading-relaxed"
                        required
                      />
                   </div>

                   {/* Premium Checkbox Toggle */}
                   <div 
                      className={cn(
                         "flex items-center gap-4 bg-card/60 p-6 rounded-[1.5rem] border transition-all cursor-pointer group hover:bg-background",
                         formData.is_default ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border/50"
                      )}
                      onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}
                   >
                      <div className={cn(
                        "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all",
                        formData.is_default ? "bg-primary border-primary text-white" : "border-border/50 bg-background"
                      )}>
                        {formData.is_default && <Check size={18} strokeWidth={4} />}
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">{t("profile_page.set_as_default")}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-40 tracking-wider">Use this address for primary checkout</p>
                      </div>
                   </div>

                   {/* Elite Footer Actions */}
                   <div className="flex flex-col sm:flex-row gap-4 pt-10 sticky bottom-0 bg-gradient-to-t from-muted/50 to-transparent p-4 sm:p-0">
                      <Button 
                         type="button" 
                         variant="outline" 
                         onClick={onClose} 
                         className="flex-1 rounded-[1.5rem] h-16 font-black uppercase text-[11px] tracking-widest border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                      >
                       {t("profile_page.cancel")}
                      </Button>
                      <Button 
                         type="submit" 
                         disabled={saving} 
                         className="flex-[2] rounded-[1.5rem] h-16 font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
                      >
                       {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                       {saving ? t("profile_page.saving") : (address ? t("profile_page.update") : t("profile_page.add_address"))}
                      </Button>
                   </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
