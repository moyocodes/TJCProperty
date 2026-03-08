// src/components/listings/EnquiriesPanel.jsx
// Admin-only panel to view and manage all enquiries
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Inbox, Check, Archive, Trash2, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useListings } from "../../auth/ListingsProvider";


const T = {
  primary:  "#9F4325",
  primaryLt:"#FBEAE2",
  navy:     "#0E1A2B",
  bg:       "#F5F4F1",
  border:   "#E5E0D8",
  muted:    "#7A7A7A",
  white:    "#FFFFFF",
  danger:   "#B91C1C",
  success:  "#16A34A",
};

const STATUS_COLOR = {
  new:    { bg: "#FEF3C7", text: "#92400E" },
  read:   { bg: "#DBEAFE", text: "#1E40AF" },
  closed: { bg: "#D1FAE5", text: T.success },
};

function EnquiryRow({ eq }) {
  const [open, setOpen] = useState(false);
  const { updateEnquiryStatus, deleteEnquiry } = useListings();
  const [deleting, setDeleting] = useState(false);

  const col = STATUS_COLOR[eq.status] || STATUS_COLOR.new;
  const ts = eq.createdAt?.toDate?.()?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) || "—";

  const handleDelete = async () => {
    if (!confirm(`Delete enquiry from ${eq.userName}?`)) return;
    setDeleting(true);
    try { await deleteEnquiry(eq.id); } catch (e) { console.error(e); setDeleting(false); }
  };

  return (
    <motion.div layout className="border" style={{ borderColor: T.border, background: T.white }}>
      {/* Row header */}
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setOpen(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-bold text-[13px]" style={{ color: T.navy }}>{eq.userName}</span>
            <span className="font-body text-[11px]" style={{ color: T.muted }}>{eq.userEmail}</span>
            <span className="px-2 py-0.5 font-heading font-bold text-[9px] tracking-widest uppercase"
              style={{ background: col.bg, color: col.text }}>{eq.status}</span>
          </div>
          <p className="font-heading font-semibold text-[12px] mt-0.5" style={{ color: T.primary }}>
            Re: {eq.listingName}
          </p>
          <p className="font-body text-[11px] mt-0.5 truncate" style={{ color: T.muted }}>{eq.message}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-body text-[10px] hidden sm:inline" style={{ color: T.muted }}>{ts}</span>
          {open ? <ChevronUp size={14} style={{ color: T.muted }} /> : <ChevronDown size={14} style={{ color: T.muted }} />}
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 border-t" style={{ borderColor: T.border }}>
              <p className="font-body text-[13px] leading-relaxed mt-3" style={{ color: T.navy }}>{eq.message}</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="font-heading font-bold text-[11px]" style={{ color: T.muted }}>Contact:</span>
                <span className="font-body text-[13px]" style={{ color: T.navy }}>{eq.contact}</span>
              </div>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {eq.status !== "read" && (
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => updateEnquiryStatus(eq.id, "read")}
                    className="flex items-center gap-1.5 h-8 px-3 border font-heading font-bold text-[10px] uppercase cursor-pointer transition-colors"
                    style={{ borderColor: "#BFDBFE", color: "#1E40AF", background: "#DBEAFE" }}>
                    <Check size={12} /> Mark Read
                  </motion.button>
                )}
                {eq.status !== "closed" && (
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    onClick={() => updateEnquiryStatus(eq.id, "closed")}
                    className="flex items-center gap-1.5 h-8 px-3 border font-heading font-bold text-[10px] uppercase cursor-pointer transition-colors"
                    style={{ borderColor: "#A7F3D0", color: T.success, background: "#D1FAE5" }}>
                    <Archive size={12} /> Close
                  </motion.button>
                )}
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={handleDelete} disabled={deleting}
                  className="flex items-center gap-1.5 h-8 px-3 border font-heading font-bold text-[10px] uppercase cursor-pointer disabled:opacity-50 ml-auto"
                  style={{ borderColor: "#FECACA", color: T.danger, background: "#FEF2F2" }}>
                  <Trash2 size={12} /> Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function EnquiriesPanel({ onClose }) {
  const { enquiries } = useListings();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("all");

  const filtered = enquiries.filter(e => {
    const matchFilter = filter === "all" || e.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || e.userName?.toLowerCase().includes(q) ||
      e.userEmail?.toLowerCase().includes(q) || e.listingName?.toLowerCase().includes(q) ||
      e.message?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    all:    enquiries.length,
    new:    enquiries.filter(e => e.status === "new").length,
    read:   enquiries.filter(e => e.status === "read").length,
    closed: enquiries.filter(e => e.status === "closed").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(14,26,43,0.7)", backdropFilter: "blur(6px)" }}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[700px] max-h-[90vh] flex flex-col"
        style={{ background: T.bg }}>

        <div className="h-[3px]" style={{ background: T.primary }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: T.border }}>
          <div className="flex items-center gap-3">
            <Inbox size={18} style={{ color: T.primary }} />
            <div>
              <h2 className="font-heading font-bold text-[16px]" style={{ color: T.navy }}>Enquiries</h2>
              <p className="font-body text-[11px]" style={{ color: T.muted }}>{enquiries.length} total</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
            style={{ color: T.muted }}>
            <X size={18} />
          </motion.button>
        </div>

        {/* Filters + Search */}
        <div className="px-6 py-3 border-b space-y-3" style={{ borderColor: T.border }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search enquiries…"
              style={{
                width: "100%", background: T.white, fontFamily: "inherit", fontSize: 13,
                outline: "none", padding: "0.55rem 1rem 0.55rem 2.2rem", color: T.navy,
                border: `1px solid ${T.border}`, transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = T.primary}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["all","new","read","closed"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1 font-heading font-bold text-[10px] tracking-[0.08em] uppercase border cursor-pointer transition-colors duration-200"
                style={{
                  background: filter === f ? T.primary : T.white,
                  color: filter === f ? T.white : T.muted,
                  borderColor: filter === f ? T.primary : T.border,
                }}>
                {f} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox size={30} style={{ color: T.border, margin: "0 auto 10px" }} />
              <p className="font-heading font-semibold text-[13px]" style={{ color: T.muted }}>No enquiries found</p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map(eq => <EnquiryRow key={eq.id} eq={eq} />)}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
