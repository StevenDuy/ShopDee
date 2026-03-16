"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, MapPin, Loader2 } from "lucide-react";
import axios from "axios";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

const MapPicker = dynamic(() => import("./MapPicker"), { 
  ssr: false,
  loading: () => <div className="w-full h-[250px] md:h-[300px] bg-muted animate-pulse rounded-2xl flex items-center justify-center text-sm text-muted-foreground">Loading Map...</div>
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

const API = "http://localhost:8000/api";

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
      console.error("Reverse geocoding failed", error);
      setSearchError(getErrorMessage(error));
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert(t("profile_page.geo_not_supported"));
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleMapChange(position.coords.latitude, position.coords.longitude);
        setLoading(false);
      },
      (error) => {
        console.error("Error getting location", error);
        alert(t("profile_page.geo_error"));
        setLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const finalType = formData.type === "Other" ? formData.custom_type : formData.type;
    
    if (formData.type === "Other" && !formData.custom_type.trim()) {
      alert(t("profile_page.custom_type_required"));
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-xl bg-card border border-border rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col mt-auto md:my-auto max-h-[95vh] md:max-h-[85vh] overflow-hidden"
          >
            <div className="p-5 md:p-6 border-b border-border flex items-center justify-between bg-card z-30">
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                <MapPin className="text-primary" size={20} />
                {address ? t("profile_page.edit_address") : t("profile_page.add_address")}
              </h2>
              <button title={t("profile_page.cancel")} onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-5 md:p-6 space-y-6">
                
                <div className="relative z-50" ref={searchRef}>
                  <label className="block text-sm font-medium mb-2">Search Address</label>
                  <div className="relative">
                    <Input
                      placeholder={t("profile_page.search_placeholder")}
                      value={search}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 pr-10 h-11 md:h-12 rounded-xl text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary" size={18} />}
                  </div>
                  {searchError && <p className="text-[11px] text-destructive mt-1 font-medium">{searchError}</p>}

                  <AnimatePresence>
                    {showResults && results.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute z-[100] w-full mt-1 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                          {results.map((res) => (
                            <button
                              key={res.place_id}
                              type="button"
                              onClick={() => handleSelect(res)}
                              className="w-full px-5 py-4 text-left hover:bg-muted/80 transition-all flex items-start gap-4 border-b border-border last:border-0 group"
                            >
                              <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                <MapPin size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground line-clamp-1">{res.display_name}</p>
                                <p className="text-[11px] text-muted-foreground mt-1 font-medium flex items-center gap-1">
                                  <span>{res.address.city || res.address.town || res.address.state || "Location"}</span>
                                  <span>•</span>
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

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2 relative z-0">
                    <label className="block text-sm font-medium">{t("profile_page.map_pick")}</label>
                    <MapPicker 
                      lat={parseFloat(formData.lat) || 10.762622} 
                      lng={parseFloat(formData.lng) || 106.660172} 
                      onChange={handleMapChange} 
                      onLocate={handleLocateMe}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t("profile_page.address_type")}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={formData.type === "Home" || formData.type === "Office" || formData.type === "Other" ? formData.type : "Other"}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full h-11 md:h-12 px-4 bg-background border border-input rounded-xl text-sm appearance-none cursor-pointer"
                      >
                        <option value="Home">🏠 Home</option>
                        <option value="Office">🏢 Office</option>
                        <option value="Other">✨ Other</option>
                      </select>

                      {formData.type === "Other" && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                          <Input
                            placeholder={t("profile_page.custom_type_placeholder")}
                            value={formData.custom_type}
                            onChange={(e) => setFormData({ ...formData, custom_type: e.target.value })}
                            className="h-11 md:h-12 rounded-xl font-medium text-sm"
                            required
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t("profile_page.detail_address")}</label>
                    <textarea
                      value={formData.address_line_1}
                      onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                      placeholder={t("profile_page.detail_placeholder")}
                      className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm min-h-[100px] resize-none font-medium leading-relaxed"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-transparent hover:border-border transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}>
                    <input
                      type="checkbox"
                      title="Set as default"
                      checked={formData.is_default}
                      readOnly
                      className="w-5 h-5 rounded-lg border-border text-primary cursor-pointer pointer-events-none"
                    />
                    <label className="text-sm font-semibold cursor-pointer select-none">
                      {t("profile_page.set_as_default")}
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4 pb-10 sticky bottom-0 bg-background md:bg-transparent">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12 font-black">
                      {t("profile_page.cancel")}
                    </Button>
                    <Button type="submit" disabled={saving} className="flex-1 rounded-xl h-12 font-black shadow-lg">
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
