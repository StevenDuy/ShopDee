"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, MessageSquare, Send } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslation } from "react-i18next";
import { ImagePlus, Video, Loader2 } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItem: {
    id: number;
    product_id: number;
    product: {
      title: string;
      media: { url: string; full_url: string }[];
    };
    selected_options?: Record<string, string> | null;
  } | null;
  onSuccess: () => void;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function ReviewModal({ isOpen, onClose, orderItem, onSuccess }: ReviewModalProps) {
  const { t } = useTranslation();
  const { token } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Media State
  const [files, setFiles] = useState<File[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  if (!isOpen || !orderItem) return null;

  const handleSubmit = async () => {
    if (rating < 1) {
      toast.error(t("reviews.select_rating_error"));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("order_item_id", orderItem.id.toString());
      formData.append("product_id", orderItem.product_id.toString());
      formData.append("rating", rating.toString());
      formData.append("comment", comment);
      
      mediaUrls.forEach((url, index) => {
        formData.append(`media[${index}]`, url);
      });

      if (files.length > 0) {
        files.forEach((file) => {
          formData.append("files[]", file);
        });
      }

      await axios.post(
        `${API}/reviews`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          },
        }
      );

      toast.success(t("reviews.success_msg"));
      onSuccess();
      onClose();
      
      // Reset state
      setRating(5);
      setComment("");
      setFiles([]);
      setMediaUrls([]);
    } catch (err: any) {
      console.error("Review submit error:", err);
      toast.error(err.response?.data?.message || t("reviews.error_msg"));
    } finally {
      setSubmitting(false);
      setUploadingMedia(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
           initial={{ opacity: 0, scale: 0.9, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.9, y: 20 }}
           className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-xl font-bold">{t("reviews.title")}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Product Summary */}
            <div className="flex gap-4 items-center bg-muted/30 p-4 rounded-2xl border border-border/50">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0">
                <img
                  src={orderItem.product.media[0]?.full_url || `https://picsum.photos/seed/${orderItem.id}/80/80`}
                  alt={orderItem.product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm line-clamp-2">{orderItem.product.title}</p>
                {orderItem.selected_options && Object.keys(orderItem.selected_options).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(orderItem.selected_options).map(([k, v]) => (
                          <span key={k} className="text-[10px] bg-primary/5 text-primary/70 px-1.5 py-0.5 rounded border border-primary/10 uppercase font-bold">
                              {k}: {v}
                          </span>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rating Stars */}
            <div className="space-y-4 text-center py-4 bg-primary/[0.02] rounded-[2rem] border border-primary/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">{t("reviews.quality_label")}</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-all duration-300 hover:scale-110 active:scale-90"
                  >
                    <Star
                      size={48}
                      className={`transition-all duration-300 drop-shadow-sm ${
                        (hoverRating || rating) >= star
                          ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                          : "text-muted-foreground/20 fill-muted-foreground/5 shadow-inner"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-black text-primary uppercase tracking-[0.1em] h-5 italic italic-black">
                {rating === 1 && t("reviews.rating_1")}
                {rating === 2 && t("reviews.rating_2")}
                {rating === 3 && t("reviews.rating_3")}
                {rating === 4 && t("reviews.rating_4")}
                {rating === 5 && t("reviews.rating_5")}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t("reviews.comment_label")}</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("reviews.placeholder")}
                className="w-full h-32 p-4 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none font-medium text-sm"
              />
            </div>

            {/* Media Upload */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t("reviews.media_label")}</label>
              <div className="flex flex-wrap gap-2">
                {/* Previews */}
                {mediaUrls.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                    {url.includes('.mp4') || url.includes('.mov') ? (
                       <video src={url} className="w-full h-full object-cover" />
                    ) : (
                       <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button 
                        onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={12} />
                    </button>
                  </div>
                ))}
                
                {/* File selects */}
                {files.map((file, i) => (
                   <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-primary/20 bg-primary/5">
                      {file.type.startsWith('image/') ? (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="preview" 
                          className="w-full h-full object-cover"
                          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        />
                      ) : (
                        <video 
                          src={URL.createObjectURL(file)} 
                          className="w-full h-full object-cover"
                          onLoadedData={(e) => URL.revokeObjectURL((e.target as HTMLVideoElement).src)}
                        />
                      )}
                      <button 
                         onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                         className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full z-10"
                      >
                         <X size={12} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/20">
                         <div className="h-full bg-primary w-2/3 animate-pulse" />
                      </div>
                   </div>
                ))}

                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center cursor-pointer gap-1 group">
                  <ImagePlus size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary uppercase">{t("reviews.add_media")}</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*" 
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files) {
                            setFiles([...files, ...Array.from(e.target.files)]);
                        }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
              ) : (
                <>
                  <Send size={18} />
                  {t("reviews.submit")}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}



