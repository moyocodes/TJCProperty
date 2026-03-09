// src/pages/PropertyDetailPage.jsx
// Resolves listing from URL param (:id). No props needed.

import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Home,
  Building2,
  Tag,
  Users,
  CheckCircle,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  MessageCircle,
  PhoneCall,
  Mail,
  ExternalLink,
  Calendar,
  Sparkles,
  Link2,
  Check,
} from "lucide-react";
import { useListings } from "../auth/ListingsProvider";
import { useAuth } from "../auth/AuthProvider";

/* ─── Helpers ─── */
function getCover(listing) {
  if (Array.isArray(listing.images) && listing.images.length > 0)
    return listing.images[0];
  if (typeof listing.image === "string" && listing.image) return listing.image;
  return null;
}
function getImages(listing) {
  if (Array.isArray(listing.images) && listing.images.length > 0)
    return listing.images;
  if (typeof listing.image === "string" && listing.image)
    return [listing.image];
  return [];
}

/* ─── Lightbox ─── */
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border-none cursor-pointer z-10"
      >
        <X size={18} />
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 font-heading font-bold text-[12px] text-white/70 tracking-widest">
        {idx + 1} / {images.length}
      </div>
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={images[idx]}
          alt={`Photo ${idx + 1}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.22 }}
          className="max-w-[90vw] max-h-[85vh] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </AnimatePresence>
      {images.length > 1 && (
        <>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-4 w-10 h-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/25 border-none cursor-pointer"
          >
            <ChevronLeft size={20} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-4 w-10 h-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/25 border-none cursor-pointer"
          >
            <ChevronRight size={20} />
          </motion.button>
        </>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[80vw] overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setIdx(i);
              }}
              className={`flex-shrink-0 w-12 h-9 overflow-hidden border-2 cursor-pointer transition-all ${i === idx ? "border-primary-400" : "border-transparent opacity-50 hover:opacity-100"}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Share sheet ─── */
function ShareSheet({ title }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-neutral-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50"
    >
      <div className="px-4 py-2.5 border-b border-neutral-100">
        <p className="font-heading font-bold text-[10px] tracking-[0.14em] uppercase text-neutral-400">
          Share
        </p>
      </div>
      {[
        {
          label: copied ? "Copied!" : "Copy Link",
          icon: copied ? <Check size={13} /> : <Link2 size={13} />,
          action: async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          },
        },
        {
          label: "WhatsApp",
          icon: <MessageCircle size={13} />,
          action: () =>
            window.open(
              `https://wa.me/?text=${encodeURIComponent(title + "\n" + url)}`,
              "_blank",
            ),
        },
        {
          label: "Twitter / X",
          icon: <Share2 size={13} />,
          action: () =>
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
              "_blank",
            ),
        },
      ].map((o) => (
        <button
          key={o.label}
          onClick={o.action}
          className="w-full flex items-center gap-3 px-4 py-2.5 font-heading font-semibold text-[12px] bg-transparent border-none cursor-pointer text-left hover:bg-primary-50 text-secondary-600"
        >
          <span className="text-neutral-400">{o.icon}</span> {o.label}
        </button>
      ))}
    </motion.div>
  );
}

