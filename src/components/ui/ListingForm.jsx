// src/components/listings/ListingForm.jsx
// Enhanced: feature tag suggestions, "Why This Property" suggestions,
// assign agent, featured toggle.

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, ImagePlus, Loader2, Save,
  ArrowLeft, Plus, CheckCircle, Settings,
  Sparkles, User, ChevronDown, Star,
} from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../components/firebase";

import CategoriesManager from "./CategoriesManager";
import { useListings }    from "../../auth/ListingsProvider";
import { useCategories }  from "../../auth/CategoriesProvider";

const TYPES    = ["residential", "commercial"];
const STATUSES = ["available", "let", "sold", "off-market"];

const RESIDENTIAL_FEATURES = [
  "Borehole Water","Prepaid Meter","POP Ceiling","Tiled Floors","Security Door",
  "Perimeter Fence","Gate House","CCTV","Generator","Solar Panels","Swimming Pool",
  "Gym","Kids Playground","Parking Space","Air Conditioning","Modern Kitchen",
  "Fitted Wardrobes","Balcony","Garden","Servant Quarters","BQ Inclusive",
  "En-suite Bathrooms","Fibre Internet Ready","Intercom","Elevator",
];
const COMMERCIAL_FEATURES = [
  "Open Plan Office","Conference Room","Reception Area","Air Conditioning","Generator",
  "Parking Space","CCTV","Fire Suppression","Borehole Water","Prepaid Meter",
  "Loading Bay","High Ceiling","Mezzanine Floor","24hr Security","Fibre Internet",
  "Elevator","Canteen","Toilet Facilities","Shop Front","Store Room",
];

const WHY_SUGGESTIONS = {
  residential: [
    { title: "Prime Location",    body: "Strategically located with easy access to major roads and city amenities." },
    { title: "Quality Finish",    body: "Built to high standards with durable materials and modern design." },
    { title: "Verified Listing",  body: "All documents verified by the TJC Properties team for your peace of mind." },
    { title: "Secure Estate",     body: "Located in a well-secured estate with 24/7 surveillance and controlled access." },
    { title: "Modern Utilities",  body: "Equipped with borehole water, prepaid meter, and generator backup." },
    { title: "Great Investment",  body: "Strong rental demand in this area makes this an excellent long-term investment." },
    { title: "Family Friendly",   body: "Close to top schools, hospitals, and shopping centres." },
    { title: "Flexible Payment",  body: "Developer offers flexible payment plans — pay in instalments." },
  ],
  commercial: [
    { title: "High Foot Traffic",     body: "Located on a busy corridor with thousands of daily passersby." },
    { title: "Ample Parking",         body: "Dedicated parking for staff and clients with easy access." },
    { title: "Modern Infrastructure", body: "Fitted with fibre internet, air conditioning, and reliable power backup." },
    { title: "Verified Listing",      body: "All commercial documents and C of O verified by TJC Properties." },
    { title: "Flexible Layout",       body: "Open-plan design easily reconfigured to suit your business needs." },
    { title: "Strategic Location",    body: "Situated in a major commercial district with excellent visibility." },
  ],
};

/* ── Cloudinary upload ─────────────────────────────────── */
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

function normaliseImages(raw = []) {
  return raw.map(item => {
    if (typeof item === "string") return { src: item,     isNew: false };
    if (item?.url)                return { src: item.url, isNew: false };
    return null;
  }).filter(Boolean);
}

/* ── Form primitives ───────────────────────────────────── */
function Field({ label, required, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600">
          {label}{required && <span className="ml-1 text-primary-600">*</span>}
        </label>
        {hint && <span className="font-body text-[10px] text-neutral-400">{hint}</span>}
      </div>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="font-body text-[11px] text-danger-700">{error}</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const baseInput = "w-full bg-white font-[inherit] text-[14px] text-secondary-600 outline-none px-4 py-[0.7rem] border transition-colors duration-200";

function TInput({ value, onChange, placeholder, type = "text", error, disabled, ...rest }) {
  const [f, setF] = useState(false);
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      className={`${baseInput} ${error ? "border-danger-600" : f ? "border-primary-600" : "border-neutral-200"} ${disabled ? "opacity-60" : ""}`}
      {...rest} />
  );
}

function TTextarea({ value, onChange, placeholder, rows = 4, disabled }) {
  const [f, setF] = useState(false);
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      className={`${baseInput} resize-y ${f ? "border-primary-600" : "border-neutral-200"} ${disabled ? "opacity-60" : ""}`} />
  );
}

