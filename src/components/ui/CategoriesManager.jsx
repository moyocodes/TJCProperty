// src/components/listings/CategoriesManager.jsx
// Admin-only panel — add, rename, reorder and delete categories.
// Opens as a slide-over modal from the listing form's category field.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, Loader2, Tag } from "lucide-react";
import { useCategories } from "../../auth/CategoriesProvider";


const T = {
  primary:  "#9F4325",
  pHov:     "#D97C5C",
  pLt:      "#FBEAE2",
  navy:     "#0E1A2B",
  bg:       "#F5F4F1",
  white:    "#FFFFFF",
  border:   "#E5E0D8",
  muted:    "#7A7A7A",
  danger:   "#B91C1C",
};

// Single editable category row
function CategoryRow({ cat, onRename, onDelete, onReorder, isFirst, isLast }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(cat.name);
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState("");

  const save = async () => {
    if (name.trim() === cat.name) { setEditing(false); return; }
    setBusy(true);
    try {
      await onRename(cat.id, name);
      setEditing(false);
      setErr("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    setBusy(true);
    try { await onDelete(cat.id); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <motion.div layout className="flex items-center gap-2 group">
      {/* Reorder arrows */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button onClick={() => onReorder(cat.id, "up")} disabled={isFirst || busy}
          className="w-5 h-4 flex items-center justify-center bg-transparent border-none cursor-pointer disabled:opacity-20"
          style={{ color: T.muted }}>
          <ChevronUp size={12} />
        </button>
        <button onClick={() => onReorder(cat.id, "down")} disabled={isLast || busy}
          className="w-5 h-4 flex items-center justify-center bg-transparent border-none cursor-pointer disabled:opacity-20"
          style={{ color: T.muted }}>
          <ChevronDown size={12} />
        </button>
      </div>

      {/* Name — inline edit or label */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={e => { setName(e.target.value); setErr(""); }}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setName(cat.name); } }}
              className="flex-1 min-w-0 px-2 py-1 font-body text-[13px] outline-none border"
              style={{ borderColor: err ? T.danger : T.primary, color: T.navy, background: T.white }}
            />
            <button onClick={save} disabled={busy}
              className="w-7 h-7 flex items-center justify-center text-white border-none cursor-pointer disabled:opacity-50"
              style={{ background: T.primary }}>
              {busy ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            </button>
            <button onClick={() => { setEditing(false); setName(cat.name); }}
              className="w-7 h-7 flex items-center justify-center border cursor-pointer bg-white"
              style={{ borderColor: T.border, color: T.muted }}>
              <X size={11} />
            </button>
          </div>
        ) : (
          <span className="font-body text-[13px]" style={{ color: T.navy }}>{cat.name}</span>
        )}
        {err && <p className="font-body text-[10px] mt-0.5" style={{ color: T.danger }}>{err}</p>}
      </div>

      {/* Action buttons — visible on hover */}
      {!editing && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => setEditing(true)} disabled={busy}
            className="w-7 h-7 flex items-center justify-center border cursor-pointer disabled:opacity-40 transition-colors"
            style={{ borderColor: T.border, color: T.muted, background: T.white }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
            <Pencil size={11} />
          </button>
          <button onClick={remove} disabled={busy}
            className="w-7 h-7 flex items-center justify-center border cursor-pointer disabled:opacity-40 transition-colors"
            style={{ borderColor: T.border, color: T.muted, background: T.white }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.danger; e.currentTarget.style.color = T.danger; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Main export ──────────────────────────────────────────────
export default function CategoriesManager({ onClose }) {
  const { categories, loading, addCategory, renameCategory, deleteCategory, reorderCategory } = useCategories();
  const [newName, setNewName] = useState("");
  const [adding,  setAdding]  = useState(false);
  const [err,     setErr]     = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setErr("");
    try {
      await addCategory(newName);
      setNewName("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: "rgba(14,26,43,0.65)", backdropFilter: "blur(5px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] max-h-[85vh] flex flex-col"
        style={{ background: T.bg }}
        onClick={e => e.stopPropagation()}>

        <div className="h-[3px]" style={{ background: T.primary }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: T.border }}>
          <div className="flex items-center gap-2">
            <Tag size={15} style={{ color: T.primary }} />
            <h2 className="font-heading font-bold text-[15px]" style={{ color: T.navy }}>Manage Categories</h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer"
            style={{ color: T.muted }}>
            <X size={16} />
          </button>
        </div>

        {/* Add form */}
        <form onSubmit={handleAdd} className="px-5 py-4 border-b" style={{ borderColor: T.border }}>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => { setNewName(e.target.value); setErr(""); }}
              placeholder="New category name…"
              className="flex-1 min-w-0 px-3 py-2 font-body text-[13px] outline-none border"
              style={{ borderColor: err ? T.danger : T.border, color: T.navy, background: T.white }}
              onFocus={e => { if (!err) e.target.style.borderColor = T.primary; }}
              onBlur={e => { if (!err) e.target.style.borderColor = T.border; }}
            />
            <motion.button type="submit" disabled={adding || !newName.trim()}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1 px-4 h-[38px] text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer disabled:opacity-50"
              style={{ background: T.primary }}>
              {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Add
            </motion.button>
          </div>
          {err && <p className="font-body text-[11px] mt-1.5" style={{ color: T.danger }}>{err}</p>}
        </form>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="font-body text-[13px] text-center py-8" style={{ color: T.muted }}>Loading…</p>
          ) : categories.length === 0 ? (
            <p className="font-body text-[13px] text-center py-8" style={{ color: T.muted }}>No categories yet — add one above.</p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {categories.map((cat, i) => (
                  <CategoryRow
                    key={cat.id}
                    cat={cat}
                    isFirst={i === 0}
                    isLast={i === categories.length - 1}
                    onRename={renameCategory}
                    onDelete={deleteCategory}
                    onReorder={reorderCategory}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t" style={{ borderColor: T.border }}>
          <p className="font-body text-[11px]" style={{ color: T.muted }}>
            {categories.length} {categories.length === 1 ? "category" : "categories"} · Changes save instantly
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