/* ─── Related card ─── */
function RelatedCard({ listing, onView }) {
  const cover = getCover(listing);
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.1)" }}
      className="bg-white border border-neutral-200 overflow-hidden cursor-pointer group"
      onClick={() => onView(listing)}
    >
      <div className="h-[140px] overflow-hidden relative">
        {cover ? (
          <motion.img
            src={cover}
            alt={listing.name}
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary-50 flex items-center justify-center">
            <Home size={20} className="text-primary-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span
          className="absolute top-2 left-2 text-white px-2 py-0.5 font-heading font-bold text-[9px] uppercase"
          style={{
            background: listing.type === "residential" ? "#9F4325" : "#0E1A2B",
          }}
        >
          {listing.category || listing.type}
        </span>
        {listing.priceLabel && (
          <span className="absolute bottom-2 left-2 font-heading font-bold text-white text-[11px] drop-shadow">
            {listing.priceLabel}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-600 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </div>
      <div className="p-3">
        <h4 className="font-heading font-bold text-[12px] text-secondary-600 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {listing.name}
        </h4>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-400 font-body">
          <MapPin size={8} className="text-primary-600" /> {listing.location}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── FadeUp ─── */
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings, loading } = useListings();
  const { user } = useAuth();

  const listing = listings.find((l) => String(l.id) === String(id));

  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [scrollPct, setScrollPct] = useState(0);
  const shareRef = useRef(null);

  /* Progress bar */
  useEffect(() => {
    const h = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      setScrollPct(
        total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0,
      );
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* Close share on outside click */
  useEffect(() => {
    const h = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target))
        setShareOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  /* Loading */
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-heading font-bold text-[11px] tracking-[0.16em] uppercase text-neutral-400">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  /* Not found */
  if (!listing) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-heading font-bold text-4xl text-primary-600 mb-2">
            404
          </p>
          <h2 className="font-heading font-bold text-xl text-secondary-600 mb-1">
            Property not found
          </h2>
          <p className="font-body text-sm text-neutral-500 mb-6">
            This listing may have been removed or the link is incorrect.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/properties")}
            className="h-10 px-8 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors"
          >
            Browse All Listings
          </motion.button>
        </div>
      </div>
    );
  }

  const images = getImages(listing);
  const related = listings
    .filter((l) => l.id !== listing.id && l.type === listing.type)
    .slice(0, 4);

  const handleEnquire = () => {
    if (user)
      window.dispatchEvent(
        new CustomEvent("tjc:openEnquiry", { detail: listing }),
      );
    else
      window.dispatchEvent(
        new CustomEvent("tjc:openAuth", { detail: "login" }),
      );
  };

  const handleWhatsApp = () => {
    const msg = `Hi TJC Properties, I'm interested in: *${listing.name}* (${listing.location}). Could you provide more details?`;
    window.open(
      `https://wa.me/2348000000000?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  const statusColor =
    {
      available: "bg-green-600 text-white",
      let: "bg-neutral-500 text-white",
      sold: "bg-red-700 text-white",
      "off-market": "bg-neutral-700 text-white",
    }[listing.status] || "bg-green-600 text-white";

  return (
    <section className="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-24">
      <div className="min-h-screen bg-neutral-100 pb-24">
        {/* Progress bar */}
        <div
          className="fixed top-0 left-0 z-50 h-[3px] bg-primary-600 transition-all duration-100"
          style={{ width: `${scrollPct}%` }}
        />

        {/* Sticky nav */}
        <div
          className="sticky top-0 z-40 border-b border-neutral-200 backdrop-blur-md"
          style={{ background: "rgba(245,244,241,0.94)" }}
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <motion.button
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer text-neutral-500 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={13} /> Back
            </motion.button>

            <div className="hidden sm:flex items-center gap-1.5 font-heading text-[11px] text-neutral-400 min-w-0">
              <button
                onClick={() => navigate("/properties")}
                className="bg-transparent border-none cursor-pointer text-neutral-400 hover:text-primary-600 transition-colors"
              >
                Properties
              </button>
              <span>/</span>
              <span className="text-secondary-600 font-bold truncate max-w-[200px]">
                {listing.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSaved((v) => !v)}
                className="w-9 h-9 flex items-center justify-center border border-neutral-200 bg-white cursor-pointer hover:border-primary-600 transition-colors"
                style={{ color: saved ? "#9F4325" : "#7A7A7A" }}
              >
                <Heart size={14} fill={saved ? "#9F4325" : "none"} />
              </motion.button>

              <div className="relative" ref={shareRef}>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShareOpen((v) => !v)}
                  className="w-9 h-9 flex items-center justify-center border border-neutral-200 bg-white cursor-pointer hover:border-primary-600 text-neutral-500 hover:text-primary-600 transition-colors"
                >
                  <Share2 size={14} />
                </motion.button>
                <AnimatePresence>
                  {shareOpen && <ShareSheet title={listing.name} />}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6">
          {images.length === 0 ? (
            <div className="h-[340px] bg-primary-50 flex items-center justify-center border border-neutral-200">
              <Home size={48} className="text-primary-200" />
            </div>
          ) : images.length === 1 ? (
            <div
              className="h-[400px] overflow-hidden cursor-zoom-in group"
              onClick={() => setLightboxIdx(0)}
            >
              <img
                src={images[0]}
                alt={listing.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[380px] sm:h-[440px]">
              <div
                className="col-span-4 sm:col-span-3 row-span-2 overflow-hidden relative cursor-zoom-in group"
                onClick={() => setLightboxIdx(0)}
              >
                <motion.img
                  src={images[0]}
                  alt={listing.name}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-3 right-3 bg-black/55 text-white font-heading font-bold text-[10px] px-2.5 py-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={10} /> Expand
                </div>
              </div>
              {images.slice(1, 3).map((img, i) => (
                <div
                  key={i}
                  className="col-span-4 sm:col-span-1 overflow-hidden relative cursor-zoom-in group"
                  onClick={() => setLightboxIdx(i + 1)}
                >
                  <motion.img
                    src={img}
                    alt={`Photo ${i + 2}`}
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.45 }}
                    className="w-full h-full object-cover"
                  />
                  {i === 1 && images.length > 3 && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center gap-1">
                      <span className="font-heading font-bold text-white text-[16px]">
                        +{images.length - 3}
                      </span>
                      <span className="font-heading text-white/70 text-[11px]">
                        photos
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveImg(i);
                    setLightboxIdx(i);
                  }}
                  className={`flex-shrink-0 w-16 h-12 overflow-hidden border-2 cursor-pointer transition-all ${activeImg === i ? "border-primary-600" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
            {/* Left */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {listing.category && (
                    <span className="text-[10px] tracking-[0.18em] uppercase font-heading font-bold px-3 py-1 text-white bg-primary-600">
                      {listing.category}
                    </span>
                  )}
                  {listing.status && (
                    <span
                      className={`text-[10px] tracking-[0.18em] uppercase font-heading font-bold px-3 py-1 ${statusColor}`}
                    >
                      {listing.status}
                    </span>
                  )}
                </div>
                <h1
                  className="font-heading font-bold text-secondary-600 leading-[1.15]"
                  style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}
                >
                  {listing.name}
                </h1>
                <div className="flex items-center gap-1.5 mt-2 font-body text-[13px] text-neutral-500">
                  <MapPin
                    size={13}
                    className="text-primary-600 flex-shrink-0"
                  />{" "}
                  {listing.location}
                </div>
              </motion.div>

              {/* Key stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
              >
                {[
                  {
                    icon: <Home size={16} />,
                    label: "Type",
                    value:
                      listing.type?.[0]?.toUpperCase() +
                        listing.type?.slice(1) || "—",
                  },
                  {
                    icon: <Tag size={16} />,
                    label: "Category",
                    value: listing.category || "—",
                  },
                  {
                    icon: <Users size={16} />,
                    label: "Units",
                    value: listing.units ?? "—",
                  },
                  {
                    icon: <Building2 size={16} />,
                    label: "Status",
                    value:
                      listing.status?.[0]?.toUpperCase() +
                        listing.status?.slice(1) || "Available",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="bg-white border border-neutral-200 p-4 flex flex-col gap-2"
                  >
                    <span className="text-primary-600">{s.icon}</span>
                    <div>
                      <p className="font-heading font-bold text-[10px] tracking-[0.14em] uppercase text-neutral-400">
                        {s.label}
                      </p>
                      <p className="font-heading font-bold text-[14px] text-secondary-600 mt-0.5">
                        {s.value}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Price */}
              {listing.priceLabel && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 flex items-end gap-3 border-l-4 border-primary-600 pl-4 py-2"
                >
                  <div>
                    <p className="font-heading font-bold text-[10px] tracking-[0.16em] uppercase text-neutral-400">
                      Asking Price
                    </p>
                    <p
                      className="font-heading font-bold text-secondary-600 mt-0.5"
                      style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}
                    >
                      {listing.priceLabel}
                    </p>
                  </div>
                  <span className="font-body text-[12px] text-neutral-400 pb-1">
                    Negotiable
                  </span>
                </motion.div>
              )}

              {/* Description */}
              {listing.description && (
                <FadeUp delay={0.1} className="mt-8">
                  <h2 className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase text-primary-600 mb-3">
                    About This Property
                  </h2>
                  <div className="font-body text-[15px] leading-[1.85] text-neutral-600 whitespace-pre-line">
                    {listing.description}
                  </div>
                </FadeUp>
              )}

              {/* Features */}
              {listing.features?.length > 0 && (
                <FadeUp delay={0.1} className="mt-8">
                  <h2 className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase text-primary-600 mb-4">
                    Features & Amenities
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {listing.features.map((f, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 bg-white border border-neutral-100 px-4 py-3"
                      >
                        <CheckCircle
                          size={14}
                          className="text-primary-600 flex-shrink-0"
                        />
                        <span className="font-body text-[13px] text-secondary-600">
                          {f}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </FadeUp>
              )}

              {/* Why this property */}
              <FadeUp delay={0.1} className="mt-10">
                <div className="bg-white border border-neutral-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={14} className="text-primary-600" />
                    <p className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase text-primary-600">
                      Why This Property?
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-5">
                    {[
                      {
                        icon: <MapPin size={18} />,
                        title: "Prime Location",
                        body: "Strategically located with easy access to major roads and city amenities.",
                      },
                      {
                        icon: <Building2 size={18} />,
                        title: "Quality Finish",
                        body: "Built to high standards with durable materials and modern design.",
                      },
                      {
                        icon: <CheckCircle size={18} />,
                        title: "Verified Listing",
                        body: "All documents verified by the TJC Properties team for your peace of mind.",
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <span className="text-primary-600">{item.icon}</span>
                        <p className="font-heading font-bold text-[13px] text-secondary-600">
                          {item.title}
                        </p>
                        <p className="font-body text-[12px] text-neutral-500 leading-relaxed">
                          {item.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeUp>

              {/* Schedule viewing */}
              <FadeUp delay={0.05} className="mt-5">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-5 bg-primary-50 border border-primary-100">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <Calendar size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-[13px] text-secondary-600">
                        Schedule a Viewing
                      </p>
                      <p className="font-body text-[12px] text-neutral-500">
                        Mon–Sat, 8am–6pm.
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleEnquire}
                    className="h-10 px-6 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors flex-shrink-0"
                  >
                    Book Viewing
                  </motion.button>
                </div>
              </FadeUp>
            </div>

            {/* Right: sticky sidebar */}
            <aside>
              <div className="sticky top-20 space-y-4">
                <div className="bg-white border border-neutral-200 p-5">
                  {listing.priceLabel && (
                    <>
                      <p className="font-heading font-bold text-[10px] tracking-[0.14em] uppercase text-neutral-400">
                        Asking Price
                      </p>
                      <p
                        className="font-heading font-bold text-secondary-600 mt-1"
                        style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)" }}
                      >
                        {listing.priceLabel}
                      </p>
                      <div className="h-px bg-neutral-100 my-4" />
                    </>
                  )}
                  <div className="space-y-2.5">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleEnquire}
                      className="w-full h-11 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[12px] uppercase tracking-[0.08em] border-none cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                      <Mail size={14} /> Send Enquiry
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleWhatsApp}
                      className="w-full h-11 border border-neutral-200 bg-white hover:bg-neutral-50 text-secondary-600 font-heading font-bold text-[12px] uppercase tracking-[0.08em] cursor-pointer transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={14} className="text-green-500" />{" "}
                      WhatsApp Us
                    </motion.button>
                    <a
                      href="tel:+2348000000000"
                      className="w-full h-11 border border-neutral-200 bg-white hover:bg-neutral-50 text-secondary-600 font-heading font-bold text-[12px] uppercase tracking-[0.08em] cursor-pointer transition-colors flex items-center justify-center gap-2 no-underline"
                    >
                      <PhoneCall size={14} className="text-primary-600" /> Call
                      Agent
                    </a>
                  </div>
                  <p className="font-body text-[10px] text-neutral-400 text-center mt-3">
                    Response within 2–4 hours on business days
                  </p>
                </div>

                {/* Quick facts */}
                <div className="bg-white border border-neutral-200 p-5 space-y-3">
                  <p className="font-heading font-bold text-[10px] tracking-[0.16em] uppercase text-neutral-400">
                    Property Info
                  </p>
                  {[
                    {
                      label: "Type",
                      value:
                        listing.type?.[0]?.toUpperCase() +
                          listing.type?.slice(1) || "—",
                    },
                    { label: "Category", value: listing.category || "—" },
                    { label: "Units", value: listing.units ?? "—" },
                    {
                      label: "Status",
                      value:
                        listing.status?.[0]?.toUpperCase() +
                          listing.status?.slice(1) || "Available",
                    },
                    { label: "Photos", value: images.length },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-body text-[12px] text-neutral-500">
                        {f.label}
                      </span>
                      <span className="font-heading font-bold text-[12px] text-secondary-600">
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Agent card */}
                <div className="bg-secondary-600 p-5">
                  <p className="font-heading font-bold text-[10px] tracking-[0.16em] uppercase text-white/50 mb-3">
                    Your Agent
                  </p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary-600 flex items-center justify-center font-heading font-bold text-white text-sm flex-shrink-0">
                      TJC
                    </div>
                    <div>
                      <p className="font-heading font-bold text-[13px] text-white">
                        TJC Properties
                      </p>
                      <p className="font-body text-[11px] text-white/55">
                        Licensed Real Estate Agent
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleWhatsApp}
                      className="flex-1 h-9 bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-[10px] uppercase border-none cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle size={12} /> Chat
                    </motion.button>
                    <a
                      href="tel:+2348000000000"
                      className="flex-1 h-9 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[10px] uppercase border-none cursor-pointer transition-colors flex items-center justify-center gap-1.5 no-underline"
                    >
                      <PhoneCall size={12} /> Call
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Related listings */}
          {related.length > 0 && (
            <FadeUp className="mt-16 pt-10 border-t border-neutral-200">
              <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 mb-1">
                    <span className="inline-block w-4 h-px bg-primary-600" />
                    <p className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase text-primary-600">
                      Similar Properties
                    </p>
                  </div>
                  <h3 className="font-heading font-bold text-xl text-secondary-600">
                    More {listing.type?.[0]?.toUpperCase()}
                    {listing.type?.slice(1)} Listings
                  </h3>
                </div>
                <motion.button
                  whileHover={{ x: 3 }}
                  onClick={() => navigate("/properties")}
                  className="font-heading font-bold text-[11px] tracking-[0.08em] uppercase flex items-center gap-1 text-primary-600 bg-transparent border-none cursor-pointer"
                >
                  View All <ExternalLink size={11} />
                </motion.button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {related.map((l, i) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <RelatedCard
                      listing={l}
                      onView={(l) => navigate(`/properties/${l.id}`)}
                    />
                  </motion.div>
                ))}
              </div>
            </FadeUp>
          )}

          {/* Bottom CTA */}
          <FadeUp className="mt-14">
            <div className="relative overflow-hidden bg-secondary-600 p-8 sm:p-12">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="relative">
                <p className="font-heading font-bold text-[11px] tracking-[0.2em] uppercase text-primary-400 mb-3">
                  TJC Properties
                </p>
                <h3
                  className="font-heading font-bold text-white leading-snug max-w-[500px]"
                  style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.7rem)" }}
                >
                  Interested in this property or something similar?
                </h3>
                <p className="font-body text-white/55 text-[14px] mt-2 max-w-[420px]">
                  Our agents are available Mon–Sat, 8am to 6pm. Get in touch and
                  we'll help you make the right move.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleEnquire}
                    className="flex items-center gap-2 h-11 px-6 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors"
                  >
                    <Mail size={13} /> Send Enquiry
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleWhatsApp}
                    className="flex items-center gap-2 h-11 px-6 border border-white/25 hover:border-white/60 text-white font-heading font-bold text-[11px] uppercase bg-transparent cursor-pointer transition-colors"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/properties")}
                    className="flex items-center gap-2 h-11 px-6 border border-white/25 hover:border-white/60 text-white font-heading font-bold text-[11px] uppercase bg-transparent cursor-pointer transition-colors"
                  >
                    Browse More Listings
                  </motion.button>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>

        {/* Mobile sticky bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white sm:hidden">
          <div className="flex gap-2 p-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleWhatsApp}
              className="flex-1 h-11 flex items-center justify-center gap-2 border border-neutral-200 font-heading font-bold text-[11px] uppercase text-secondary-600 bg-white cursor-pointer"
            >
              <MessageCircle size={13} className="text-green-500" /> WhatsApp
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleEnquire}
              className="flex-1 h-11 flex items-center justify-center gap-2 bg-primary-600 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer"
            >
              <Mail size={13} /> Enquire
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {lightboxIdx !== null && (
            <Lightbox
              images={images}
              startIndex={lightboxIdx}
              onClose={() => setLightboxIdx(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