function TSelect({ value, onChange, options, placeholder, disabled, error }) {
  const [f, setF] = useState(false);
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      className={`${baseInput} cursor-pointer appearance-none pr-10 ${error ? "border-danger-600" : f ? "border-primary-600" : "border-neutral-200"} ${disabled ? "opacity-60" : ""}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239F4325' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
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

function Card({ title, hint, children, action }) {
  return (
    <div className="border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-heading font-bold text-[11px] tracking-[0.14em] uppercase text-primary-600">{title}</p>
        <div className="flex items-center gap-3">
          {hint && <span className="font-body text-[10px] text-neutral-400">{hint}</span>}
          {action}
        </div>
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
        <span>Uploading to Cloudinary…</span><span>{current}/{total}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden bg-neutral-200">
        <motion.div className="h-full bg-primary-600" initial={{ width: 0 }}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} />
      </div>
    </div>
  );
}

/* ── Why This Property block ───────────────────────────── */
function WhyBlock({ items, onChange, type, disabled }) {
  const suggestions = WHY_SUGGESTIONS[type] || WHY_SUGGESTIONS.residential;
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addItem   = (item) => { if (!items.find(i => i.title === item.title)) onChange([...items, { ...item }]); setShowSuggestions(false); };
  const addBlank  = () => onChange([...items, { title: "", body: "" }]);
  const updateItem = (idx, key, val) => onChange(items.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <motion.div key={idx} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="border border-neutral-200 bg-neutral-50 p-4 space-y-2 relative group">
          <button onClick={() => removeItem(idx)} disabled={disabled}
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer text-neutral-400 hover:text-danger-700">
            <X size={11} />
          </button>
          <input value={item.title} onChange={e => updateItem(idx, "title", e.target.value)}
            placeholder="Title (e.g. Prime Location)" disabled={disabled}
            className="w-full bg-white border border-neutral-200 focus:border-primary-600 outline-none px-3 py-2 font-heading font-bold text-[13px] text-secondary-600 transition-colors" />
          <textarea value={item.body} onChange={e => updateItem(idx, "body", e.target.value)}
            placeholder="Short description…" rows={2} disabled={disabled}
            className="w-full bg-white border border-neutral-200 focus:border-primary-600 outline-none px-3 py-2 font-body text-[13px] text-neutral-600 resize-none transition-colors" />
        </motion.div>
      ))}
      <div className="flex gap-2 flex-wrap">
        <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={addBlank} disabled={disabled}
          className="flex items-center gap-1.5 h-8 px-3 border border-neutral-200 bg-white font-heading font-bold text-[10px] uppercase cursor-pointer disabled:opacity-50 text-neutral-500 hover:border-primary-600 hover:text-primary-600 transition-colors">
          <Plus size={11} /> Add Custom
        </motion.button>
        <div className="relative">
          <motion.button type="button" whileTap={{ scale: 0.97 }}
            onClick={() => setShowSuggestions(v => !v)} disabled={disabled}
            className="flex items-center gap-1.5 h-8 px-3 border border-primary-200 bg-primary-50 font-heading font-bold text-[10px] uppercase cursor-pointer disabled:opacity-50 text-primary-600 hover:bg-primary-100 transition-colors">
            <Sparkles size={11} /> Suggestions <ChevronDown size={10} />
          </motion.button>
          <AnimatePresence>
            {showSuggestions && (
              <motion.div initial={{ opacity: 0, y: 4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }} transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-1 z-50 w-72 bg-white border border-neutral-200 shadow-[0_8px_32px_rgba(0,0,0,0.1)] max-h-60 overflow-y-auto">
                <div className="px-3 py-2 border-b border-neutral-100">
                  <p className="font-heading font-bold text-[9px] tracking-[0.14em] uppercase text-neutral-400">Click to add</p>
                </div>
                {suggestions.map((s, i) => {
                  const used = !!items.find(item => item.title === s.title);
                  return (
                    <button key={i} onClick={() => addItem(s)} disabled={used}
                      className="w-full text-left px-3 py-2.5 border-b border-neutral-50 last:border-0 bg-transparent border-none cursor-pointer hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <p className="font-heading font-bold text-[12px] text-secondary-600 flex items-center gap-1.5">
                        {used && <CheckCircle size={10} className="text-green-500" />}{s.title}
                      </p>
                      <p className="font-body text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{s.body}</p>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {items.length === 0 && (
        <p className="font-body text-[12px] text-neutral-400 italic">No highlights yet. Use "Add Custom" or pick from Suggestions.</p>
      )}
    </div>
  );
}

/* ── Features input with suggestions ──────────────────── */
function FeaturesInput({ features, onChange, type, disabled }) {
  const [input,   setInput]   = useState("");
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);

  const bank = type === "commercial" ? COMMERCIAL_FEATURES : RESIDENTIAL_FEATURES;
  const suggestions = bank.filter(f =>
    !features.includes(f) &&
    (input === "" || f.toLowerCase().includes(input.toLowerCase()))
  ).slice(0, 8);

  const add = (feat) => {
    const f = feat.trim();
    if (f && !features.includes(f)) onChange([...features, f]);
    setInput("");
  };

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const showDrop = focused && suggestions.length > 0;

  return (
    <div className="space-y-3" ref={wrapRef}>
      {features.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {features.map(f => (
            <div key={f} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 border border-neutral-200 bg-white font-heading font-semibold text-[11px] text-secondary-600">
              {f}
              <button onClick={() => onChange(features.filter(x => x !== f))} disabled={disabled}
                className="flex items-center justify-center w-4 h-4 bg-transparent border-none cursor-pointer text-neutral-400 hover:text-danger-700 transition-colors">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <TInput value={input} onChange={e => setInput(e.target.value)}
              placeholder="Type a feature or pick a suggestion…"
              onFocus={() => setFocused(true)}
              onKeyDown={e => {
                if (e.key === "Enter") { e.preventDefault(); if (input.trim()) add(input); }
                if (e.key === "Escape") setFocused(false);
              }}
              disabled={disabled} />
            <AnimatePresence>
              {showDrop && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-neutral-200 shadow-[0_8px_24px_rgba(0,0,0,0.1)] max-h-52 overflow-y-auto">
                  <div className="px-3 py-1.5 border-b border-neutral-50">
                    <p className="font-heading font-bold text-[9px] tracking-[0.12em] uppercase text-neutral-400">Suggestions — click to add</p>
                  </div>
                  {suggestions.map(s => (
                    <button key={s} onMouseDown={e => { e.preventDefault(); add(s); }}
                      className="w-full text-left px-3 py-2.5 font-heading font-semibold text-[12px] text-secondary-600 bg-transparent border-none cursor-pointer hover:bg-primary-50 hover:text-primary-600 transition-colors border-b border-neutral-50 last:border-0">
                      + {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => { if (input.trim()) add(input); }} disabled={disabled || !input.trim()}
            className="flex items-center gap-1 px-4 h-[46px] text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer disabled:opacity-50 bg-primary-600 hover:bg-primary-500 transition-colors">
            <Plus size={13} /> Add
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ── Agent picker ──────────────────────────────────────── */
function AgentPicker({ value, onChange, disabled }) {
  const [agents,  setAgents]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("displayName"));
    return onSnapshot(q, snap => {
      setAgents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const selected = agents.find(a => a.uid === value || a.id === value);

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="flex items-center gap-2 text-neutral-400 font-body text-[13px]">
          <Loader2 size={13} className="animate-spin" /> Loading agents…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" onClick={() => onChange(null)} disabled={disabled}
            className={`flex items-center gap-3 px-4 py-3 border cursor-pointer transition-colors text-left ${!value ? "border-primary-600 bg-primary-50" : "border-neutral-200 bg-white hover:border-neutral-400"}`}>
            <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 flex-shrink-0">
              <User size={14} className="text-neutral-400" />
            </div>
            <div>
              <p className="font-heading font-bold text-[12px] text-secondary-600">Unassigned</p>
              <p className="font-body text-[10px] text-neutral-400">No specific agent</p>
            </div>
            {!value && <CheckCircle size={13} className="text-primary-600 ml-auto" />}
          </button>
          {agents.map(agent => (
            <button key={agent.id} type="button"
              onClick={() => onChange(agent.uid || agent.id)} disabled={disabled}
              className={`flex items-center gap-3 px-4 py-3 border cursor-pointer transition-colors text-left ${(value === agent.uid || value === agent.id) ? "border-primary-600 bg-primary-50" : "border-neutral-200 bg-white hover:border-neutral-400"}`}>
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 text-white font-heading font-bold text-[11px] ${agent.isAdmin ? "bg-primary-600" : "bg-secondary-600"}`}>
                {(agent.displayName || agent.email || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-heading font-bold text-[12px] text-secondary-600 truncate">{agent.displayName || "—"}</p>
                  {agent.isAdmin && (
                    <span className="text-[8px] font-heading font-bold tracking-widest uppercase px-1.5 py-0.5 text-white bg-primary-600">Admin</span>
                  )}
                </div>
                <p className="font-body text-[10px] text-neutral-400 truncate">{agent.email}</p>
              </div>
              {(value === agent.uid || value === agent.id) && <CheckCircle size={13} className="text-primary-600 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-100">
          <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 text-white font-heading font-bold text-[10px] ${selected.isAdmin ? "bg-primary-600" : "bg-secondary-600"}`}>
            {(selected.displayName || selected.email || "?")[0].toUpperCase()}
          </div>
          <p className="font-body text-[12px] text-secondary-600">
            Assigned to <strong>{selected.displayName || selected.email}</strong>
          </p>
          <button onClick={() => onChange(null)} className="ml-auto bg-transparent border-none cursor-pointer text-neutral-400 hover:text-danger-700">
            <X size={11} />
          </button>
        </div>
      )}
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
  const [images,        setImages]        = useState([]);

  const [form, setForm] = useState({
    name: "", type: "residential", category: "", location: "",
    price: "", priceLabel: "", units: "1", status: "available",
    features: [], description: "",
    whyPoints: [],
    agentId:   null,
    featured:  false,   // ← NEW
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
      whyPoints:   editingListing.whyPoints   || [],
      agentId:     editingListing.agentId     || null,
      featured:    editingListing.featured    ?? false,
    });
    const raw = editingListing.images ?? (editingListing.image ? [editingListing.image] : []);
    setImages(normaliseImages(raw));
  }, [editingListing]);

  const up = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const handleFiles = (files) => {
    const entries = Array.from(files).filter(f => f.type.startsWith("image/"))
      .map(file => ({ src: URL.createObjectURL(file), isNew: true, file }));
    setImages(p => [...p, ...entries]);
  };

  const commitUrl = () => {
    const u = urlIn.trim();
    if (u) { setImages(p => [...p, { src: u, isNew: false }]); setUrlIn(""); }
  };

  const removeImg = (i) => {
    setImages(p => {
      const next = [...p];
      if (next[i]?.isNew) URL.revokeObjectURL(next[i].src);
      next.splice(i, 1);
      return next;
    });
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
      const toUpload   = images.filter(i => i.isNew && i.file);
      const alreadyUrl = images.filter(i => !i.isNew).map(i => i.src);
      setTotalToUpload(toUpload.length);
      setUploadedCount(0);
      const freshUrls = [];
      for (const entry of toUpload) {
        const url = await uploadToCloudinary(entry.file);
        freshUrls.push(url);
        setUploadedCount(c => c + 1);
      }
      const allImages = [...alreadyUrl, ...freshUrls];
      const payload = {
        ...form,
        units:  Number(form.units),
        images: allImages,
        image:  allImages[0] ?? "",
      };
      if (isEditing) await updateListing(editingListing.id, payload);
      else           await createListing(payload);
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen pb-20 bg-neutral-100">

        <div className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(14,26,43,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(14,26,43,0.025) 1px,transparent 1px)",
          backgroundSize: "60px 60px", zIndex: 0,
        }} />

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

            {/* Featured badge in header when toggled on */}
            {form.featured && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200">
                <Star size={11} className="text-amber-500 fill-amber-400" />
                <span className="font-heading font-bold text-[10px] uppercase tracking-widest text-amber-600">Featured</span>
              </motion.div>
            )}

            <motion.button
              whileHover={!saving && !saved ? { scale: 1.03, y: -1 } : {}} whileTap={{ scale: 0.97 }}
              onClick={handleSubmit} disabled={saving || saved}
              className={`flex items-center gap-1.5 h-9 px-5 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none cursor-pointer transition-colors disabled:opacity-70 ${saved ? "bg-green-600" : saving ? "bg-neutral-400" : "bg-primary-600 hover:bg-primary-500"}`}>
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
                className="px-4 py-3 border border-red-200 bg-red-50 font-body text-[13px] text-red-700">
                {errors._global}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ════ FEATURED TOGGLE — top of form, hard to miss ════ */}
          <motion.div
            whileTap={{ scale: 0.99 }}
            onClick={() => up("featured", !form.featured)}
            className={`flex items-center justify-between px-5 py-4 border-2 cursor-pointer transition-all duration-200 ${
              form.featured
                ? "border-amber-400 bg-amber-50"
                : "border-neutral-200 bg-white hover:border-amber-300"
            }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 flex items-center justify-center transition-colors ${form.featured ? "bg-amber-400" : "bg-neutral-100"}`}>
                <Star size={18} className={form.featured ? "text-white fill-white" : "text-neutral-400"} />
              </div>
              <div>
                <p className="font-heading font-bold text-[13px] text-secondary-600">
                  Feature this listing
                </p>
                <p className="font-body text-[12px] text-neutral-500 mt-0.5">
                  Featured properties appear in the homepage spotlight section with a dedicated CTA.
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <div className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${form.featured ? "bg-amber-400" : "bg-neutral-200"}`}>
              <motion.div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                animate={{ left: form.featured ? "calc(100% - 22px)" : "2px" }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            </div>
          </motion.div>

          {/* Property Details */}
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

          {/* Features */}
          <Card title="Features & Amenities" hint={`${form.features.length} added`}>
            <FeaturesInput features={form.features} onChange={v => up("features", v)} type={form.type} disabled={saving} />
          </Card>

          {/* Description */}
          <Card title="Description">
            <TTextarea value={form.description} onChange={e => up("description", e.target.value)}
              placeholder="Describe the property — location highlights, finishing, access roads…" rows={5} disabled={saving} />
          </Card>

          {/* Why This Property */}
          <Card title="Why This Property?" hint="Shown on the detail page"
            action={<span className="font-body text-[10px] text-neutral-400">{form.whyPoints.length} highlight{form.whyPoints.length !== 1 ? "s" : ""}</span>}>
            <p className="font-body text-[12px] text-neutral-500 -mt-2">
              Add 2–3 selling points that appear on the property detail page. Pick from suggestions or write your own.
            </p>
            <WhyBlock items={form.whyPoints} onChange={v => up("whyPoints", v)} type={form.type} disabled={saving} />
          </Card>

          {/* Assign Agent */}
          <Card title="Assign Agent" hint="Optional">
            <p className="font-body text-[12px] text-neutral-500 -mt-2">Select which team member is responsible for this listing.</p>
            <AgentPicker value={form.agentId} onChange={v => up("agentId", v)} disabled={saving} />
          </Card>

          {/* Images */}
          <Card title="Property Images" hint="First image = cover">
            <div className="relative border-2 border-dashed border-neutral-200 cursor-pointer transition-all hover:border-primary-600"
              style={{ background: "#faf9f7", minHeight: 90 }}
              onClick={() => !saving && document.getElementById("listing-img-upload").click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-primary-600"); }}
              onDragLeave={e => e.currentTarget.classList.remove("border-primary-600")}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("border-primary-600"); handleFiles(e.dataTransfer.files); }}>
              <input id="listing-img-upload" type="file" accept="image/*" multiple className="hidden"
                disabled={saving} onChange={e => handleFiles(e.target.files)} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
                <Upload size={22} className="text-neutral-300" />
                <p className="font-heading font-semibold text-[12px] text-neutral-500">Click or drag images here</p>
                <p className="font-body text-[10px] text-neutral-300">PNG · JPG · WEBP</p>
              </div>
            </div>

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

            <AnimatePresence>
              {images.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {images.map((img, i) => (
                    <motion.div key={img.src + i} layout
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group aspect-square overflow-hidden border border-neutral-200">
                      <img src={img.src} alt={`property-${i + 1}`} className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23F5F4F1'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='9' fill='%23aaa'%3EBroken%3C/text%3E%3C/svg%3E"; }} />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[8px] font-heading font-bold tracking-widest uppercase text-white px-1.5 py-0.5 bg-primary-600">Cover</span>
                      )}
                      {img.isNew && !saving && (
                        <span className="absolute top-1 left-1 text-[8px] font-heading font-bold uppercase text-white px-1 py-0.5 bg-secondary-600">NEW</span>
                      )}
                      {img.isNew && saving && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 size={18} className="animate-spin text-white" />
                        </div>
                      )}
                      <button onClick={() => removeImg(i)} disabled={saving}
                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer disabled:cursor-not-allowed bg-black/60 hover:bg-red-700">
                        <X size={10} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {images.length > 0 && (
              <p className="font-body text-[11px] text-neutral-400">
                {images.length} image{images.length !== 1 ? "s" : ""} · {images.filter(i => i.isNew).length} new · {images.filter(i => !i.isNew).length} saved
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
              className={`flex items-center gap-2 h-10 px-8 text-white font-heading font-bold text-xs tracking-[0.1em] uppercase border-none cursor-pointer transition-colors disabled:opacity-70 ${saved ? "bg-green-600" : saving ? "bg-neutral-400" : "bg-primary-600 hover:bg-primary-500"}`}>
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