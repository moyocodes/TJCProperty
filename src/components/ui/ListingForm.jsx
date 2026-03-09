// src/components/listings/ListingForm.jsx
// Images → Cloudinary upload → stored as string[] in Firestore under `images`.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, ImagePlus, Loader2, Save,
  ArrowLeft, Plus, CheckCircle, Settings,
} from "lucide-react";

import CategoriesManager from "./CategoriesManager";
import { useListings } from "../../auth/ListingsProvider";
import { useCategories } from "../../auth/CategoriesProvider";

const TYPES    = ["residential", "commercial"];
const STATUSES = ["available", "let", "sold", "off-market"];

/* ─────────────────────────────────────
   Cloudinary upload
───────────────────────────────────── */
async function uploadToCloudinary(file) {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.success || !data.imageUrl)
    throw new Error("No URL returned from upload");
  return data.imageUrl;
}

/* ─────────────────────────────────────
   Normalise whatever comes from Firestore
   into a flat { src, isNew, file? } shape.
   Firestore stores images as string[].
───────────────────────────────────── */
function normaliseImages(raw = []) {
  return raw
    .map((item) => {
      if (typeof item === "string") return { src: item,     isNew: false };
      if (item?.url)                return { src: item.url, isNew: false };
      return null;
    })
    .filter(Boolean);
}

/* ─────────────────────────────────────
   Form primitives
───────────────────────────────────── */
function Field({ label, required, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600">
          {label}
          {required && <span className="ml-1 text-primary-600">*</span>}
        </label>
        {hint && <span className="font-body text-[10px] text-neutral-400">{hint}</span>}
      </div>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="font-body text-[11px] text-danger-700"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const baseInput =
  "w-full bg-white font-[inherit] text-[14px] text-secondary-600 outline-none px-4 py-[0.7rem] border transition-colors duration-200";

function TInput({ value, onChange, placeholder, type = "text", error, disabled, ...rest }) {
  const [f, setF] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      className={`${baseInput} ${error ? "border-danger-600" : f ? "border-primary-600" : "border-neutral-200"} ${disabled ? "opacity-60" : ""}`}
      {...rest}
    />
  );
}

function TTextarea({ value, onChange, placeholder, rows = 4, disabled }) {
  const [f, setF] = useState(false);
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder}
      rows={rows} disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      className={`${baseInput} resize-y ${f ? "border-primary-600" : "border-neutral-200"} ${disabled ? "opacity-60" : ""}`}
    />
  );
}

