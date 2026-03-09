// src/pages/PropertyDetailPage.jsx
// Fixed: inline EnquiryModal (no more custom events), WhatsApp, Call, Mailjet email

import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowLeft, MapPin, Home, Building2, Tag, Users, CheckCircle,
  Share2, Heart, ChevronLeft, ChevronRight, X, MessageCircle,
  PhoneCall, Mail, ExternalLink, Calendar, Sparkles, Link2, Check,
  Loader2, Send,
} from "lucide-react";
import { useListings } from "../auth/ListingsProvider";
import { useAuth }     from "../auth/AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../components/firebase";

// ─── AgentDisplay: fetches and shows assigned agent ──────────
function AgentDisplay({ agentId }) {
  const [agent, setAgent] = useState(null);
  const { handleWhatsApp: _w, handleCall: _c } = {}; // unused placeholder

  useEffect(() => {
    if (!agentId) return;
    getDoc(doc(db, "users", agentId)).then(snap => {
      if (snap.exists()) setAgent({ id: snap.id, ...snap.data() });
    }).catch(() => {});
  }, [agentId]);

  const name  = agent?.displayName || "TJC Properties";
  const role  = agent ? (agent.isAdmin ? "Senior Agent" : "Agent") : "Licensed Real Estate Agent";
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-600 flex items-center justify-center font-heading font-bold text-white text-sm flex-shrink-0">
          {initials || "TJC"}
        </div>
        <div>
          <p className="font-heading font-bold text-[13px] text-white">{name}</p>
          <p className="font-body text-[11px] text-white/55">{role}</p>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// ⚙️  CONFIG — update these 3 lines with real values
// ─────────────────────────────────────────────────────────────
const TJC_WHATSAPP_NUMBER = "2348000000000";       // no + or spaces, e.g. 2348012345678
const TJC_PHONE_NUMBER    = "+2348000000000";       // used for tel: link
const TJC_RECIPIENT_EMAIL = "info@tjcproperties.com";

// Mailjet API keys — add to your .env as VITE_MJ_PUBLIC / VITE_MJ_PRIVATE
const MJ_PUBLIC  = import.meta.env.VITE_MJ_PUBLIC  || "YOUR_MAILJET_PUBLIC_KEY";
const MJ_PRIVATE = import.meta.env.VITE_MJ_PRIVATE || "YOUR_MAILJET_PRIVATE_KEY";

// ─────────────────────────────────────────────────────────────
// 📧  Mailjet send helper
// ─────────────────────────────────────────────────────────────
async function sendViaMailjet({ name, email, phone, message, listingName, listingLocation }) {
  const html = `
    <div style="font-family:sans-serif;max-width:600px">
      <div style="background:#9F4325;padding:20px 24px">
        <h2 style="color:#fff;margin:0;font-size:18px">New Property Enquiry</h2>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">TJC Properties</p>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #e5e0d8;border-top:none">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="background:#f5f4f1"><td style="padding:10px 14px;font-weight:bold;width:140px;color:#0e1a2b">Property</td><td style="padding:10px 14px;color:#0e1a2b">${listingName}</td></tr>
          <tr><td style="padding:10px 14px;font-weight:bold;color:#0e1a2b">Location</td><td style="padding:10px 14px;color:#555">${listingLocation || "—"}</td></tr>
          <tr style="background:#f5f4f1"><td style="padding:10px 14px;font-weight:bold;color:#0e1a2b">From</td><td style="padding:10px 14px;color:#0e1a2b">${name}</td></tr>
          <tr><td style="padding:10px 14px;font-weight:bold;color:#0e1a2b">Email</td><td style="padding:10px 14px"><a href="mailto:${email}" style="color:#9F4325">${email}</a></td></tr>
          <tr style="background:#f5f4f1"><td style="padding:10px 14px;font-weight:bold;color:#0e1a2b">Phone</td><td style="padding:10px 14px;color:#555">${phone || "—"}</td></tr>
        </table>
        <div style="margin-top:16px;padding:14px;background:#fbeae2;border-left:3px solid #9F4325">
          <p style="margin:0 0 6px;font-weight:bold;font-size:13px;color:#9F4325">MESSAGE</p>
          <p style="margin:0;font-size:14px;color:#333;line-height:1.6">${message.replace(/\n/g, "<br/>")}</p>
        </div>
        <p style="margin-top:20px;font-size:11px;color:#aaa">Sent from TJC Properties website · Reply to ${email}</p>
      </div>
    </div>
  `;

  const res = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa(`${MJ_PUBLIC}:${MJ_PRIVATE}`),
    },
    body: JSON.stringify({
      Messages: [{
        From:    { Email: TJC_RECIPIENT_EMAIL, Name: "TJC Properties Website" },
        To:      [{ Email: TJC_RECIPIENT_EMAIL, Name: "TJC Properties" }],
        ReplyTo: { Email: email, Name: name },
        Subject: `Enquiry: ${listingName} — ${name}`,
        HTMLPart: html,
      }],
    }),
  });

  if (!res.ok) throw new Error(`Mailjet error ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getCover(l) {
  if (Array.isArray(l.images) && l.images.length) return l.images[0];
  if (typeof l.image === "string" && l.image) return l.image;
  return null;
}
function getImages(l) {
  if (Array.isArray(l.images) && l.images.length) return l.images;
  if (typeof l.image === "string" && l.image) return [l.image];
  return [];
}

// ─────────────────────────────────────────────────────────────
// 📬  Inline Enquiry Modal
// ─────────────────────────────────────────────────────────────
function EnquiryModal({ listing, onClose }) {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name:    user?.displayName || "",
    email:   user?.email       || "",
    phone:   "",
    message: `Hi, I'm interested in ${listing.name} (${listing.location || ""}). Could you provide more details?`,
  });
  const [errors,  setErrors]  = useState({});
  const [busy,    setBusy]    = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiErr,  setApiErr]  = useState("");

  const up = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
    setApiErr("");
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Name required";
    if (!form.email.trim())   e.email   = "Email required";
    if (!form.message.trim()) e.message = "Message required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setBusy(true);
    try {
      await sendViaMailjet({
        name:            form.name,
        email:           form.email,
        phone:           form.phone,
        message:         form.message,
        listingName:     listing.name,
        listingLocation: listing.location,
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setApiErr("Failed to send. Please try WhatsApp or call us directly.");
    } finally {
      setBusy(false);
    }
  };

  const iCls = (k) =>
    `w-full bg-neutral-50 border text-secondary-600 font-body text-[13px] px-4 py-2.5 outline-none transition-colors focus:border-primary-600 placeholder:text-neutral-400 ${errors[k] ? "border-red-400" : "border-neutral-200"}`;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-6"
      style={{ background: "rgba(14,26,43,0.78)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[500px] bg-neutral-100 border border-neutral-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
          <div>
            <p className="font-heading font-bold text-[10px] tracking-[0.16em] uppercase text-primary-600">Send Enquiry</p>
            <p className="font-heading font-bold text-[14px] text-secondary-600 mt-0.5 truncate max-w-[360px]">{listing.name}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-secondary-600 bg-transparent border-none cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 mx-auto flex items-center justify-center bg-green-50 mb-4">
              <Check size={24} className="text-green-600" />
            </div>
            <h3 className="font-heading font-bold text-[17px] text-secondary-600">Enquiry Sent!</h3>
            <p className="font-body text-[13px] text-neutral-500 mt-2 leading-relaxed max-w-[300px] mx-auto">
              We received your message and will respond within 2–4 business hours.
            </p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="mt-6 h-10 px-8 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors">
              Done
            </motion.button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {apiErr && (
              <div className="px-4 py-3 border border-red-200 bg-red-50 font-body text-[13px] text-red-600">
                {apiErr}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-heading font-bold text-[10px] tracking-[0.12em] uppercase text-neutral-400 block mb-1.5">Full Name *</label>
                <input value={form.name} onChange={e => up("name", e.target.value)}
                  placeholder="Your name" className={iCls("name")} />
                {errors.name && <p className="text-[11px] text-red-500 mt-1 font-body">{errors.name}</p>}
              </div>
              <div>
                <label className="font-heading font-bold text-[10px] tracking-[0.12em] uppercase text-neutral-400 block mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={e => up("email", e.target.value)}
                  placeholder="you@example.com" className={iCls("email")} />
                {errors.email && <p className="text-[11px] text-red-500 mt-1 font-body">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="font-heading font-bold text-[10px] tracking-[0.12em] uppercase text-neutral-400 block mb-1.5">Phone (optional)</label>
              <input value={form.phone} onChange={e => up("phone", e.target.value)}
                placeholder="+234 800 000 0000" className={iCls("phone")} />
            </div>

            <div>
              <label className="font-heading font-bold text-[10px] tracking-[0.12em] uppercase text-neutral-400 block mb-1.5">Message *</label>
              <textarea rows={4} value={form.message} onChange={e => up("message", e.target.value)}
                className={`${iCls("message")} resize-none`} />
              {errors.message && <p className="text-[11px] text-red-500 mt-1 font-body">{errors.message}</p>}
            </div>

            <div className="flex gap-2 pb-2">
              <motion.button
                whileHover={!busy ? { scale: 1.02 } : {}} whileTap={{ scale: 0.97 }}
                onClick={handleSubmit} disabled={busy}
                className="flex-1 h-11 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors disabled:opacity-60">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
                {busy ? "Sending…" : "Send Enquiry"}
              </motion.button>
              <button onClick={onClose}
                className="h-11 px-5 border border-neutral-200 bg-white text-neutral-500 font-heading font-bold text-[11px] uppercase cursor-pointer hover:border-neutral-400 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Lightbox
// ─────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  useEffect(() => {
    const h = e => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95"
      onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border-none cursor-pointer z-10">
        <X size={18} />
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 font-heading font-bold text-[12px] text-white/70 tracking-widest">
        {idx + 1} / {images.length}
      </div>
      <AnimatePresence mode="wait">
        <motion.img key={idx} src={images[idx]} alt={`Photo ${idx + 1}`}
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}
          className="max-w-[90vw] max-h-[85vh] object-contain"
          onClick={e => e.stopPropagation()} />
      </AnimatePresence>
      {images.length > 1 && (
        <>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 w-10 h-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/25 border-none cursor-pointer">
            <ChevronLeft size={20} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-4 w-10 h-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/25 border-none cursor-pointer">
            <ChevronRight size={20} />
          </motion.button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[80vw] overflow-x-auto">
            {images.map((img, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                className={`flex-shrink-0 w-12 h-9 overflow-hidden border-2 cursor-pointer transition-all ${i === idx ? "border-primary-400" : "border-transparent opacity-50 hover:opacity-100"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Share Sheet
// ─────────────────────────────────────────────────────────────
function ShareSheet({ title }) {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.18 }}
      className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-neutral-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50">
      <div className="px-4 py-2.5 border-b border-neutral-100">
        <p className="font-heading font-bold text-[10px] tracking-[0.14em] uppercase text-neutral-400">Share</p>
      </div>
      {[
        {
          label: copied ? "Copied!" : "Copy Link",
          icon: copied ? <Check size={13} /> : <Link2 size={13} />,
          action: async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); },
        },
        {
          label: "WhatsApp",
          icon: <MessageCircle size={13} />,
          action: () => window.open(`https://wa.me/?text=${encodeURIComponent(title + "\n" + url)}`, "_blank"),
        },
        {
          label: "Twitter / X",
          icon: <Share2 size={13} />,
          action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank"),
        },
      ].map(o => (
        <button key={o.label} onClick={o.action}
          className="w-full flex items-center gap-3 px-4 py-2.5 font-heading font-semibold text-[12px] bg-transparent border-none cursor-pointer text-left hover:bg-primary-50 text-secondary-600">
          <span className="text-neutral-400">{o.icon}</span> {o.label}
        </button>
      ))}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Related card
// ─────────────────────────────────────────────────────────────
function RelatedCard({ listing, onView }) {
  const cover = getCover(listing);
  return (
    <motion.div whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.1)" }}
      className="bg-white border border-neutral-200 overflow-hidden cursor-pointer group"
      onClick={() => onView(listing)}>
      <div className="h-[140px] overflow-hidden relative">
        {cover ? (
          <motion.img src={cover} alt={listing.name} whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.5 }} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary-50 flex items-center justify-center">
            <Home size={20} className="text-primary-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute top-2 left-2 text-white px-2 py-0.5 font-heading font-bold text-[9px] uppercase"
          style={{ background: listing.type === "residential" ? "#9F4325" : "#0E1A2B" }}>
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

// ─────────────────────────────────────────────────────────────
// FadeUp
// ─────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function PropertyDetailPage() {
  const { id }                = useParams();
  const navigate              = useNavigate();
  const { listings, loading } = useListings();
  const { user }              = useAuth();
  const listing               = listings.find(l => String(l.id) === String(id));

  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [shareOpen,   setShareOpen]   = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [activeImg,   setActiveImg]   = useState(0);
  const [scrollPct,   setScrollPct]   = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);  // ← controls modal directly
  const shareRef = useRef(null);

  useEffect(() => {
    const h = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      setScrollPct(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const h = e => { if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-heading font-bold text-[11px] tracking-[0.16em] uppercase text-neutral-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-heading font-bold text-4xl text-primary-600 mb-2">404</p>
          <h2 className="font-heading font-bold text-xl text-secondary-600 mb-1">Property not found</h2>
          <p className="font-body text-sm text-neutral-500 mb-6">This listing may have been removed.</p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/properties")}
            className="h-10 px-8 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors">
            Browse All Listings
          </motion.button>
        </div>
      </div>
    );
  }

  const images  = getImages(listing);
  const related = listings.filter(l => l.id !== listing.id && l.type === listing.type).slice(0, 4);

  // ── Action handlers ─────────────────────────────────────────
  const handleEnquire     = () => setEnquiryOpen(true);   // opens modal directly — no event bus
  const handleBookViewing = () => setEnquiryOpen(true);   // same modal

  const handleWhatsApp = () => {
    const msg = `Hi TJC Properties, I'm interested in: *${listing.name}* (${listing.location || ""}). Could you provide more details?`;
    window.open(`https://wa.me/${TJC_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const statusColor = {
    available:    "bg-green-600 text-white",
    let:          "bg-neutral-500 text-white",
    sold:         "bg-red-700 text-white",
    "off-market": "bg-neutral-700 text-white",
  }[listing.status] || "bg-green-600 text-white";

  return (
    <>
      {/* Enquiry modal lives here — opens/closes via enquiryOpen state */}
      <AnimatePresence>
        {enquiryOpen && (
          <EnquiryModal listing={listing} onClose={() => setEnquiryOpen(false)} />
        )}
      </AnimatePresence>

      <section className="bg-neutral-100 py-28">
        <div className="min-h-screen bg-neutral-100 pb-24">

          {/* Progress bar */}
          <div className="fixed top-0 left-0 z-50 h-[3px] bg-primary-600 transition-all duration-100"
            style={{ width: `${scrollPct}%` }} />

          {/* Sticky nav */}
          <div className="sticky top-0 z-40 border-b border-neutral-200 backdrop-blur-md"
            style={{ background: "rgba(245,244,241,0.94)" }}>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer text-neutral-500 hover:text-primary-600 transition-colors">
                <ArrowLeft size={13} /> Back
              </motion.button>
              <div className="hidden sm:flex items-center gap-1.5 font-heading text-[11px] text-neutral-400 min-w-0">
                <button onClick={() => navigate("/properties")}
                  className="bg-transparent border-none cursor-pointer text-neutral-400 hover:text-primary-600 transition-colors">
                  Properties
                </button>
                <span>/</span>
                <span className="text-secondary-600 font-bold truncate max-w-[200px]">{listing.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setSaved(v => !v)}
                  className="w-9 h-9 flex items-center justify-center border border-neutral-200 bg-white cursor-pointer hover:border-primary-600 transition-colors"
                  style={{ color: saved ? "#9F4325" : "#7A7A7A" }}>
                  <Heart size={14} fill={saved ? "#9F4325" : "none"} />
                </motion.button>
                <div className="relative" ref={shareRef}>
                  <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShareOpen(v => !v)}
                    className="w-9 h-9 flex items-center justify-center border border-neutral-200 bg-white cursor-pointer hover:border-primary-600 text-neutral-500 hover:text-primary-600 transition-colors">
                    <Share2 size={14} />
                  </motion.button>
                  <AnimatePresence>{shareOpen && <ShareSheet title={listing.name} />}</AnimatePresence>
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
              <div className="h-[400px] overflow-hidden cursor-zoom-in group" onClick={() => setLightboxIdx(0)}>
                <img src={images[0]} alt={listing.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[380px] sm:h-[440px]">
                <div className="col-span-4 sm:col-span-3 row-span-2 overflow-hidden relative cursor-zoom-in group"
                  onClick={() => setLightboxIdx(0)}>
                  <motion.img src={images[0]} alt={listing.name}
                    whileHover={{ scale: 1.03 }} transition={{ duration: 0.5 }}
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-3 right-3 bg-black/55 text-white font-heading font-bold text-[10px] px-2.5 py-1 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={10} /> Expand
                  </div>
                </div>
                {images.slice(1, 3).map((img, i) => (
                  <div key={i} className="col-span-4 sm:col-span-1 overflow-hidden relative cursor-zoom-in group"
                    onClick={() => setLightboxIdx(i + 1)}>
                    <motion.img src={img} alt={`Photo ${i + 2}`}
                      whileHover={{ scale: 1.06 }} transition={{ duration: 0.45 }}
                      className="w-full h-full object-cover" />
                    {i === 1 && images.length > 3 && (
                      <div className="absolute inset-0 bg-black/55 flex items-center justify-center gap-1">
                        <span className="font-heading font-bold text-white text-[16px]">+{images.length - 3}</span>
                        <span className="font-heading text-white/70 text-[11px]">photos</span>
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
                  <button key={i} onClick={() => { setActiveImg(i); setLightboxIdx(i); }}
                    className={`flex-shrink-0 w-16 h-12 overflow-hidden border-2 cursor-pointer transition-all ${activeImg === i ? "border-primary-600" : "border-transparent opacity-60 hover:opacity-100"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">

              {/* Left column */}
              <div>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {listing.category && (
                      <span className="text-[10px] tracking-[0.18em] uppercase font-heading font-bold px-3 py-1 text-white bg-primary-600">
                        {listing.category}
                      </span>
                    )}
                    {listing.status && (
                      <span className={`text-[10px] tracking-[0.18em] uppercase font-heading font-bold px-3 py-1 ${statusColor}`}>
                        {listing.status}
                      </span>
                    )}
                  </div>
                  <h1 className="font-heading font-bold text-secondary-600 leading-[1.15]"
                    style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)" }}>
                    {listing.name}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-2 font-body text-[13px] text-neutral-500">
                    <MapPin size={13} className="text-primary-600 flex-shrink-0" /> {listing.location}
                  </div>
                </motion.div>

                {/* Stats */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                  className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: <Home size={16} />,      label: "Type",     value: listing.type?.[0]?.toUpperCase() + listing.type?.slice(1) || "—" },
                    { icon: <Tag size={16} />,       label: "Category", value: listing.category || "—" },
                    { icon: <Users size={16} />,     label: "Units",    value: listing.units ?? "—" },
                    { icon: <Building2 size={16} />, label: "Status",   value: listing.status?.[0]?.toUpperCase() + listing.status?.slice(1) || "Available" },
                  ].map((s, i) => (
                    <div key={i} className="bg-white border border-neutral-200 p-4 flex flex-col gap-2">
                      <span className="text-primary-600">{s.icon}</span>
                      <div>
                        <p className="font-heading font-bold text-[10px] tracking-[0.14em] uppercase text-neutral-400">{s.label}</p>
                        <p className="font-heading font-bold text-[14px] text-secondary-600 mt-0.5">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* Price */}
                {listing.priceLabel && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="mt-6 flex items-end gap-3 border-l-4 border-primary-600 pl-4 py-2">
                    <div>
                      <p className="font-heading font-bold text-[10px] tracking-[0.16em] uppercase text-neutral-400">Asking Price</p>
                      <p className="font-heading font-bold text-secondary-600 mt-0.5" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
                        ₦{listing.priceLabel}
                      </p>
                    </div>
                    <span className="font-body text-[12px] text-neutral-400 pb-1">Negotiable</span>
                  </motion.div>
                )}

                {/* Description */}
                {listing.description && (
                  <FadeUp delay={0.1} className="mt-8">
                    <h2 className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase text-primary-600 mb-3">About This Property</h2>
                    <div className="font-body text-[15px] leading-[1.85] text-neutral-600 whitespace-pre-line">{listing.description}</div>
                  </FadeUp>
                )}

                {/* Features */}
                {listing.features?.length > 0 && (
                  <FadeUp delay={0.1} className="mt-8">
                    <h2 className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase text-primary-600 mb-4">Features & Amenities</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {listing.features.map((f, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 bg-white border border-neutral-100 px-4 py-3">
                          <CheckCircle size={14} className="text-primary-600 flex-shrink-0" />
                          <span className="font-body text-[13px] text-secondary-600">{f}</span>
                        </motion.div>
                      ))}
                    </div>
                  </FadeUp>
                )}

                {/* Why this property — uses whyPoints saved by admin, falls back to defaults */}
                {(() => {
                  const ICON_CYCLE = [
                    <MapPin size={18} />, <Building2 size={18} />, <CheckCircle size={18} />,
                    <Sparkles size={18} />, <Users size={18} />, <Tag size={18} />,
                  ];
                  const points = listing.whyPoints?.length
                    ? listing.whyPoints
                    : [
                        { title: "Prime Location",   body: "Strategically located with easy access to major roads and city amenities." },
                        { title: "Quality Finish",   body: "Built to high standards with durable materials and modern design." },
                        { title: "Verified Listing", body: "All documents verified by the TJC Properties team for your peace of mind." },
                      ];
                  return (
                    <FadeUp delay={0.1} className="mt-10">
                      <div className="bg-white border border-neutral-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles size={14} className="text-primary-600" />
                          <p className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase text-primary-600">Why This Property?</p>
                        </div>
                        <div className={`grid gap-5 ${points.length <= 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
                          {points.map((item, i) => (
                            <div key={i} className="flex flex-col gap-2">
                              <span className="text-primary-600">{ICON_CYCLE[i % ICON_CYCLE.length]}</span>
                              <p className="font-heading font-bold text-[13px] text-secondary-600">{item.title}</p>
                              <p className="font-body text-[12px] text-neutral-500 leading-relaxed">{item.body}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </FadeUp>
                  );
                })()}

                {/* Schedule viewing */}
                <FadeUp delay={0.05} className="mt-5">
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-5 bg-primary-50 border border-primary-100">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-primary-600 flex items-center justify-center flex-shrink-0">
                        <Calendar size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-[13px] text-secondary-600">Schedule a Viewing</p>
                        <p className="font-body text-[12px] text-neutral-500">Mon–Sat, 8am–6pm.</p>
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={handleBookViewing}
                      className="h-10 px-6 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors flex-shrink-0">
                      Book Viewing
                    </motion.button>
                  </div>
                </FadeUp>
              </div>

              {/* Right sidebar */}
              <aside>
                <div className="sticky top-20 space-y-4">
                  <div className="bg-white border border-neutral-200 p-5">
                    <div className="space-y-2.5">
                      {/* Send Enquiry */}
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={handleEnquire}
                        className="w-full h-11 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[12px] uppercase tracking-[0.08em] border-none cursor-pointer transition-colors flex items-center justify-center gap-2">
                        <Mail size={14} /> Send Enquiry
                      </motion.button>

                      {/* WhatsApp */}
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={handleWhatsApp}
                        className="w-full h-11 border border-neutral-200 bg-white hover:bg-neutral-50 text-secondary-600 font-heading font-bold text-[12px] uppercase tracking-[0.08em] cursor-pointer transition-colors flex items-center justify-center gap-2">
                        <MessageCircle size={14} className="text-green-500" /> WhatsApp Us
                      </motion.button>

                      {/* Call */}
                      <a href={`tel:${TJC_PHONE_NUMBER}`}
                        className="w-full h-11 border border-neutral-200 bg-white hover:bg-neutral-50 text-secondary-600 font-heading font-bold text-[12px] uppercase tracking-[0.08em] cursor-pointer transition-colors flex items-center justify-center gap-2 no-underline">
                        <PhoneCall size={14} className="text-primary-600" /> Call Agent
                      </a>
                    </div>
                    <p className="font-body text-[10px] text-neutral-400 text-center mt-3">
                      Response within 2–4 hours on business days
                    </p>
                  </div>

                  {/* Agent card — shows assigned agent name if set */}
                  <div className="bg-secondary-600 p-5">
                    <p className="font-heading font-bold text-[10px] tracking-[0.16em] uppercase text-white/50 mb-3">Your Agent</p>
                    <AgentDisplay agentId={listing.agentId} />
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleWhatsApp}
                        className="flex-1 h-9 bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-[10px] uppercase border-none cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                        <MessageCircle size={12} /> Chat
                      </motion.button>
                      <a href={`tel:${TJC_PHONE_NUMBER}`}
                        className="flex-1 h-9 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[10px] uppercase border-none cursor-pointer transition-colors flex items-center justify-center gap-1.5 no-underline">
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
                      <p className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase text-primary-600">Similar Properties</p>
                    </div>
                    <h3 className="font-heading font-bold text-xl text-secondary-600">
                      More {listing.type?.[0]?.toUpperCase()}{listing.type?.slice(1)} Listings
                    </h3>
                  </div>
                  <motion.button whileHover={{ x: 3 }} onClick={() => navigate("/properties")}
                    className="font-heading font-bold text-[11px] tracking-[0.08em] uppercase flex items-center gap-1 text-primary-600 bg-transparent border-none cursor-pointer">
                    View All <ExternalLink size={11} />
                  </motion.button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {related.map((l, i) => (
                    <motion.div key={l.id}
                      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                      <RelatedCard listing={l} onView={l => navigate(`/properties/${l.id}`)} />
                    </motion.div>
                  ))}
                </div>
              </FadeUp>
            )}

            {/* Bottom CTA */}
            <FadeUp className="mt-14">
              <div className="relative overflow-hidden bg-secondary-600 p-8 sm:p-12">
                <div className="absolute inset-0" style={{
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
                  backgroundSize: "40px 40px",
                }} />
                <div className="relative">
                  <p className="font-heading font-bold text-[11px] tracking-[0.2em] uppercase text-primary-400 mb-3">TJC Properties</p>
                  <h3 className="font-heading font-bold text-white leading-snug max-w-[500px]"
                    style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.7rem)" }}>
                    Interested in this property or something similar?
                  </h3>
                  <p className="font-body text-white/55 text-[14px] mt-2 max-w-[420px]">
                    Our agents are available Mon–Sat, 8am to 6pm.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-6">
                    <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                      onClick={handleEnquire}
                      className="flex items-center gap-2 h-11 px-6 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors">
                      <Mail size={13} /> Send Enquiry
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                      onClick={handleWhatsApp}
                      className="flex items-center gap-2 h-11 px-6 border border-white/25 hover:border-white/60 text-white font-heading font-bold text-[11px] uppercase bg-transparent cursor-pointer transition-colors">
                      <MessageCircle size={13} /> WhatsApp
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                      onClick={() => navigate("/properties")}
                      className="flex items-center gap-2 h-11 px-6 border border-white/25 hover:border-white/60 text-white font-heading font-bold text-[11px] uppercase bg-transparent cursor-pointer transition-colors">
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
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleWhatsApp}
                className="flex-1 h-11 flex items-center justify-center gap-2 border border-neutral-200 font-heading font-bold text-[11px] uppercase text-secondary-600 bg-white cursor-pointer">
                <MessageCircle size={13} className="text-green-500" /> WhatsApp
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleEnquire}
                className="flex-1 h-11 flex items-center justify-center gap-2 bg-primary-600 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer">
                <Mail size={13} /> Enquire
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {lightboxIdx !== null && (
              <Lightbox images={images} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}