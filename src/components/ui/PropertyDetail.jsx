// src/components/listings/PropertyDetail.jsx
// Full-page property detail view.
// Shows gallery, all details, features, share buttons, enquiry CTA.
// Used by Properties.jsx when a card is clicked (or "View Details" pressed).

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Share2, Link2, MapPin, Home, Tag,
  CheckCircle, ChevronLeft, ChevronRight,
  MessageSquare, Phone, Layers,
} from "lucide-react";
import EnquiryModal from "./EnquiryModal";
import { useAuth } from "../../auth/AuthProvider";

const T = {
  primary:  "#9F4325",
  pHov:     "#D97C5C",
  pLt:      "#FBEAE2",
  navy:     "#0E1A2B",
  navyLt:   "#1C2A3F",
  bg:       "#F5F4F1",
  white:    "#FFFFFF",
  border:   "#E5E0D8",
  muted:    "#7A7A7A",
  text:     "#1a1a1a",
};

// ── Simple image gallery ─────────────────────────────────────
function Gallery({ images }) {
  const [active, setActive] = useState(0);
  const imgs = images?.length ? images.map(i => i?.url || i) : [];
  if (!imgs.length) return (
    <div className="w-full aspect-[16/9] flex items-center justify-center" style={{ background: T.pLt }}>
      <Home size={40} style={{ color: T.pHov, opacity: 0.4 }} />
    </div>
  );

  const prev = () => setActive(a => (a - 1 + imgs.length) % imgs.length);
  const next = () => setActive(a => (a + 1) % imgs.length);

  return (
    <div className="space-y-2">
      {/* Main image */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={imgs[active]}
            alt={`Property image ${active + 1}`}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full h-full object-cover absolute inset-0"
          />
        </AnimatePresence>

        {/* Nav arrows */}
        {imgs.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-white border-none cursor-pointer transition-colors"
              style={{ background: "rgba(14,26,43,0.55)" }}
              onMouseEnter={e => e.currentTarget.style.background = T.primary}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(14,26,43,0.55)"}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-white border-none cursor-pointer transition-colors"
              style={{ background: "rgba(14,26,43,0.55)" }}
              onMouseEnter={e => e.currentTarget.style.background = T.primary}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(14,26,43,0.55)"}>
              <ChevronRight size={18} />
            </button>
            {/* Counter */}
            <span className="absolute bottom-3 right-3 font-heading font-bold text-[11px] tracking-wider text-white px-2.5 py-1"
              style={{ background: "rgba(14,26,43,0.6)" }}>
              {active + 1} / {imgs.length}
            </span>
          </>
        )}

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: T.primary }} />
      </div>

      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imgs.map((src, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="flex-shrink-0 w-16 h-12 overflow-hidden border-2 cursor-pointer transition-all"
              style={{ borderColor: i === active ? T.primary : "transparent" }}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Share strip ──────────────────────────────────────────────
function ShareStrip({ title }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const options = [
    { label: copied ? "Copied!" : "Copy link", icon: <Link2 size={13} />, action: copy, active: copied },
    { label: "WhatsApp", icon: <span className="text-sm">💬</span>,
      action: () => window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`) },
    { label: "Twitter",  icon: <span className="font-bold text-xs">𝕏</span>,
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`) },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Share2 size={13} style={{ color: T.muted }} />
      <span className="font-heading font-bold text-[11px] uppercase tracking-wider" style={{ color: T.muted }}>Share</span>
      {options.map(o => (
        <motion.button key={o.label} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
          onClick={o.action}
          className="flex items-center gap-1.5 h-7 px-3 border font-heading font-semibold text-[11px] cursor-pointer transition-colors"
          style={{
            borderColor: o.active ? T.primary : T.border,
            background: o.active ? T.pLt : T.white,
            color: o.active ? T.primary : T.navy,
          }}>
          {o.icon} {o.label}
        </motion.button>
      ))}
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    available:  { bg: T.primary,   text: "#fff" },
    let:        { bg: "#1D4ED8",   text: "#fff" },
    sold:       { bg: "#6B7280",   text: "#fff" },
    "off-market":{ bg: "#92400E",  text: "#fff" },
  };
  const s = map[status] || map.available;
  return (
    <span className="inline-block px-3 py-1 font-heading font-bold text-[10px] tracking-[0.14em] uppercase text-white"
      style={{ background: s.bg }}>
      {status || "available"}
    </span>
  );
}

// ── Main export ──────────────────────────────────────────────
export default function PropertyDetail({ listing, onBack, onRequireAuth }) {
  const { user } = useAuth();
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  // Scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [listing?.id]);

  if (!listing) return null;

  const images = listing.images?.length
    ? listing.images
    : listing.image
    ? [{ url: listing.image }]
    : [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen pb-24"
        style={{ background: T.bg }}>

        {/* Grid texture */}
        <div className="fixed inset-0 pointer-events-none opacity-60" style={{
          backgroundImage: "linear-gradient(rgba(14,26,43,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(14,26,43,0.025) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Sticky nav bar */}
        <div className="sticky top-0 z-30 border-b backdrop-blur-md"
          style={{ background: "rgba(245,244,241,0.93)", borderColor: T.border }}>
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }} onClick={onBack}
              className="flex items-center gap-1.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer"
              style={{ color: T.muted }}
              onMouseEnter={e => e.currentTarget.style.color = T.primary}
              onMouseLeave={e => e.currentTarget.style.color = T.muted}>
              <ArrowLeft size={13} /> All Properties
            </motion.button>

            {/* Quick enquire in nav */}
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
              onClick={() => user ? setEnquiryOpen(true) : (onRequireAuth?.())}
              className="flex items-center gap-1.5 h-8 px-4 text-white font-heading font-bold text-[11px] tracking-[0.08em] uppercase border-none cursor-pointer"
              style={{ background: T.primary }}
              onMouseEnter={e => e.currentTarget.style.background = T.pHov}
              onMouseLeave={e => e.currentTarget.style.background = T.primary}>
              <MessageSquare size={12} /> Enquire
            </motion.button>
          </div>
        </div>

        {/* Main content */}
        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12" style={{ zIndex: 1 }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-12">

            {/* Left: gallery + details */}
            <div className="space-y-7">

              {/* Category tag above title */}
              {listing.category && (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-px" style={{ background: T.primary }} />
                  <span className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase" style={{ color: T.primary }}>
                    {listing.category}
                  </span>
                </div>
              )}

              <div>
                <h1 className="font-heading font-bold leading-[1.15]"
                  style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: T.navy }}>
                  {listing.name}
                </h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <MapPin size={13} style={{ color: T.primary }} />
                  <span className="font-body text-[14px]" style={{ color: T.muted }}>{listing.location}</span>
                  <StatusBadge status={listing.status} />
                </div>
              </div>

              {/* Gallery */}
              <Gallery images={images} />

              {/* Description */}
              {listing.description && (
                <div className="border-l-4 pl-5 py-1" style={{ borderColor: T.primary }}>
                  <p className="font-body text-[15px] leading-[1.8]" style={{ color: T.text }}>
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Features grid */}
              {listing.features?.length > 0 && (
                <div>
                  <p className="font-heading font-bold text-[11px] tracking-[0.16em] uppercase mb-3" style={{ color: T.primary }}>
                    Features & Amenities
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {listing.features.map((f, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-2.5 px-3 py-2.5 border"
                        style={{ borderColor: T.border, background: T.white }}>
                        <CheckCircle size={14} style={{ color: T.primary, flexShrink: 0 }} />
                        <span className="font-body text-[13px]" style={{ color: T.navy }}>{f}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share strip */}
              <div className="pt-4 border-t" style={{ borderColor: T.border }}>
                <ShareStrip title={listing.name} />
              </div>
            </div>

            {/* Right: sticky info card */}
            <aside>
              <div className="sticky top-20 space-y-4">

                {/* Price card */}
                <div className="border p-5 space-y-4" style={{ borderColor: T.border, background: T.white }}>
                  {listing.priceLabel && (
                    <div>
                      <p className="font-heading font-bold text-[11px] tracking-[0.14em] uppercase mb-1" style={{ color: T.muted }}>
                        Price
                      </p>
                      <p className="font-heading font-bold" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.7rem)", color: T.primary }}>
                        {listing.priceLabel}
                      </p>
                    </div>
                  )}

                  {/* Quick facts */}
                  <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: T.border }}>
                    {[
                      { icon: <Home size={13} />,   label: "Type",     value: listing.type?.[0].toUpperCase() + listing.type?.slice(1) },
                      { icon: <Tag size={13} />,    label: "Category", value: listing.category },
                      { icon: <MapPin size={13} />, label: "Location", value: listing.location },
                      { icon: <Layers size={13} />, label: "Units",    value: `${listing.units} available` },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label} className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5" style={{ color: T.muted }}>
                          {f.icon}
                          <span className="font-heading font-bold text-[11px] uppercase tracking-wide">{f.label}</span>
                        </div>
                        <span className="font-body text-[13px] text-right" style={{ color: T.navy }}>{f.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Enquire CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={() => user ? setEnquiryOpen(true) : onRequireAuth?.()}
                    className="w-full flex items-center justify-center gap-2 h-11 text-white font-heading font-bold text-[12px] tracking-[0.1em] uppercase border-none cursor-pointer transition-colors"
                    style={{ background: T.primary }}
                    onMouseEnter={e => e.currentTarget.style.background = T.pHov}
                    onMouseLeave={e => e.currentTarget.style.background = T.primary}>
                    <MessageSquare size={14} /> {user ? "Send Enquiry" : "Sign In to Enquire"}
                  </motion.button>

                  <p className="text-center font-body text-[11px]" style={{ color: T.muted }}>
                    Response within 24 hours
                  </p>
                </div>

                {/* Contact card */}
                <div className="border p-5" style={{ borderColor: T.border, background: T.pLt }}>
                  <p className="font-heading font-bold text-[11px] tracking-[0.14em] uppercase mb-3" style={{ color: T.primary }}>
                    Prefer to call?
                  </p>
                  <a href="tel:+2348000000000"
                    className="flex items-center gap-2 font-heading font-bold text-[14px] no-underline"
                    style={{ color: T.navy }}>
                    <Phone size={15} style={{ color: T.primary }} />
                    +234 800 000 0000
                  </a>
                  <p className="font-body text-[11px] mt-1.5" style={{ color: T.muted }}>Mon–Sat, 8am–6pm WAT</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </motion.div>

      {/* Enquiry modal */}
      <AnimatePresence>
        {enquiryOpen && (
          <EnquiryModal
            listing={listing}
            onClose={() => setEnquiryOpen(false)}
            onRequireAuth={() => { setEnquiryOpen(false); onRequireAuth?.(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