function TSelect({ value, onChange, options, placeholder, disabled, error }) {
  const [f, setF] = useState(false);
  return (
    <select
      value={value} onChange={onChange} disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      className={`${baseInput} cursor-pointer appearance-none pr-10 ${error ? "border-danger-600" : f ? "border-primary-600" : "border-neutral-200"} ${disabled ? "opacity-60" : ""}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239F4325' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
          {typeof o === "string" ? o : o.label}
        </option>
      ))}
    </select>
  );
}

function Card({ title, hint, children }) {
  return (
    <div className="border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-heading font-bold text-[11px] tracking-[0.14em] uppercase text-primary-600">{title}</p>
        {hint && <span className="font-body text-[10px] text-neutral-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function UploadProgress({ current, total }) {
  if (!total) return null;
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[11px] font-heading font-bold text-neutral-500">
        <span>Uploading to Cloudinary…</span>
        <span>{current}/{total}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden bg-neutral-200">
        <motion.div
          className="h-full bg-primary-600"
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
  const [showCats,      setShowCats]      = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalToUpload, setTotalToUpload] = useState(0);
  const [urlIn,         setUrlIn]         = useState("");
  const [featIn,        setFeatIn]        = useState("");

  // Each item: { src: string, isNew: boolean, file?: File }
  const [images, setImages] = useState([]);

  const [form, setForm] = useState({
    name: "", type: "residential", category: "", location: "",
    price: "", priceLabel: "", units: "1", status: "available",
    features: [], description: "",
  });

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
    // Accept string[] OR legacy { url } objects OR single image string
    const raw =
      editingListing.images ??
      (editingListing.image ? [editingListing.image] : []);
    setImages(normaliseImages(raw));
  }, [editingListing]);

  const up = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const handleFiles = (files) => {
    const entries = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ src: URL.createObjectURL(file), isNew: true, file }));
    setImages((p) => [...p, ...entries]);
  };

  const commitUrl = () => {
    const u = urlIn.trim();
    if (u) { setImages((p) => [...p, { src: u, isNew: false }]); setUrlIn(""); }
  };

  const removeImg = (i) => {
    setImages((p) => {
      const next = [...p];
      if (next[i]?.isNew) URL.revokeObjectURL(next[i].src);
      next.splice(i, 1);
      return next;
    });
  };

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

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setErrors({});
    try {
      const toUpload   = images.filter((i) => i.isNew && i.file);
      const alreadyUrl = images.filter((i) => !i.isNew).map((i) => i.src);

      setTotalToUpload(toUpload.length);
      setUploadedCount(0);

      const freshUrls = [];
      for (const entry of toUpload) {
        const url = await uploadToCloudinary(entry.file);
        freshUrls.push(url);
        setUploadedCount((c) => c + 1);
      }

      // Final string[] — existing first so cover stays at index 0
      const allImages = [...alreadyUrl, ...freshUrls];

      const payload = {
        ...form,
        units:  Number(form.units),
        images: allImages,          // ← string[] stored in Firestore
        image:  allImages[0] ?? "", // ← convenience cover field
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
        className="min-h-screen pb-20 bg-neutral-100"
      >
        <div className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(14,26,43,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(14,26,43,0.025) 1px,transparent 1px)",
            backgroundSize: "60px 60px", zIndex: 0,
          }}
        />

        {/* Sticky header */}
        <div className="sticky top-0 z-30 border-b border-neutral-200 backdrop-blur-md"
          style={{ background: "rgba(245,244,241,0.92)" }}>
          <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
                onClick={onCancel} disabled={saving}
                className="flex items-center gap-1.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer disabled:opacity-50 text-neutral-500 hover:text-primary-600 transition-colors">
                <ArrowLeft size={13} /> Back
              </motion.button>
              <span className="text-neutral-200">|</span>
              <div>
                <p className="text-[10px] tracking-[0.18em] uppercase font-heading font-bold text-primary-600">
                  {isEditing ? "Editing" : "New Listing"}
                </p>
                <h1 className="font-heading font-bold leading-none mt-0.5 truncate text-secondary-600"
                  style={{ fontSize: "clamp(13px,2vw,17px)" }}>
                  {form.name || (isEditing ? "Edit Property" : "Add New Property")}
                </h1>
              </div>
            </div>

            <motion.button
              whileHover={!saving && !saved ? { scale: 1.03, y: -1 } : {}} whileTap={{ scale: 0.97 }}
              onClick={handleSubmit} disabled={saving || saved}
              className={`flex items-center gap-1.5 h-9 px-5 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none cursor-pointer transition-colors disabled:opacity-70 ${saved ? "bg-success-600" : saving ? "bg-neutral-400" : "bg-primary-600 hover:bg-primary-500"}`}>
              {saved ? <CheckCircle size={12} /> : saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saved ? "Saved!" : saving ? "Saving…" : isEditing ? "Save Changes" : "Publish"}
            </motion.button>
          </div>

          <AnimatePresence>
            {saving && totalToUpload > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="max-w-[860px] mx-auto px-4 sm:px-6 pb-3">
                <UploadProgress current={uploadedCount} total={totalToUpload} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form body */}
        <div className="relative max-w-[860px] mx-auto px-4 sm:px-6 py-8 space-y-5" style={{ zIndex: 1 }}>

          <AnimatePresence>
            {errors._global && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="px-4 py-3 border border-danger-200 bg-danger-50 font-body text-[13px] text-danger-700">
                {errors._global}
              </motion.div>
            )}
          </AnimatePresence>

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
                    className="w-[46px] h-[46px] flex items-center justify-center border border-neutral-200 cursor-pointer flex-shrink-0 bg-white text-neutral-500 hover:border-primary-600 hover:text-primary-600 transition-colors">
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
                <TInput value={form.price} onChange={e => up("price", e.target.value)} placeholder="5000000" disabled={saving} />
              </Field>
              <Field label="Price Label" hint="Shown on card">
                <TInput value={form.priceLabel} onChange={e => up("priceLabel", e.target.value)} placeholder="₦5M/yr" disabled={saving} />
              </Field>
              <Field label="Units Available">
                <TInput type="number" value={form.units} onChange={e => up("units", e.target.value)} placeholder="1" disabled={saving} />
              </Field>
            </div>
            <Field label="Status">
              <TSelect value={form.status} onChange={e => up("status", e.target.value)}
                options={STATUSES.map(s => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
                placeholder="Select status" disabled={saving} />
            </Field>
          </Card>

          <Card title="Features & Amenities">
            <div className="flex gap-2">
              <TInput value={featIn} onChange={e => setFeatIn(e.target.value)}
                placeholder="e.g. Modern Kitchen, Borehole"
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())}
                disabled={saving} />
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={addFeature} disabled={saving || !featIn.trim()}
                className="flex items-center gap-1 px-4 h-[46px] text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer disabled:opacity-50 bg-primary-600 hover:bg-primary-500 transition-colors">
                <Plus size={13} /> Add
              </motion.button>
            </div>
            {form.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {form.features.map(f => (
                  <div key={f} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 border border-neutral-200 bg-white font-heading font-semibold text-[11px] text-secondary-600">
                    {f}
                    <button onClick={() => up("features", form.features.filter(x => x !== f))}
                      className="flex items-center justify-center w-4 h-4 bg-transparent border-none cursor-pointer text-neutral-400 hover:text-danger-700 transition-colors">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Description">
            <TTextarea value={form.description} onChange={e => up("description", e.target.value)}
              placeholder="Describe the property — location highlights, finishing, access roads…" rows={5} disabled={saving} />
          </Card>

          {/* ── Images ── */}
          <Card title="Property Images" hint="First image = cover">
            {/* Drop zone */}
            <div
              className="relative border-2 border-dashed border-neutral-200 cursor-pointer transition-all hover:border-primary-600"
              style={{ background: "#faf9f7", minHeight: 90 }}
              onClick={() => !saving && document.getElementById("listing-img-upload").click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-primary-600"); }}
              onDragLeave={e => e.currentTarget.classList.remove("border-primary-600")}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("border-primary-600"); handleFiles(e.dataTransfer.files); }}
            >
              <input id="listing-img-upload" type="file" accept="image/*" multiple className="hidden"
                disabled={saving} onChange={e => handleFiles(e.target.files)} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                <Upload size={22} className="text-neutral-300" />
                <p className="font-heading font-semibold text-[12px] text-neutral-500">Click or drag images here</p>
                <p className="font-body text-[10px] text-neutral-300">PNG · JPG · WEBP</p>
              </div>
            </div>

            {/* URL paste */}
            <div className="flex gap-2">
              <TInput value={urlIn} onChange={e => setUrlIn(e.target.value)}
                placeholder="Or paste an image URL…"
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), commitUrl())}
                disabled={saving} />
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={commitUrl} disabled={saving || !urlIn.trim()}
                className="flex items-center gap-1 px-3 h-[46px] border border-neutral-200 bg-white font-heading font-bold text-[11px] uppercase cursor-pointer disabled:opacity-50 text-primary-600 hover:bg-primary-50 transition-colors">
                <ImagePlus size={13} /> Add
              </motion.button>
            </div>

            {/* Preview grid */}
            <AnimatePresence>
              {images.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {images.map((img, i) => (
                    <motion.div key={img.src + i} layout
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group aspect-square overflow-hidden border border-neutral-200">

                      <img
                        src={img.src}
                        alt={`property-${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={e => {
                          e.currentTarget.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23F5F4F1'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='9' fill='%23aaa'%3EBroken%3C/text%3E%3C/svg%3E";
                        }}
                      />

                      {/* Cover badge on first */}
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[8px] font-heading font-bold tracking-widest uppercase text-white px-1.5 py-0.5 bg-primary-600">
                          Cover
                        </span>
                      )}

                      {/* NEW badge */}
                      {img.isNew && !saving && (
                        <span className="absolute top-1 left-1 text-[8px] font-heading font-bold uppercase text-white px-1 py-0.5 bg-secondary-600">
                          NEW
                        </span>
                      )}

                      {/* Uploading spinner */}
                      {img.isNew && saving && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 size={18} className="animate-spin text-white" />
                        </div>
                      )}

                      {/* Remove */}
                      <button onClick={() => removeImg(i)} disabled={saving}
                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer disabled:cursor-not-allowed bg-black/60 hover:bg-danger-700">
                        <X size={10} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {images.length > 0 && (
              <p className="font-body text-[11px] text-neutral-400">
                {images.length} image{images.length !== 1 ? "s" : ""} ·{" "}
                {images.filter(i => i.isNew).length} new (pending upload) ·{" "}
                {images.filter(i => !i.isNew).length} saved
              </p>
            )}
          </Card>

          {/* Bottom actions */}
          <div className="flex justify-between items-center pt-2 flex-wrap gap-3">
            <motion.button whileHover={{ x: -3 }} onClick={onCancel} disabled={saving}
              className="flex items-center gap-1.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer disabled:opacity-50 text-neutral-500 hover:text-danger-700 transition-colors">
              <X size={13} /> Discard
            </motion.button>
            <motion.button
              whileHover={!saving && !saved ? { scale: 1.03, y: -2 } : {}} whileTap={{ scale: 0.97 }}
              onClick={handleSubmit} disabled={saving || saved}
              className={`flex items-center gap-2 h-10 px-8 text-white font-heading font-bold text-xs tracking-[0.1em] uppercase border-none cursor-pointer transition-colors disabled:opacity-70 ${saved ? "bg-success-600" : saving ? "bg-neutral-400" : "bg-primary-600 hover:bg-primary-500"}`}>
              {saved ? <CheckCircle size={13} /> : saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saved ? "Saved!" : saving ? "Saving…" : isEditing ? "Save Changes" : "Publish Listing"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showCats && <CategoriesManager onClose={() => setShowCats(false)} />}
      </AnimatePresence>
    </>
  );
}