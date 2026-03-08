// src/components/sections/Properties.jsx
// ── Drop-in replacement for your existing Properties.jsx ──
// Wired to Firebase via ListingsProvider + AuthProvider.
// - Public:  browse + filter + enquire (triggers AuthModal if not logged in)
// - Admin:   add, edit, delete listings + view enquiries panel
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Inbox, LogIn, LogOut, User } from "lucide-react";
import { FadeUp, SectionTag, BtnPrimary } from "../ui";
import { useAuth } from "../../auth/AuthProvider";
import { useListings } from "../../providers/ListingsProvider";
import AuthModal      from "../../auth/AuthModal";
import ListingForm    from "./ListingForm";
import EnquiryModal   from "./EnquiryModal";
import EnquiriesPanel from "./EnquiriesPanel";

const FILTERS = ["all", "residential", "commercial"];

/* ── Confirm delete dialog ── */
function DeleteConfirm({ listing, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[160] flex items-center justify-center px-4"
      style={{ background: "rgba(14,26,43,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        transition={{ duration: 0.28 }}
        className="w-full max-w-[380px] p-7"
        style={{ background: "#F5F4F1", border: "1px solid #E5E0D8" }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-10 flex items-center justify-center mb-4" style={{ background: "#FEF2F2" }}>
          <Trash2 size={18} color="#B91C1C" />
        </div>
        <h3 className="font-heading font-bold text-[16px]" style={{ color: "#0E1A2B" }}>Delete Listing?</h3>
        <p className="font-body text-[13px] mt-1.5 leading-relaxed" style={{ color: "#7A7A7A" }}>
          <strong style={{ color: "#0E1A2B" }}>{listing.name}</strong> will be permanently removed along with all uploaded images.
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} disabled={busy}
            className="flex-1 h-10 border font-heading font-bold text-[11px] uppercase cursor-pointer disabled:opacity-50"
            style={{ borderColor: "#E5E0D8", color: "#7A7A7A", background: "#FFFFFF" }}>
            Cancel
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={confirm} disabled={busy}
            className="flex-1 h-10 font-heading font-bold text-[11px] uppercase text-white border-none cursor-pointer disabled:opacity-60"
            style={{ background: busy ? "#9CA3AF" : "#B91C1C" }}>
            {busy ? "Deleting…" : "Yes, Delete"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Single listing card ── */
function ListingCard({ listing, isAdmin, onEnquire, onEdit, onDelete }) {
  const statusColor = listing.status === "available"   ? "#9F4325"
                    : listing.status === "let"         ? "#1D4ED8"
                    : listing.status === "sold"        ? "#6B7280"
                    :                                    "#6B7280";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -7, boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
      className="bg-white overflow-hidden shadow-card group relative"
      style={{ cursor: "default" }}
    >
      {/* Admin controls */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => onEdit(listing)}
            className="w-7 h-7 flex items-center justify-center text-white border-none cursor-pointer"
            style={{ background: "#0E1A2B" }}>
            <Pencil size={12} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => onDelete(listing)}
            className="w-7 h-7 flex items-center justify-center text-white border-none cursor-pointer"
            style={{ background: "#B91C1C" }}>
            <Trash2 size={12} />
          </motion.button>
        </div>
      )}

      {/* Image */}
      <div className="relative h-[200px] overflow-hidden">
        {listing.image ? (
          <motion.img src={listing.image} alt={listing.name}
            whileHover={{ scale: 1.06 }} transition={{ duration: 0.5 }}
            className="w-full h-full object-cover block" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "#FBEAE2" }}>
            <span className="font-heading font-bold text-[13px]" style={{ color: "#D97C5C" }}>No Image</span>
          </div>
        )}
        {/* Type badge */}
        <span className={`absolute top-3 left-3 text-white px-3 py-1 font-heading font-bold text-[10px] tracking-[0.1em] uppercase`}
          style={{ background: listing.type === "residential" ? "#9F4325" : "#0E1A2B" }}>
          {listing.type || "residential"}
        </span>
        {/* Status */}
        {listing.status && listing.status !== "available" && (
          <span className="absolute bottom-3 left-3 text-white px-2 py-0.5 font-heading font-bold text-[9px] tracking-widest uppercase"
            style={{ background: statusColor }}>
            {listing.status}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="font-heading font-bold text-[15px] text-secondary-600 mb-1">{listing.name}</div>
        <div className="font-body text-neutral-400 text-xs mb-1">📍 {listing.location}</div>
        {listing.priceLabel && (
          <div className="font-heading font-bold text-[14px] mb-3" style={{ color: "#9F4325" }}>
            {listing.priceLabel}
          </div>
        )}

        {/* Features */}
        {listing.features?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {listing.features.slice(0, 3).map((f, i) => (
              <span key={i} className="font-body text-neutral-500 bg-neutral-100 text-[11px] px-2.5 py-1">✓ {f}</span>
            ))}
            {listing.features.length > 3 && (
              <span className="font-body text-neutral-400 text-[11px] px-1.5 py-1">+{listing.features.length - 3} more</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-3.5 border-t border-neutral-200">
          <div className="font-body text-neutral-400 text-[12px]">
            <strong className="font-heading text-primary-600 text-[15px]">{listing.units}</strong>{" "}
            {listing.units === 1 ? "Unit" : "Units"} Available
          </div>
          <motion.button whileHover={{ x: 3 }}
            onClick={() => onEnquire(listing)}
            className="bg-transparent border-none cursor-pointer font-heading font-bold text-primary-600 hover:text-primary-700 text-[11px] tracking-[0.06em] uppercase">
            Enquire →
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════ */
export default function Properties() {
  const { user, isAdmin, logout } = useAuth();
  const { listings, loading, deleteListing, enquiries } = useListings();

  const [filter,      setFilter]      = useState("all");
  const [authModal,   setAuthModal]   = useState(null);   // null | "login" | "register"
  const [listingForm, setListingForm] = useState(null);   // null | "new" | listing obj
  const [enquiryFor,  setEnquiryFor]  = useState(null);   // listing obj
  const [deleteFor,   setDeleteFor]   = useState(null);   // listing obj
  const [showInbox,   setShowInbox]   = useState(false);

  const filtered = filter === "all" ? listings : listings.filter(l => l.type === filter);

  const newCount = enquiries.filter(e => e.status === "new").length;

  /* ── View state: show form? ── */
  if (listingForm !== null) {
    return (
      <AnimatePresence>
        <ListingForm
          editingListing={listingForm === "new" ? null : listingForm}
          onDone={() => setListingForm(null)}
          onCancel={() => setListingForm(null)}
        />
      </AnimatePresence>
    );
  }

  return (
    <>
      <section id="properties" className="py-24 px-[5%] bg-neutral-100">
        <div className="max-w-[1200px] mx-auto">

          {/* ── Header row ── */}
          <div className="flex justify-between items-end mb-10 flex-wrap gap-6">
            <FadeUp>
              <SectionTag>Listings</SectionTag>
              <h2 className="font-heading text-secondary-600 leading-[1.2] mt-0"
                style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 400 }}>
                Available <em className="not-italic text-primary-600">Properties</em>
              </h2>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Filter tabs */}
                <div className="flex gap-1.5 flex-wrap">
                  {FILTERS.map(f => (
                    <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)}
                      className={`px-5 py-2 font-heading font-semibold text-[11px] tracking-[0.06em] uppercase border transition-colors duration-250 cursor-pointer ${
                        filter === f
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-white text-neutral-400 border-neutral-200 hover:border-primary-600 hover:text-primary-600"}`}>
                      {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
                    </motion.button>
                  ))}
                </div>

                {/* Auth / Admin controls */}
                <div className="flex items-center gap-2 ml-2">
                  {isAdmin && (
                    <>
                      {/* Enquiries inbox */}
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setShowInbox(true)}
                        className="relative flex items-center gap-1.5 h-9 px-4 border font-heading font-bold text-[11px] uppercase cursor-pointer transition-colors duration-200"
                        style={{ borderColor: "#E5E0D8", color: "#0E1A2B", background: "#FFFFFF" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#9F4325"; e.currentTarget.style.color = "#9F4325"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E0D8"; e.currentTarget.style.color = "#0E1A2B"; }}>
                        <Inbox size={13} /> Enquiries
                        {newCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-white font-heading font-bold text-[9px]"
                            style={{ background: "#9F4325" }}>{newCount}</span>
                        )}
                      </motion.button>

                      {/* Add listing */}
                      <motion.button whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setListingForm("new")}
                        className="flex items-center gap-1.5 h-9 px-4 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors duration-200"
                        style={{ background: "#9F4325" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#D97C5C"}
                        onMouseLeave={e => e.currentTarget.style.background = "#9F4325"}>
                        <Plus size={13} /> Add Listing
                      </motion.button>
                    </>
                  )}

                  {/* User pill */}
                  {user ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1.5 h-9 px-3 border"
                        style={{ borderColor: "#E5E0D8", background: "#FFFFFF" }}>
                        <User size={12} style={{ color: "#9F4325" }} />
                        <span className="font-heading font-bold text-[11px] max-w-[80px] truncate hidden sm:inline"
                          style={{ color: "#0E1A2B" }}>
                          {user.displayName || user.email?.split("@")[0]}
                        </span>
                        {isAdmin && (
                          <span className="text-[8px] font-heading font-bold tracking-widest uppercase px-1.5 py-0.5 text-white"
                            style={{ background: "#9F4325" }}>Admin</span>
                        )}
                      </div>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={logout}
                        className="h-9 w-9 flex items-center justify-center border border-neutral-200 bg-white cursor-pointer"
                        title="Sign out">
                        <LogOut size={13} style={{ color: "#7A7A7A" }} />
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setAuthModal("login")}
                      className="flex items-center gap-1.5 h-9 px-4 border font-heading font-bold text-[11px] uppercase cursor-pointer transition-colors duration-200"
                      style={{ borderColor: "#E5E0D8", color: "#0E1A2B", background: "#FFFFFF" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#9F4325"; e.currentTarget.style.color = "#9F4325"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E5E0D8"; e.currentTarget.style.color = "#0E1A2B"; }}>
                      <LogIn size={13} /> Sign In
                    </motion.button>
                  )}
                </div>
              </div>
            </FadeUp>
          </div>

          {/* ── Loading state ── */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white overflow-hidden shadow-card animate-pulse">
                  <div className="h-[200px] bg-neutral-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-neutral-200 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-neutral-200 rounded w-16" />
                      <div className="h-5 bg-neutral-200 rounded w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center" style={{ background: "#FBEAE2" }}>
                <Plus size={24} style={{ color: "#9F4325" }} />
              </div>
              <p className="font-heading font-bold text-lg" style={{ color: "#0E1A2B" }}>No listings yet</p>
              <p className="font-body text-sm mt-1" style={{ color: "#7A7A7A" }}>
                {isAdmin ? "Click "Add Listing" above to create your first property." : "Check back soon."}
              </p>
            </div>
          )}

          {/* ── Grid ── */}
          {!loading && filtered.length > 0 && (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filtered.map(listing => (
                  <ListingCard key={listing.id}
                    listing={listing}
                    isAdmin={isAdmin}
                    onEnquire={l => setEnquiryFor(l)}
                    onEdit={l => setListingForm(l)}
                    onDelete={l => setDeleteFor(l)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── CTA ── */}
          <FadeUp delay={0.2}>
            <div className="text-center mt-12">
              <BtnPrimary onClick={() => user ? setEnquiryFor(listings[0]) : setAuthModal("login")}>
                Request Full Portfolio →
              </BtnPrimary>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══ Overlays ══ */}
      <AnimatePresence>
        {authModal && (
          <AuthModal defaultTab={authModal} onClose={() => setAuthModal(null)} />
        )}
        {enquiryFor && (
          <EnquiryModal
            listing={enquiryFor}
            onClose={() => setEnquiryFor(null)}
            onRequireAuth={() => setAuthModal("login")}
          />
        )}
        {deleteFor && (
          <DeleteConfirm
            listing={deleteFor}
            onConfirm={async () => { await deleteListing(deleteFor.id); setDeleteFor(null); }}
            onCancel={() => setDeleteFor(null)}
          />
        )}
        {showInbox && isAdmin && (
          <EnquiriesPanel onClose={() => setShowInbox(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
