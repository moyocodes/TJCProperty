// src/components/sections/Properties.jsx
// Home-page listing preview grid.

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Plus, Pencil, Trash2, ArrowRight, Star, MapPin, Tag } from "lucide-react";

import ListingForm   from "./ui/ListingForm";
import { useAuth }     from "../auth/AuthProvider";
import { useListings } from "../auth/ListingsProvider";

function getCover(listing) {
  if (Array.isArray(listing.images) && listing.images.length > 0) return listing.images[0];
  if (typeof listing.image === "string" && listing.image) return listing.image;
  return null;
}

function FadeUp({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function SectionTag({ children }) {
  return (
    <div className="inline-flex items-center gap-2 text-[11px] font-heading font-bold tracking-[0.18em] uppercase mb-3 text-primary-600">
      <span className="inline-block w-5 h-px bg-primary-600" />
      {children}
    </div>
  );
}

/* ─── Delete confirm ─── */
function DeleteConfirm({ listing, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[160] flex items-center justify-center px-4"
      style={{ background: "rgba(14,26,43,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.96, y: 14 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95 }} transition={{ duration: 0.28 }}
        className="w-full max-w-[360px] p-7 bg-neutral-100 border border-neutral-200"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-10 flex items-center justify-center mb-4 bg-red-50">
          <Trash2 size={18} className="text-red-600" />
        </div>
        <h3 className="font-heading font-bold text-[16px] text-secondary-600">Delete Listing?</h3>
        <p className="font-body text-[13px] mt-1.5 leading-relaxed text-neutral-500">
          <strong className="text-secondary-600">{listing.name}</strong> and all its images will be permanently removed.
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} disabled={busy}
            className="flex-1 h-10 border border-neutral-200 font-heading font-bold text-[11px] uppercase cursor-pointer disabled:opacity-50 bg-white text-neutral-500 hover:text-secondary-600 transition-colors">
            Cancel
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={async () => { setBusy(true); await onConfirm(); }}
            disabled={busy}
            className="flex-1 h-10 font-heading font-bold text-[11px] uppercase text-white border-none cursor-pointer disabled:opacity-60 bg-red-700">
            {busy ? "Deleting…" : "Yes, Delete"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/* ─── Featured: big hero card ─── */
function FeaturedHeroCard({ listing, onClick, isAdmin, onEdit, onDelete }) {
  const cover = getCover(listing);
  return (
    <motion.div
      whileHover={{ y: -5 }} transition={{ duration: 0.35 }}
      onClick={() => onClick(listing)}
      className="relative overflow-hidden cursor-pointer group col-span-1 lg:col-span-2"
      style={{ minHeight: 400 }}>
      {cover ? (
        <img src={cover} alt={listing.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          draggable={false} />
      ) : (
        <div className="absolute inset-0 bg-primary-50 flex items-center justify-center">
          <span className="font-heading font-bold text-[13px] text-primary-400">No Image</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-secondary-600/95 via-secondary-600/40 to-transparent" />
      {isAdmin && (
        <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); onEdit(listing); }}
            className="w-7 h-7 flex items-center justify-center text-white border-none cursor-pointer bg-secondary-600">
            <Pencil size={12} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); onDelete(listing); }}
            className="w-7 h-7 flex items-center justify-center text-white border-none cursor-pointer bg-red-700">
            <Trash2 size={12} />
          </motion.button>
        </div>
      )}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-400">
        <Star size={10} className="text-white fill-white" />
        <span className="font-heading font-bold text-[9px] tracking-[0.2em] uppercase text-white">Featured</span>
      </div>
      <div className="absolute top-4 right-4 px-3 py-1 font-heading font-bold text-[10px] tracking-[0.1em] uppercase text-white"
        style={{ background: listing.type === "residential" ? "#9F4325" : "#0E1A2B" }}>
        {listing.category || listing.type}
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 pt-12 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPin size={10} className="text-primary-400 flex-shrink-0" />
            <span className="font-body text-[12px] text-white/60">{listing.location}</span>
          </div>
          <h3 className="font-heading font-bold text-white leading-tight"
            style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.65rem)" }}>
            {listing.name}
          </h3>
          {listing.priceLabel && (
            <p className="font-heading font-bold text-primary-400 text-[15px] mt-1">{listing.priceLabel}</p>
          )}
        </div>
        <motion.div
          className="flex items-center gap-1.5 font-heading font-bold text-[11px] uppercase text-white/80 group-hover:text-primary-400 transition-colors flex-shrink-0"
          whileHover={{ x: 4 }}>
          View Property <ArrowRight size={12} />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Featured: compact side card ─── */
function FeaturedSideCard({ listing, onClick, isAdmin, onEdit, onDelete }) {
  const cover = getCover(listing);
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 14px 36px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.3 }}
      onClick={() => onClick(listing)}
      className="relative overflow-hidden cursor-pointer group flex bg-white border border-neutral-200">
      <div className="relative w-[100px] flex-shrink-0 overflow-hidden">
        {cover ? (
          <img src={cover} alt={listing.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            draggable={false} />
        ) : (
          <div className="absolute inset-0 bg-primary-50 flex items-center justify-center">
            <span className="font-heading font-bold text-[9px] text-primary-300">No Image</span>
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-amber-400">
          <Star size={7} className="text-white fill-white" />
        </div>
      </div>
      <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
        <div>
          <span className="font-heading font-bold text-[9px] tracking-[0.12em] uppercase text-primary-600">
            {listing.category || listing.type}
          </span>
          <h4 className="font-heading font-bold text-[13px] text-secondary-600 leading-snug mt-0.5 line-clamp-2">
            {listing.name}
          </h4>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={9} className="text-neutral-400 flex-shrink-0" />
            <span className="font-body text-[10px] text-neutral-400 truncate">{listing.location}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          {listing.priceLabel && (
            <span className="font-heading font-bold text-[12px] text-primary-600">{listing.priceLabel}</span>
          )}
          <span className="font-heading font-bold text-[9px] uppercase text-neutral-400 group-hover:text-primary-600 transition-colors ml-auto flex items-center gap-0.5">
            Details <ArrowRight size={9} />
          </span>
        </div>
      </div>
      {isAdmin && (
        <div className="absolute top-1.5 right-1.5 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); onEdit(listing); }}
            className="w-6 h-6 flex items-center justify-center text-white border-none cursor-pointer bg-secondary-600">
            <Pencil size={10} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); onDelete(listing); }}
            className="w-6 h-6 flex items-center justify-center text-white border-none cursor-pointer bg-red-700">
            <Trash2 size={10} />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Featured spotlight section ─── */
function FeaturedSpotlight({ featured, all, onView, navigate, isAdmin, onEdit, onDelete }) {
  if (featured.length === 0) return null;
  const [hero, ...rest] = featured;
  const side = rest.slice(0, 2);
  return (
    <FadeUp>
      <div className="mb-8">
     
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <FeaturedHeroCard listing={hero} onClick={onView} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} />
          <div className="flex flex-col gap-4">
            {side.map(l => (
              <FeaturedSideCard key={l.id} listing={l} onClick={onView} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} />
            ))}
            <motion.div
              whileHover={{ y: -3 }} onClick={() => navigate("/properties")}
              className="flex-1 flex flex-col items-center justify-center text-center px-6 py-7 bg-secondary-600 cursor-pointer group min-h-[120px]">
              <Tag size={16} className="text-white/40 mb-3" />
              <p className="font-heading font-bold text-white text-[14px] mb-1">
                {featured.length} Featured Listing{featured.length !== 1 ? "s" : ""}
              </p>
              <p className="font-body text-white/45 text-[11px] mb-3 leading-relaxed">
                Plus {all.length - featured.length} more in our portfolio
              </p>
              <span className="inline-flex items-center gap-1.5 font-heading font-bold text-[10px] uppercase text-primary-400 group-hover:text-primary-300 transition-colors">
                Browse All <ArrowRight size={11} />
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function Properties() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { listings, loading, deleteListing } = useListings();

  const [editFor,   setEditFor]   = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [deleteFor, setDeleteFor] = useState(null);

  const featured = listings.filter(l => l.featured === true);

  const openNew   = () => { setEditFor(null); setShowForm(true); };
  const openEdit  = (l) => { setEditFor(l);   setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditFor(null); };
  const viewListing = (l) => navigate(`/properties/${l.id}`);

  return (
    <>
      <section id="properties" className="py-20 px-[5%] bg-neutral-100">
        <div className="max-w-[1200px] mx-auto">

          {/* ── Section header ── */}
          <FadeUp>
            <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
              <div>
                <SectionTag>Our Portfolio</SectionTag>
                <h2 className="font-heading text-secondary-600 leading-[1.2]"
                  style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 400 }}>
                  Available <em className="not-italic text-primary-600">Properties</em>
                </h2>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {isAdmin && (
                  <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={openNew}
                    className="flex items-center gap-1.5 h-8 px-4 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[10px] uppercase tracking-[0.1em] border-none cursor-pointer transition-colors">
                    <Plus size={13} /> Add Listing
                  </motion.button>
                )}
                <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/properties")}
                  className="flex items-center gap-1.5 h-8 px-4 border border-neutral-300 bg-white text-secondary-600 hover:border-primary-600 hover:text-primary-600 font-heading font-bold text-[10px] uppercase tracking-[0.1em] cursor-pointer transition-colors">
                  Browse All <ArrowRight size={11} />
                </motion.button>
              </div>
            </div>
          </FadeUp>

          {/* ── Featured spotlight ── */}
          {!loading && featured.length > 0 && (
            <FeaturedSpotlight
              featured={featured}
              all={listings}
              onView={viewListing}
              navigate={navigate}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={(l) => setDeleteFor(l)}
            />
          )}

          {/* ── Loading skeletons ── */}
          {loading && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
              <div className="bg-neutral-200 animate-pulse" style={{ minHeight: 400 }} />
              <div className="flex flex-col gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-[120px] bg-neutral-200 animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {/* ── Empty state (admin only) ── */}
          {!loading && featured.length === 0 && isAdmin && (
            <div className="text-center py-16 bg-white border border-neutral-200">
              <p className="font-heading font-bold text-[13px] text-neutral-400 uppercase tracking-widest">
                No featured listings yet
              </p>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={openNew}
                className="mt-4 flex items-center gap-1.5 h-9 px-5 bg-primary-600 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer mx-auto">
                <Plus size={13} /> Add First Listing
              </motion.button>
            </div>
          )}

        </div>
      </section>

      {/* Listing form portal */}
      <AnimatePresence>
        {showForm && (
          <ListingFormPortal editingListing={editFor} onDone={closeForm} onCancel={closeForm} />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteFor && (
          <DeleteConfirm listing={deleteFor}
            onConfirm={async () => { await deleteListing(deleteFor.id); setDeleteFor(null); }}
            onCancel={() => setDeleteFor(null)} />
        )}

        
      </AnimatePresence>
    </>
  );
}

function ListingFormPortal({ editingListing, onDone, onCancel }) {
  return createPortal(
    <motion.div key="listing-form-portal"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] overflow-y-auto">
      <ListingForm editingListing={editingListing} onDone={onDone} onCancel={onCancel} />
    </motion.div>,
    document.body
  );
}

function AuthTrigger({ onDone }) {
  useState(() => {
    window.dispatchEvent(new CustomEvent("tjc:openAuth", { detail: "login" }));
    onDone();
  });
  return null;
}