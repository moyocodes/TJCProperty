// src/components/sections/Services.jsx
// Full-width drag/swipe carousel. Each card fills the viewport width.
// Admin: Add / Edit / Delete preserved via portal modals.
// Uses framer-motion drag for swipe + keyboard nav + dot indicators.

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  Plus, Pencil, Trash2, X, Save, Upload,
  Loader2, CheckCircle, ChevronLeft, ChevronRight,
} from "lucide-react";

import { FadeUp, SectionTag } from "./ui";
import { useServices } from "../auth/ServicesProvider";
import { useAuth } from "../auth/AuthProvider";

/* ── Cloudinary upload ───────────────────────────────────── */
async function uploadToCloudinary(file) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.success || !data.imageUrl) throw new Error("No URL returned from upload");
  return data.imageUrl;
}

/* ── Icon options ────────────────────────────────────────── */
const ICON_OPTIONS = [
  "🏠","🏢","🔑","📋","💼","🏗️","🏙️","🌆","📐","🛋️","🏡","🏦",
  "📊","💡","🔧","🤝","🌍","📍","💰","✅",
];

/* ══════════════════════════════════════════════════════════
   SERVICE FORM (unchanged logic, same portal pattern)
══════════════════════════════════════════════════════════ */
function ServiceForm({ service, onDone, onCancel }) {
  const { createService, updateService } = useServices();
  const isEditing = !!service;

  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [errors,     setErrors]     = useState({});
  const [imgPreview, setImgPreview] = useState(service?.img || "");
  const [imgFile,    setImgFile]    = useState(null);
  const [uploading,  setUploading]  = useState(false);

  const [form, setForm] = useState({
    name: service?.name || "",
    desc: service?.desc || "",
    icon: service?.icon || "🏠",
    n:    service?.n    || "",
  });

  const up = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const handleFile = (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Service name required";
    if (!form.desc.trim()) e.desc = "Description required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      let imgUrl = service?.img || "";
      if (imgFile) {
        setUploading(true);
        imgUrl = await uploadToCloudinary(imgFile);
        setUploading(false);
      }
      const payload = { ...form, img: imgUrl };
      if (isEditing) await updateService(service.id, payload);
      else           await createService(payload);
      setSaved(true);
      setTimeout(onDone, 800);
    } catch (err) {
      console.error(err);
      setErrors({ _global: err.message || "Failed to save." });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto px-4 py-10"
      style={{ background: "rgba(14,26,43,0.8)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}>
      <motion.div
        initial={{ y: 24, scale: 0.98 }} animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.97 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[520px] bg-neutral-100 border border-neutral-200"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase font-heading font-bold text-primary-600">
              {isEditing ? "Editing Service" : "New Service"}
            </p>
            <h3 className="font-heading font-bold text-[16px] text-secondary-600 mt-0.5">
              {form.name || "Service Card"}
            </h3>
          </div>
          <button onClick={onCancel} disabled={saving}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-neutral-400 hover:text-secondary-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {errors._global && (
            <div className="px-4 py-3 border border-red-200 bg-red-50 font-body text-[13px] text-red-700">
              {errors._global}
            </div>
          )}

          {/* Image */}
          <div>
            <p className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600 mb-2">Background Image</p>
            <div className={`relative border-2 border-dashed transition-all cursor-pointer overflow-hidden
              ${imgPreview ? "border-primary-300" : "border-neutral-200 hover:border-primary-400"}`}
              style={{ height: imgPreview ? 180 : 100, background: "#faf9f7" }}
              onClick={() => !saving && document.getElementById("service-img-input").click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}>
              <input id="service-img-input" type="file" accept="image/*" className="hidden"
                onChange={e => handleFile(e.target.files)} disabled={saving} />
              {imgPreview ? (
                <>
                  <img src={imgPreview} alt="preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="font-heading font-bold text-[11px] uppercase text-white flex items-center gap-2">
                      <Upload size={13} /> Change Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <Upload size={20} className="text-neutral-300" />
                  <p className="font-heading font-semibold text-[12px] text-neutral-400">Click or drag image</p>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <p className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600 mb-2">
              Icon <span className="text-primary-600 ml-1">{form.icon}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map(icon => (
                <button key={icon} onClick={() => up("icon", icon)}
                  className={`w-9 h-9 flex items-center justify-center text-[18px] border cursor-pointer transition-all
                    ${form.icon === icon ? "border-primary-600 bg-primary-50" : "border-neutral-200 bg-white hover:border-primary-300"}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Number */}
          <div>
            <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600 mb-1.5 block">
              Card Number <span className="font-body text-[10px] text-neutral-400 ml-1">(e.g. 01, 02…)</span>
            </label>
            <input value={form.n} onChange={e => up("n", e.target.value)} placeholder="01"
              className="w-24 bg-white font-heading text-[20px] text-secondary-600 outline-none px-4 py-2 border border-neutral-200 focus:border-primary-600 transition-colors"
              disabled={saving} />
          </div>

          {/* Name */}
          <div>
            <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600 mb-1.5 block">
              Service Name <span className="text-primary-600">*</span>
            </label>
            <input value={form.name} onChange={e => up("name", e.target.value)}
              placeholder="e.g. Property Sales"
              className={`w-full bg-white font-heading text-[14px] text-secondary-600 outline-none px-4 py-3 border transition-colors
                ${errors.name ? "border-red-400" : "border-neutral-200 focus:border-primary-600"}`}
              disabled={saving} />
            {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600 mb-1.5 block">
              Description <span className="text-primary-600">*</span>
            </label>
            <textarea value={form.desc} onChange={e => up("desc", e.target.value)}
              placeholder="Describe what this service covers…" rows={3}
              className={`w-full bg-white font-body text-[14px] text-secondary-600 outline-none px-4 py-3 border resize-y transition-colors
                ${errors.desc ? "border-red-400" : "border-neutral-200 focus:border-primary-600"}`}
              disabled={saving} />
            {errors.desc && <p className="text-[11px] text-red-600 mt-1">{errors.desc}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-white">
          <button onClick={onCancel} disabled={saving}
            className="flex items-center gap-1.5 font-heading font-bold text-[11px] uppercase text-neutral-500 hover:text-red-600 bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50">
            <X size={12} /> Discard
          </button>
          <motion.button whileHover={!saving && !saved ? { scale: 1.03, y: -1 } : {}} whileTap={{ scale: 0.97 }}
            onClick={handleSubmit} disabled={saving || saved}
            className={`flex items-center gap-2 h-10 px-6 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors disabled:opacity-70
              ${saved ? "bg-green-600" : saving ? "bg-neutral-400" : "bg-primary-600 hover:bg-primary-500"}`}>
            {saved  ? <CheckCircle size={13} /> : saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saved ? "Saved!" : saving ? (uploading ? "Uploading…" : "Saving…") : isEditing ? "Save Changes" : "Add Service"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/* ── Delete confirm ──────────────────────────────────────── */
function DeleteConfirm({ service, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[160] flex items-center justify-center px-4"
      style={{ background: "rgba(14,26,43,0.8)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-[340px] bg-neutral-100 border border-neutral-200 p-7"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-10 bg-red-50 flex items-center justify-center mb-4">
          <Trash2 size={18} className="text-red-600" />
        </div>
        <h3 className="font-heading font-bold text-[16px] text-secondary-600">Delete Service?</h3>
        <p className="font-body text-[13px] text-neutral-500 mt-1.5">
          <strong className="text-secondary-600">{service.name}</strong> will be permanently removed.
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} disabled={busy}
            className="flex-1 h-10 border border-neutral-200 font-heading font-bold text-[11px] uppercase cursor-pointer bg-white text-neutral-500 hover:text-secondary-600 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={async () => { setBusy(true); await onConfirm(); }}
            disabled={busy}
            className="flex-1 h-10 font-heading font-bold text-[11px] uppercase text-white bg-red-600 hover:bg-red-700 border-none cursor-pointer disabled:opacity-60 transition-colors">
            {busy ? "Deleting…" : "Yes, Delete"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/* ══════════════════════════════════════════════════════════
   CAROUSEL
══════════════════════════════════════════════════════════ */
export default function Services() {
  const { isAdmin } = useAuth();
  const { services, loading, deleteService } = useServices();

  const [current,   setCurrent]   = useState(0);
  const [editFor,   setEditFor]   = useState(null);
  const [showNew,   setShowNew]   = useState(false);
  const [deleteFor, setDeleteFor] = useState(null);
  const [dragging,  setDragging]  = useState(false);

  const count = services.length;

  const prev = useCallback(() => setCurrent(c => (c - 1 + count) % count), [count]);
  const next = useCallback(() => setCurrent(c => (c + 1) % count), [count]);

  // Drag-to-swipe threshold
  const handleDragEnd = (_, info) => {
    setDragging(false);
    if (info.offset.x < -60) next();
    else if (info.offset.x > 60) prev();
  };

  if (loading) {
    return (
      <section id="services" className="py-24 px-[5%] bg-secondary-600">
        <div className="max-w-[1200px] mx-auto">
          <div className="h-[520px] animate-pulse bg-secondary-500" />
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="services" className="py-24 bg-secondary-600 overflow-hidden">

        {/* ── Section header ── */}
        <div className="px-[5%]">
          <div className="max-w-[1200px] mx-auto flex justify-between items-end mb-14 flex-wrap gap-8">
            <FadeUp>
              <SectionTag light>What We Do</SectionTag>
              <h2
                className="font-heading text-white leading-[1.2] mt-0"
                style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 400 }}>
                Our <em className="not-italic text-primary-500">Core</em><br />Services
              </h2>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="flex items-end gap-4">
                <p className="font-body text-white/50 text-[0.95rem] leading-relaxed max-w-[360px]">
                  Every service is designed to make your property journey seamless —
                  from finding the right space to managing it long-term.
                </p>
                {isAdmin && (
                  <motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNew(true)}
                    className="flex-shrink-0 flex items-center gap-1.5 h-9 px-4 text-white font-heading font-bold text-[11px] uppercase border border-white/25 hover:border-white/60 bg-transparent cursor-pointer transition-colors">
                    <Plus size={13} /> Add Service
                  </motion.button>
                )}
              </div>
            </FadeUp>
          </div>
        </div>

        {/* ── Carousel ── */}
        {count === 0 ? (
          <div className="px-[5%]">
            <div className="max-w-[1200px] mx-auto text-center py-20 border border-white/10">
              <p className="font-heading font-bold text-white/50 text-lg">No services yet</p>
              {isAdmin && <p className="font-body text-white/30 text-sm mt-1">Click "Add Service" to get started.</p>}
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Slide window */}
            <div className="overflow-hidden">
              <motion.div
                className="flex"
                animate={{ x: `-${current * 100}%` }}
                transition={{ type: "spring", stiffness: 260, damping: 32 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragStart={() => setDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ cursor: dragging ? "grabbing" : "grab" }}>

                {services.map((s, i) => (
                  <div key={s.id} className="relative flex-shrink-0 w-full" style={{ height: "clamp(420px, 60vh, 600px)" }}>

                    {/* BG image */}
                    {s.img ? (
                      <img src={s.img} alt={s.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ${i === current ? "scale-100" : "scale-105"}`}
                        draggable={false} />
                    ) : (
                      <div className="w-full h-full bg-secondary-500 flex items-center justify-center" style={{ fontSize: "6rem" }}>
                        {s.icon || "🏠"}
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary-600/90 via-secondary-600/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary-600/80 via-transparent to-transparent" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end px-[5%] pb-14 max-w-[680px]">
                      {/* Index / total */}
                      <div className="flex items-center gap-3 mb-5">
                        <span className="font-heading font-bold text-[11px] tracking-[0.2em] uppercase text-primary-500">
                          {String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                        </span>
                        <span className="flex-1 h-px bg-white/15" />
                      </div>

                      {/* Icon + name */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl leading-none">{s.icon}</span>
                        <h3 className="font-heading font-bold text-white leading-tight"
                          style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
                          {s.name}
                        </h3>
                      </div>

                      {/* Description — animate in when slide is active */}
                      <AnimatePresence>
                        {i === current && (
                          <motion.p
                            key={`desc-${s.id}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.18, duration: 0.45 }}
                            className="font-body text-white/70 text-[15px] leading-relaxed max-w-[460px]">
                            {s.desc}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {/* Bottom accent line */}
                      <motion.div
                        className="mt-8 h-[2px] bg-primary-600 origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: i === current ? 1 : 0 }}
                        transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        style={{ width: 80 }}
                      />
                    </div>

                    {/* Admin controls — top right */}
                    {isAdmin && (
                      <div className="absolute top-4 right-4 z-10 flex gap-1.5">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                          onClick={e => { e.stopPropagation(); setEditFor(s); }}
                          className="w-8 h-8 flex items-center justify-center text-white border-none cursor-pointer bg-secondary-600/70 hover:bg-secondary-600 transition-colors backdrop-blur-sm">
                          <Pencil size={13} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                          onClick={e => { e.stopPropagation(); setDeleteFor(s); }}
                          className="w-8 h-8 flex items-center justify-center text-white border-none cursor-pointer bg-red-600/70 hover:bg-red-600 transition-colors backdrop-blur-sm">
                          <Trash2 size={13} />
                        </motion.button>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── Nav arrows ── */}
            {count > 1 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.08, x: -2 }} whileTap={{ scale: 0.94 }}
                  onClick={prev}
                  className="absolute left-[3%] top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center text-white border border-white/20 bg-secondary-600/60 backdrop-blur-sm hover:bg-secondary-600 hover:border-white/50 transition-all cursor-pointer">
                  <ChevronLeft size={20} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.08, x: 2 }} whileTap={{ scale: 0.94 }}
                  onClick={next}
                  className="absolute right-[3%] top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center text-white border border-white/20 bg-secondary-600/60 backdrop-blur-sm hover:bg-secondary-600 hover:border-white/50 transition-all cursor-pointer">
                  <ChevronRight size={20} />
                </motion.button>
              </>
            )}

            {/* ── Dot indicators + service name tabs ── */}
            {count > 1 && (
              <div className="flex items-center justify-center gap-6 mt-8 px-[5%]">
                {/* Dot strip */}
                <div className="flex items-center gap-2">
                  {services.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                      className="relative h-[3px] bg-transparent border-none cursor-pointer transition-all duration-300 overflow-hidden"
                      style={{ width: i === current ? 32 : 12 }}>
                      <span className="absolute inset-0" style={{ background: i === current ? "var(--color-primary-600, #9F4325)" : "rgba(255,255,255,0.2)" }} />
                    </button>
                  ))}
                </div>

                {/* Service name tabs — desktop only */}
                <div className="hidden md:flex items-center gap-1 overflow-x-auto">
                  {services.map((s, i) => (
                    <button key={s.id} onClick={() => setCurrent(i)}
                      className={`px-4 py-2 font-heading font-bold text-[10px] tracking-[0.12em] uppercase border-none cursor-pointer transition-all whitespace-nowrap
                        ${i === current
                          ? "text-white bg-white/10"
                          : "text-white/35 bg-transparent hover:text-white/65"}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showNew  && <ServiceForm onDone={() => setShowNew(false)}  onCancel={() => setShowNew(false)} />}
        {editFor  && <ServiceForm service={editFor} onDone={() => setEditFor(null)}   onCancel={() => setEditFor(null)} />}
        {deleteFor && (
          <DeleteConfirm service={deleteFor}
            onConfirm={async () => { await deleteService(deleteFor.id); setDeleteFor(null); }}
            onCancel={() => setDeleteFor(null)} />
        )}
      </AnimatePresence>
    </>
  );
}