// src/components/listings/ListingForm.jsx
// Admin form to add or edit a property listing.
// Images are uploaded to Cloudinary via /api/upload (not Firebase Storage).

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, ImagePlus, Loader2, Save,
  ArrowLeft, Plus, CheckCircle, Settings,
} from "lucide-react";

import CategoriesManager from "./CategoriesManager";
import { useListings } from "../../auth/ListingsProvider";
import { useCategories } from "../../auth/CategoriesProvider";

const T = {
  primary: "#9F4325", pHov: "#D97C5C", pLt: "#FBEAE2",
  navy: "#0E1A2B", bg: "#F5F4F1", border: "#E5E0D8",
  muted: "#7A7A7A", white: "#FFFFFF", danger: "#B91C1C", success: "#16A34A",
};

const TYPES    = ["residential", "commercial"];
const STATUSES = ["available", "let", "sold", "off-market"];

/* ─────────────────────────────────────
   Cloudinary upload helper
   Calls your /api/upload endpoint and returns the secure image URL.
───────────────────────────────────── */
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload failed (${res.status})`);
  }

  const data = await res.json();
  if (!data.success || !data.imageUrl) throw new Error("No URL returned from upload");
  return data.imageUrl;
}

/* ─────────────────────────────────────
   Tiny form primitives
───────────────────────────────────── */
function Field({ label, required, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase" style={{ color: T.navy }}>
          {label}{required && <span className="ml-1" style={{ color: T.primary }}>*</span>}
        </label>
        {hint && <span className="font-body text-[10px]" style={{ color: T.muted }}>{hint}</span>}
      </div>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="font-body text-[11px]" style={{ color: T.danger }}>{error}</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputStyle = (focused, error) => ({
  width: "100%", background: T.white, fontFamily: "inherit", fontSize: 14,
  outline: "none", padding: "0.7rem 1rem", color: T.navy,
  border: `1px solid ${error ? T.danger : focused ? T.primary : T.border}`,
  transition: "border-color 0.2s",
});

function TInput({ value, onChange, placeholder, type = "text", error, disabled, ...rest }) {
  const [f, setF] = useState(false);
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    disabled={disabled} onFocus={() => setF(true)} onBlur={() => setF(false)}
    style={{ ...inputStyle(f, error), opacity: disabled ? 0.6 : 1 }} {...rest} />;
}

function TTextarea({ value, onChange, placeholder, rows = 4, disabled }) {
  const [f, setF] = useState(false);
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    disabled={disabled} onFocus={() => setF(true)} onBlur={() => setF(false)}
    style={{ ...inputStyle(f), resize: "vertical", opacity: disabled ? 0.6 : 1 }} />;
}

function TSelect({ value, onChange, options, placeholder, disabled, error }) {
  const [f, setF] = useState(false);
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{
        ...inputStyle(f, error), cursor: "pointer", appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239F4325' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: "2.5rem",
        opacity: disabled ? 0.6 : 1,
      }}>
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
          {typeof o === "string" ? o : o.label}
        </option>
      ))}
    </select>
  );
}

function Card({ title, hint, children }) {
  return (
    <div className="border p-5 sm:p-6 space-y-4" style={{ borderColor: T.border, background: T.white }}>
      <div className="flex items-center justify-between">
        <p className="font-heading font-bold text-[11px] tracking-[0.14em] uppercase" style={{ color: T.primary }}>{title}</p>
        {hint && <span className="font-body text-[10px]" style={{ color: T.muted }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────
   Upload progress indicator
───────────────────────────────────── */
function UploadProgress({ current, total }) {
  if (!total) return null;
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[11px] font-heading font-bold" style={{ color: T.muted }}>
        <span>Uploading images…</span>
        <span>{current}/{total}</span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: T.border }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: T.primary }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function ListingForm({ editingListing, onDone, onCancel }) {
  const { createListing, updateListing } = useListings();
  const { categories } = useCategories();
  const isEditing = !!editingListing;

  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [errors,        setErrors]        = useState({});
  const [images,        setImages]        = useState([]); // { file, preview, isNew } | { url, path }
  const [urlIn,         setUrlIn]         = useState("");
  const [featIn,        setFeatIn]        = useState("");
  const [showCats,      setShowCats]      = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalToUpload, setTotalToUpload] = useState(0);

  const [form, setForm] = useState({
    name: "", type: "residential", category: "", location: "",
    price: "", priceLabel: "", units: "1", status: "available",
    features: [], description: "",
  });

  // Populate form when editing
  useEffect(() => {
    if (!editingListing) return;
    setForm({
      name:        editingListing.name        || "",
      type:        editingListing.type        || "residential",
      category:    editingListing.category    || "",
      location:    editingListing.location    || "",
      price:       editingListing.price       || "",
      priceLabel:  editingListing.priceLabel  || "",
      units:       String(editingListing.units || "1"),
      status:      editingListing.status      || "available",
      features:    editingListing.features    || [],
      description: editingListing.description || "",
    });
    const imgs = editingListing.images
      || (editingListing.image ? [{ url: editingListing.image, path: null }] : []);
    setImages(imgs);
  }, [editingListing]);

  const up = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const handleFiles = (files) => {
    const entries = Array.from(files)
      .filter(f => f.type.startsWith("image/"))
      .map(file => ({ file, preview: URL.createObjectURL(file), isNew: true }));
    setImages(p => [...p, ...entries]);
  };

  const commitUrl = () => {
    const u = urlIn.trim();
    if (u) { setImages(p => [...p, { url: u, path: null }]); setUrlIn(""); }
  };

  const removeImg = (i) => setImages(p => {
    const next = [...p];
    if (next[i]?.preview) URL.revokeObjectURL(next[i].preview);
    next.splice(i, 1);
    return next;
  });

  const addFeature = () => {
    const f = featIn.trim();
    if (f && !form.features.includes(f)) { up("features", [...form.features, f]); setFeatIn(""); }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Property name required";
    if (!form.location.trim()) e.location = "Location required";
    if (!form.category)        e.category = "Select a category";
    return e;
  };

  /* ── Submit: upload new files to Cloudinary, then save listing ── */
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setErrors({});

    try {
      // Separate new file uploads from already-resolved URLs
      const newEntries  = images.filter(i => i.isNew && i.file);
      const existingUrls = images
        .filter(i => !i.isNew)
        .map(i => i.url || (typeof i === "string" ? i : ""))
        .filter(Boolean);

      // Upload each new file to Cloudinary sequentially
      // (parallel uploads can be swapped in by using Promise.all if preferred)
      setTotalToUpload(newEntries.length);
      setUploadedCount(0);

      const uploadedUrls = [];
      for (const entry of newEntries) {
        const url = await uploadToCloudinary(entry.file);
        uploadedUrls.push(url);
        setUploadedCount(c => c + 1);
      }

      // All image URLs to persist (existing first keeps cover image order)
      const allImageUrls = [...existingUrls, ...uploadedUrls];

      const payload = {
        ...form,
        units: Number(form.units),
        images: allImageUrls,
        // Convenience field — first image used as card cover
        image: allImageUrls[0] || "",
      };

      if (isEditing) {
        await updateListing(editingListing.id, payload);
      } else {
        await createListing(payload);
      }

      setSaved(true);
      setTimeout(onDone, 900);
    } catch (err) {
      console.error("Save error:", err);
      setErrors({ _global: err.message || "Failed to save. Please try again." });
    } finally {
      setSaving(false);
      setTotalToUpload(0);
      setUploadedCount(0);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen pb-20" style={{ background: T.bg }}>

        {/* Texture overlay */}
        <div className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(14,26,43,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(14,26,43,0.025) 1px,transparent 1px)",
          backgroundSize: "60px 60px", zIndex: 0,
        }} />

        {/* Sticky top bar */}
        <div className="sticky top-0 z-30 border-b backdrop-blur-md"
          style={{ background: "rgba(245,244,241,0.92)", borderColor: T.border }}>
          <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
                onClick={onCancel} disabled={saving}
                className="flex items-center gap-1.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer disabled:opacity-50"
                style={{ color: T.muted }}
                onMouseEnter={e => e.currentTarget.style.color = T.primary}
                onMouseLeave={e => e.currentTarget.style.color = T.muted}>
                <ArrowLeft size={13} /> Back
              </motion.button>
              <span style={{ color: T.border }}>|</span>
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase font-heading font-bold" style={{ color: T.primary }}>
                  {isEditing ? "Editing" : "New Listing"}
                </p>
                <h1 className="font-heading font-bold leading-none mt-0.5 truncate"
                  style={{ fontSize: "clamp(13px,2vw,17px)", color: T.navy }}>
                  {form.name || (isEditing ? "Edit Property" : "Add New Property")}
                </h1>
              </div>
            </div>

            <motion.button
              whileHover={!saving && !saved ? { scale: 1.03, y: -1 } : {}}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit} disabled={saving || saved}
              className="flex items-center gap-1.5 h-9 px-5 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none cursor-pointer transition-colors disabled:opacity-70"
              style={{ background: saved ? T.success : saving ? T.muted : T.primary }}
              onMouseEnter={e => { if (!saving && !saved) e.currentTarget.style.background = T.pHov; }}
              onMouseLeave={e => { if (!saving && !saved) e.currentTarget.style.background = T.primary; }}>
              {saved   ? <CheckCircle size={12} />
               : saving ? <Loader2 size={12} className="animate-spin" />
               :          <Save size={12} />}
              {saved ? "Saved!" : saving ? "Saving…" : isEditing ? "Save Changes" : "Publish"}
            </motion.button>
          </div>

          {/* Upload progress bar — shown inside the sticky bar while uploading */}
          <AnimatePresence>
            {saving && totalToUpload > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="max-w-[860px] mx-auto px-4 sm:px-6 pb-3">
                <UploadProgress current={uploadedCount} total={totalToUpload} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form body */}
        <div className="relative max-w-[860px] mx-auto px-4 sm:px-6 py-8 space-y-5" style={{ zIndex: 1 }}>

          {/* Global error */}
          <AnimatePresence>
            {errors._global && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="px-4 py-3 border font-body text-[13px]"
                style={{ background: "#FEF2F2", borderColor: "#FECACA", color: T.danger }}>
                {errors._global}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Property details ── */}
          <Card title="Property Details">
            <Field label="Property Name" required error={errors.name}>
              <TInput value={form.name} onChange={e => up("name", e.target.value)}
                placeholder="e.g. 3 Bedroom Flat, Bodija" error={errors.name} disabled={saving} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Type">
                <TSelect value={form.type} onChange={e => up("type", e.target.value)}
                  options={TYPES.map(t => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))}
                  placeholder="Select type" disabled={saving} />
              </Field>

              <Field label="Category" required error={errors.category}>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <TSelect value={form.category} onChange={e => up("category", e.target.value)}
                      options={categories.map(c => c.name)}
                      placeholder="Select category" error={errors.category} disabled={saving} />
                  </div>
                  <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCats(true)} type="button"
                    title="Manage categories"
                    className="w-[46px] h-[46px] flex items-center justify-center border cursor-pointer flex-shrink-0 transition-colors"
                    style={{ borderColor: T.border, color: T.muted, background: T.white }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
                    <Settings size={15} />
                  </motion.button>
                </div>
              </Field>
            </div>

            <Field label="Location / Address" required error={errors.location}>
              <TInput value={form.location} onChange={e => up("location", e.target.value)}
                placeholder="e.g. Bodija Estate, Ibadan" error={errors.location} disabled={saving} />
            </Field>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Price (₦)">
                <TInput value={form.price} onChange={e => up("price", e.target.value)}
                  placeholder="5000000" disabled={saving} />
              </Field>
              <Field label="Price Label" hint="Shown on card">
                <TInput value={form.priceLabel} onChange={e => up("priceLabel", e.target.value)}
                  placeholder="₦5M/yr" disabled={saving} />
              </Field>
              <Field label="Units Available">
                <TInput type="number" value={form.units} onChange={e => up("units", e.target.value)}
                  placeholder="1" disabled={saving} />
              </Field>
            </div>

            <Field label="Status">
              <TSelect value={form.status} onChange={e => up("status", e.target.value)}
                options={STATUSES.map(s => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
                placeholder="Select status" disabled={saving} />
            </Field>
          </Card>

          {/* ── Features ── */}
          <Card title="Features & Amenities">
            <div className="flex gap-2">
              <TInput value={featIn} onChange={e => setFeatIn(e.target.value)}
                placeholder="e.g. Modern Kitchen, Borehole"
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())}
                disabled={saving} />
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={addFeature} disabled={saving || !featIn.trim()}
                className="flex items-center gap-1 px-4 h-[46px] text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer disabled:opacity-50"
                style={{ background: T.primary }}>
                <Plus size={13} /> Add
              </motion.button>
            </div>

            {form.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {form.features.map(f => (
                  <div key={f} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 border font-heading font-semibold text-[11px]"
                    style={{ borderColor: T.border, background: T.white, color: T.navy }}>
                    {f}
                    <button onClick={() => up("features", form.features.filter(x => x !== f))}
                      className="flex items-center justify-center w-4 h-4 bg-transparent border-none cursor-pointer"
                      style={{ color: T.muted }}
                      onMouseEnter={e => e.currentTarget.style.color = T.danger}
                      onMouseLeave={e => e.currentTarget.style.color = T.muted}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Description ── */}
          <Card title="Description">
            <TTextarea value={form.description} onChange={e => up("description", e.target.value)}
              placeholder="Describe the property — location highlights, finishing, access roads…" rows={5} disabled={saving} />
          </Card>

          {/* ── Images ── */}
          <Card title="Property Images" hint="First image = cover">
            {/* Drop zone */}
            <div className="relative border-2 border-dashed cursor-pointer transition-all"
              style={{ borderColor: T.border, background: "#faf9f7", minHeight: 90 }}
              onClick={() => !saving && document.getElementById("listing-img-upload").click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.background = T.pLt; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "#faf9f7"; }}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.background = "#faf9f7";
                handleFiles(e.dataTransfer.files);
              }}>
              <input id="listing-img-upload" type="file" accept="image/*" multiple className="hidden"
                disabled={saving} onChange={e => handleFiles(e.target.files)} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                <Upload size={22} style={{ color: T.border }} />
                <p className="font-heading font-semibold text-[12px]" style={{ color: T.muted }}>
                  Click or drag images to upload
                </p>
                <p className="font-body text-[10px]" style={{ color: T.border }}>PNG · JPG · WEBP</p>
              </div>
            </div>

            {/* URL fallback */}
            <div className="flex gap-2">
              <TInput value={urlIn} onChange={e => setUrlIn(e.target.value)}
                placeholder="Or paste an image URL…"
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), commitUrl())}
                disabled={saving} />
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={commitUrl} disabled={saving || !urlIn.trim()}
                className="flex items-center gap-1 px-3 h-[46px] border font-heading font-bold text-[11px] uppercase cursor-pointer disabled:opacity-50"
                style={{ borderColor: T.border, color: T.primary, background: T.white }}
                onMouseEnter={e => e.currentTarget.style.background = T.pLt}
                onMouseLeave={e => e.currentTarget.style.background = T.white}>
                <ImagePlus size={13} /> Add
              </motion.button>
            </div>

            {/* Preview grid */}
            <AnimatePresence>
              {images.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {images.map((img, i) => {
                    const src = img.preview || img.url || (typeof img === "string" ? img : "");
                    return (
                      <motion.div key={i} layout
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative group aspect-square overflow-hidden border"
                        style={{ borderColor: T.border }}>
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 text-[8px] font-heading font-bold tracking-widest uppercase text-white px-1.5 py-0.5"
                            style={{ background: T.primary }}>Cover</span>
                        )}
                        {/* Show "uploading" badge on new files while saving */}
                        {img.isNew && saving && (
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: "rgba(0,0,0,0.45)" }}>
                            <Loader2 size={18} className="animate-spin text-white" />
                          </div>
                        )}
                        <button onClick={() => removeImg(i)} disabled={saving}
                          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer disabled:cursor-not-allowed"
                          style={{ background: "rgba(0,0,0,0.6)" }}>
                          <X size={10} />
                        </button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Bottom actions */}
          <div className="flex justify-between items-center pt-2 flex-wrap gap-3">
            <motion.button whileHover={{ x: -3 }} onClick={onCancel} disabled={saving}
              className="flex items-center gap-1.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer disabled:opacity-50"
              style={{ color: T.muted }}
              onMouseEnter={e => e.currentTarget.style.color = T.danger}
              onMouseLeave={e => e.currentTarget.style.color = T.muted}>
              <X size={13} /> Discard
            </motion.button>

            <motion.button
              whileHover={!saving && !saved ? { scale: 1.03, y: -2 } : {}}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit} disabled={saving || saved}
              className="flex items-center gap-2 h-10 px-8 text-white font-heading font-bold text-xs tracking-[0.1em] uppercase border-none cursor-pointer transition-colors disabled:opacity-70"
              style={{ background: saved ? T.success : saving ? T.muted : T.primary }}
              onMouseEnter={e => { if (!saving && !saved) e.currentTarget.style.background = T.pHov; }}
              onMouseLeave={e => { if (!saving && !saved) e.currentTarget.style.background = T.primary; }}>
              {saved   ? <CheckCircle size={13} />
               : saving ? <Loader2 size={13} className="animate-spin" />
               :          <Save size={13} />}
              {saved ? "Saved!" : saving ? "Saving…" : isEditing ? "Save Changes" : "Publish Listing"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Categories Manager overlay */}
      <AnimatePresence>
        {showCats && <CategoriesManager onClose={() => setShowCats(false)} />}
      </AnimatePresence>
    </>
  );
}