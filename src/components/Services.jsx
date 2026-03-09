// src/components/sections/Services.jsx
// 2-column grid of tall cards. Description reveals on hover/tap (no carousel).

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Save, Upload, Loader2, CheckCircle } from "lucide-react";
import { FadeUp, SectionTag } from "./ui";
import { useServices } from "../auth/ServicesProvider";
import { useAuth } from "../auth/AuthProvider";

async function uploadToCloudinary(file) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || `Upload failed`); }
  const data = await res.json();
  if (!data.success || !data.imageUrl) throw new Error("No URL returned");
  return data.imageUrl;
}

const ICON_OPTIONS = ["🏠","🏢","🔑","📋","💼","🏗️","🏙️","🌆","📐","🛋️","🏡","🏦","📊","💡","🔧","🤝","🌍","📍","💰","✅"];

/* ── ServiceForm modal ── */
function ServiceForm({ service, onDone, onCancel }) {
  const { createService, updateService } = useServices();
  const isEditing = !!service;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [imgPreview, setImgPreview] = useState(service?.img || "");
  const [imgFile, setImgFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: service?.name||"", desc: service?.desc||"", icon: service?.icon||"🏠", n: service?.n||"" });

  const up = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };
  const handleFile = (files) => { const f = files[0]; if (!f?.type.startsWith("image/")) return; setImgFile(f); setImgPreview(URL.createObjectURL(f)); };

  const handleSubmit = async () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.desc.trim()) e.desc = "Required";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      let imgUrl = service?.img || "";
      if (imgFile) { setUploading(true); imgUrl = await uploadToCloudinary(imgFile); setUploading(false); }
      const payload = { ...form, img: imgUrl };
      if (isEditing) await updateService(service.id, payload); else await createService(payload);
      setSaved(true); setTimeout(onDone, 800);
    } catch (err) { setErrors({ _global: err.message }); } finally { setSaving(false); setUploading(false); }
  };

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto px-4 py-10"
      style={{ background: "rgba(14,26,43,0.8)", backdropFilter: "blur(6px)" }} onClick={onCancel}>
      <motion.div initial={{ y: 24, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[520px] bg-neutral-100 border border-neutral-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
          <div>
            <p className="text-[10px] tracking-[0.18em] uppercase font-heading font-bold text-primary-600">{isEditing ? "Editing" : "New Service"}</p>
            <h3 className="font-heading font-bold text-[16px] text-secondary-600 mt-0.5">{form.name || "Service Card"}</h3>
          </div>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-neutral-400 hover:text-secondary-600"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {errors._global && <div className="px-4 py-3 border border-red-200 bg-red-50 font-body text-[13px] text-red-700">{errors._global}</div>}
          <div>
            <p className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600 mb-2">Background Image</p>
            <div className={`relative border-2 border-dashed cursor-pointer overflow-hidden transition-all ${imgPreview ? "border-primary-300" : "border-neutral-200 hover:border-primary-400"}`}
              style={{ height: imgPreview ? 180 : 100, background: "#faf9f7" }}
              onClick={() => !saving && document.getElementById("svc-img").click()}
              onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}>
              <input id="svc-img" type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files)} disabled={saving} />
              {imgPreview ? (<><img src={imgPreview} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><span className="font-heading font-bold text-[11px] uppercase text-white flex items-center gap-2"><Upload size={13} /> Change</span></div></>) : (<div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"><Upload size={20} className="text-neutral-300" /><p className="font-heading font-semibold text-[12px] text-neutral-400">Click or drag image</p></div>)}
              {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-white" /></div>}
            </div>
          </div>
          <div>
            <p className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600 mb-2">Icon <span className="text-primary-600 ml-1">{form.icon}</span></p>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map(icon => (<button key={icon} onClick={() => up("icon", icon)} className={`w-9 h-9 flex items-center justify-center text-[18px] border cursor-pointer ${form.icon === icon ? "border-primary-600 bg-primary-50" : "border-neutral-200 bg-white hover:border-primary-300"}`}>{icon}</button>))}
            </div>
          </div>
          <div>
            <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600 mb-1.5 block">Card Number</label>
            <input value={form.n} onChange={e => up("n", e.target.value)} placeholder="01" className="w-24 bg-white font-heading text-[20px] text-secondary-600 outline-none px-4 py-2 border border-neutral-200 focus:border-primary-600 transition-colors" disabled={saving} />
          </div>
          <div>
            <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600 mb-1.5 block">Service Name <span className="text-primary-600">*</span></label>
            <input value={form.name} onChange={e => up("name", e.target.value)} placeholder="e.g. Property Sales" className={`w-full bg-white font-heading text-[14px] text-secondary-600 outline-none px-4 py-3 border transition-colors ${errors.name ? "border-red-400" : "border-neutral-200 focus:border-primary-600"}`} disabled={saving} />
            {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600 mb-1.5 block">Description <span className="text-primary-600">*</span></label>
            <textarea value={form.desc} onChange={e => up("desc", e.target.value)} placeholder="Describe what this service covers…" rows={3} className={`w-full bg-white font-body text-[14px] text-secondary-600 outline-none px-4 py-3 border resize-y transition-colors ${errors.desc ? "border-red-400" : "border-neutral-200 focus:border-primary-600"}`} disabled={saving} />
            {errors.desc && <p className="text-[11px] text-red-600 mt-1">{errors.desc}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-white">
          <button onClick={onCancel} disabled={saving} className="flex items-center gap-1.5 font-heading font-bold text-[11px] uppercase text-neutral-500 hover:text-red-600 bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50"><X size={12} /> Discard</button>
          <motion.button whileHover={!saving && !saved ? { scale: 1.03, y: -1 } : {}} whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={saving || saved}
            className={`flex items-center gap-2 h-10 px-6 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors disabled:opacity-70 ${saved ? "bg-green-600" : saving ? "bg-neutral-400" : "bg-primary-600 hover:bg-primary-500"}`}>
            {saved ? <CheckCircle size={13} /> : saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saved ? "Saved!" : saving ? (uploading ? "Uploading…" : "Saving…") : isEditing ? "Save Changes" : "Add Service"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/* ── Delete confirm ── */
function DeleteConfirm({ service, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[160] flex items-center justify-center px-4"
      style={{ background: "rgba(14,26,43,0.8)", backdropFilter: "blur(6px)" }} onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-[340px] bg-neutral-100 border border-neutral-200 p-7" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-10 bg-red-50 flex items-center justify-center mb-4"><Trash2 size={18} className="text-red-600" /></div>
        <h3 className="font-heading font-bold text-[16px] text-secondary-600">Delete Service?</h3>
        <p className="font-body text-[13px] text-neutral-500 mt-1.5"><strong className="text-secondary-600">{service.name}</strong> will be permanently removed.</p>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} disabled={busy} className="flex-1 h-10 border border-neutral-200 font-heading font-bold text-[11px] uppercase cursor-pointer bg-white text-neutral-500 hover:text-secondary-600 transition-colors disabled:opacity-50">Cancel</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={async () => { setBusy(true); await onConfirm(); }} disabled={busy}
            className="flex-1 h-10 font-heading font-bold text-[11px] uppercase text-white bg-red-600 hover:bg-red-700 border-none cursor-pointer disabled:opacity-60 transition-colors">
            {busy ? "Deleting…" : "Yes, Delete"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/* ── Service card ── */
function ServiceCard({ service, isAdmin, onEdit, onDelete, index }) {
  const [open, setOpen] = useState(false);

  return (
    <FadeUp delay={index * 0.1}>
      <div
        onClick={() => setOpen(v => !v)}
        className={`relative overflow-hidden cursor-pointer group`}
        style={{ height: "clamp(320px, 42vw, 520px)" }}
      >
        {/* BG */}
        {service.img ? (
          <img src={service.img} alt={service.name}
            className={`w-full h-full object-cover transition-transform duration-600 group-hover:scale-105 ${open ? "scale-105" : ""}`}
            draggable={false} />
        ) : (
          <div className="w-full h-full bg-secondary-500 flex items-center justify-center text-7xl">{service.icon || "🏠"}</div>
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary-600/95 via-secondary-600/30 to-transparent" />

        {/* Hover overlay */}
        <div className={`absolute inset-0 bg-secondary-600/75 backdrop-blur-[2px] transition-opacity duration-350 opacity-0 group-hover:opacity-100 ${open ? "!opacity-100" : ""}`} />

        {/* Admin buttons */}
        {isAdmin && (
          <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
              onClick={e => { e.stopPropagation(); onEdit(service); }}
              className="w-8 h-8 flex items-center justify-center text-white border-none cursor-pointer bg-black/40 hover:bg-secondary-600 transition-colors">
              <Pencil size={13} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
              onClick={e => { e.stopPropagation(); onDelete(service); }}
              className="w-8 h-8 flex items-center justify-center text-white border-none cursor-pointer bg-red-600/70 hover:bg-red-600 transition-colors">
              <Trash2 size={13} />
            </motion.button>
          </div>
        )}

        {/* Content */}
        <div className="absolute inset-0 p-8 sm:p-10 flex flex-col justify-end">
          {/* Big ghost number */}
          <div className={`font-heading leading-none select-none transition-opacity duration-300 group-hover:opacity-0 ${open ? "opacity-0" : "opacity-100"}`}
            style={{ fontSize: "5rem", fontWeight: 300, color: "rgba(255,255,255,0.06)", marginBottom: "-0.5rem" }}>
            {service.n}
          </div>

          <div className="text-[26px] mb-3">{service.icon}</div>

          <h3 className="font-heading font-bold text-white mb-0" style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.6rem)" }}>
            {service.name}
          </h3>

          {/* Description — slides up */}
          <div className={`overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] max-h-0 group-hover:max-h-[160px] ${open ? "max-h-[160px]" : ""}`}>
            <p className="font-body text-white/70 text-[14px] leading-relaxed mt-3">{service.desc}</p>
          </div>

          {/* Animated bottom line */}
          <div className={`mt-5 h-[2px] bg-primary-600 origin-left transition-transform duration-500 scale-x-0 group-hover:scale-x-100 ${open ? "scale-x-100" : ""}`}
            style={{ width: 56 }} />

          {/* Mobile tap hint */}
          <p className={`md:hidden font-heading font-bold text-[9px] tracking-[0.16em] uppercase text-white/25 mt-4 transition-opacity ${open ? "opacity-0 h-0 mt-0" : "opacity-100"}`}>
            Tap to learn more
          </p>
        </div>
      </div>
    </FadeUp>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function Services() {
  const { isAdmin } = useAuth();
  const { services, loading, deleteService } = useServices();
  const [editFor,   setEditFor]   = useState(null);
  const [showNew,   setShowNew]   = useState(false);
  const [deleteFor, setDeleteFor] = useState(null);

  if (loading) {
    return (
      <section id="services" className="py-24 px-[5%] bg-secondary-600">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 gap-0.5">
          {[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-secondary-500" style={{ height: "clamp(320px, 42vw, 520px)" }} />)}
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="services" className="py-24 px-[5%] bg-secondary-600">
        <div className="max-w-[1200px] mx-auto">

          {/* Header */}
          <div className="flex justify-between items-end mb-14 flex-wrap gap-8">
            <FadeUp>
              <SectionTag light>What We Do</SectionTag>
              <h2 className="font-heading text-white leading-[1.2] mt-0"
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
                    <Plus size={13} /> Add
                  </motion.button>
                )}
              </div>
            </FadeUp>
          </div>

          {/* Grid — 2 cols, all visible */}
          {services.length === 0 ? (
            <div className="text-center py-20 border border-white/10">
              <p className="font-heading font-bold text-white/50 text-lg">No services yet</p>
              {isAdmin && <p className="font-body text-white/30 text-sm mt-1">Click "Add" to get started.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
              {services.map((s, i) => (
                <ServiceCard key={s.id} service={s} index={i} isAdmin={isAdmin}
                  onEdit={setEditFor} onDelete={setDeleteFor} />
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showNew   && <ServiceForm onDone={() => setShowNew(false)} onCancel={() => setShowNew(false)} />}
        {editFor   && <ServiceForm service={editFor} onDone={() => setEditFor(null)} onCancel={() => setEditFor(null)} />}
        {deleteFor && (
          <DeleteConfirm service={deleteFor}
            onConfirm={async () => { await deleteService(deleteFor.id); setDeleteFor(null); }}
            onCancel={() => setDeleteFor(null)} />
        )}
      </AnimatePresence>
    </>
  );
}