// src/components/sections/Properties.jsx
// Home-page listing preview grid. Detail view navigates to /properties/:id.
// ListingForm + EnquiryModal + DeleteConfirm still use portals (admin overlays).

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Plus, Pencil, Trash2, ExternalLink, ArrowRight } from "lucide-react";

import EnquiryModal from "./ui/EnquiryModal";
import ListingForm from "./ui/ListingForm";
import { useAuth } from "../auth/AuthProvider";
import { useListings } from "../auth/ListingsProvider";

const FILTERS = ["all", "residential", "commercial"];

function getCover(listing) {
  if (Array.isArray(listing.images) && listing.images.length > 0) return listing.images[0];
  if (typeof listing.image === "string" && listing.image) return listing.image;
  return null;
}

/* ─── Animation helpers ─── */
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
        <div className="w-10 h-10 flex items-center justify-center mb-4 bg-danger-50">
          <Trash2 size={18} className="text-danger-700" />
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
            className="flex-1 h-10 font-heading font-bold text-[11px] uppercase text-white border-none cursor-pointer disabled:opacity-60 bg-danger-700">
            {busy ? "Deleting…" : "Yes, Delete"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/* ─── Listing card ─── */
function ListingCard({ listing, isAdmin, onView, onEnquire, onEdit, onDelete }) {
  const cover = getCover(listing);
  const photoCount = Array.isArray(listing.images) ? listing.images.length : (cover ? 1 : 0);

  return (
    <motion.div layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -7, boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
      className="bg-white overflow-hidden shadow-card group relative">

      {isAdmin && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); onEdit(listing); }}
            className="w-7 h-7 flex items-center justify-center text-white border-none cursor-pointer bg-secondary-600" title="Edit">
            <Pencil size={12} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); onDelete(listing); }}
            className="w-7 h-7 flex items-center justify-center text-white border-none cursor-pointer bg-danger-700" title="Delete">
            <Trash2 size={12} />
          </motion.button>
        </div>
      )}

      <div className="relative h-[200px] overflow-hidden cursor-pointer" onClick={() => onView(listing)}>
        {cover ? (
          <motion.img src={cover} alt={listing.name}
            whileHover={{ scale: 1.06 }} transition={{ duration: 0.5 }}
            className="w-full h-full object-cover block"
            onError={e => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-50">
            <span className="font-heading font-bold text-[12px] text-primary-500">No Image</span>
          </div>
        )}

        <span className="absolute top-3 left-3 text-white px-3 py-1 font-heading font-bold text-[10px] tracking-[0.1em] uppercase"
          style={{ background: listing.type === "residential" ? "#9F4325" : "#0E1A2B" }}>
          {listing.category || listing.type}
        </span>

        {photoCount > 1 && (
          <span className="absolute top-3 right-3 bg-black/50 text-white font-heading font-bold text-[9px] px-2 py-0.5 tracking-wide">
            +{photoCount - 1} photos
          </span>
        )}

        {listing.status && listing.status !== "available" && (
          <span className="absolute bottom-3 right-3 text-white px-2 py-0.5 font-heading font-bold text-[9px] tracking-widest uppercase bg-neutral-500">
            {listing.status}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="font-heading font-bold text-[15px] mb-0.5 text-secondary-600">{listing.name}</div>
        <div className="font-body text-xs mb-1 text-neutral-500">📍 {listing.location}</div>
        {listing.priceLabel && (
          <div className="font-heading font-bold text-[14px] mb-3 text-primary-600">{listing.priceLabel}</div>
        )}

        {listing.features?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {listing.features.slice(0, 3).map((f, i) => (
              <span key={i} className="font-body text-neutral-500 bg-neutral-100 text-[11px] px-2.5 py-1">✓ {f}</span>
            ))}
            {listing.features.length > 3 && (
              <span className="font-body text-neutral-400 text-[11px] px-1 py-1">+{listing.features.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex justify-between items-center pt-3.5 border-t border-neutral-200 gap-2 flex-wrap">
          <div className="font-body text-[12px] text-neutral-500">
            <strong className="font-heading text-[15px] text-primary-600">{listing.units}</strong>{" "}
            {listing.units === 1 ? "Unit" : "Units"}
          </div>
          <div className="flex gap-3">
            <motion.button whileHover={{ x: -2 }} onClick={() => onView(listing)}
              className="bg-transparent border-none cursor-pointer font-heading font-bold text-[11px] tracking-[0.06em] uppercase flex items-center gap-1 text-secondary-600 hover:text-primary-600 transition-colors">
              <ExternalLink size={11} /> Details
            </motion.button>
            <motion.button whileHover={{ x: 3 }} onClick={() => onEnquire(listing)}
              className="bg-transparent border-none cursor-pointer font-heading font-bold text-[11px] tracking-[0.06em] uppercase text-primary-600 hover:text-primary-500 transition-colors">
              Enquire →
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function Properties() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = true; // replace with real check
  const { listings, loading, deleteListing } = useListings();

  const [filter,     setFilter]     = useState("all");
  const [editFor,    setEditFor]    = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [enquiryFor, setEnquiryFor] = useState(null);
  const [deleteFor,  setDeleteFor]  = useState(null);
  const [authNeeded, setAuthNeeded] = useState(false);

  const filtered = filter === "all" ? listings : listings.filter(l => l.type === filter);

  // Show only 6 on the home-page preview; full list is at /properties
  const preview = filtered.slice(0, 6);

  const openNew   = () => { setEditFor(null); setShowForm(true); };
  const openEdit  = (l) => { setEditFor(l); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditFor(null); };

  // Navigate to the dedicated detail page
  const viewListing = (listing) => navigate(`/properties/${listing.id}`);

  const handleEnquire = (l) => user ? setEnquiryFor(l) : setAuthNeeded(true);

  return (
    <>
      <section id="properties" className="py-24 px-[5%] bg-neutral-100">
        <div className="max-w-[1200px] mx-auto">

          {/* Section header */}
          <div className="flex justify-between items-end mb-10 flex-wrap gap-6">
            <FadeUp>
              <SectionTag>Listings</SectionTag>
              <h2 className="font-heading text-secondary-600 leading-[1.2] mt-0"
                style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 400 }}>
                Available <em className="not-italic text-primary-600">Properties</em>
              </h2>
            </FadeUp>

            <FadeUp delay={0.1}>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1.5">
                  {FILTERS.map(f => (
                    <motion.button key={f} whileTap={{ scale: 0.95 }}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 font-heading font-semibold text-[11px] tracking-[0.06em] uppercase border transition-colors cursor-pointer ${
                        filter === f
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-white text-neutral-400 border-neutral-200 hover:border-primary-600 hover:text-primary-600"
                      }`}>
                      {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
                    </motion.button>
                  ))}
                </div>

                {isAdmin && (
                  <motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.95 }}
                    onClick={openNew}
                    className="flex items-center gap-1.5 h-9 px-4 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer bg-primary-600 hover:bg-primary-500 transition-colors">
                    <Plus size={13} /> Add Listing
                  </motion.button>
                )}
              </div>
            </FadeUp>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white overflow-hidden shadow-card animate-pulse">
                  <div className="h-[200px] bg-neutral-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-neutral-200 w-3/4" />
                    <div className="h-3 bg-neutral-200 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="font-heading font-bold text-lg text-secondary-600">No listings yet</p>
              <p className="font-body text-sm mt-1 text-neutral-500">
                {isAdmin ? "Click Add Listing to get started." : "Check back soon."}
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && preview.length > 0 && (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {preview.map(listing => (
                  <ListingCard key={listing.id} listing={listing} isAdmin={isAdmin}
                    onView={viewListing}
                    onEnquire={handleEnquire}
                    onEdit={openEdit}
                    onDelete={l => setDeleteFor(l)} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* CTA row */}
          <FadeUp delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-12">
              {/* View all listings page */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/properties")}
                className="inline-flex items-center gap-2 bg-secondary-600 hover:bg-secondary-500 text-white font-heading font-bold text-xs tracking-[0.08em] uppercase px-8 py-3.5 border-none cursor-pointer transition-colors duration-300">
                <ArrowRight size={13} /> Browse All Properties
              </motion.button>

              {/* Email portfolio */}
              <motion.a
                href="mailto:info@tjcproperties.com?subject=Full Portfolio Request"
                whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-xs tracking-[0.08em] uppercase px-8 py-3.5 border-none cursor-pointer transition-colors duration-300 no-underline">
                Request Full Portfolio →
              </motion.a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Listing form portal (admin) */}
      <AnimatePresence>
        {showForm && (
          <ListingFormPortal editingListing={editFor} onDone={closeForm} onCancel={closeForm} />
        )}
      </AnimatePresence>

      {/* Enquiry modal */}
      <AnimatePresence>
        {enquiryFor && (
          <EnquiryModal listing={enquiryFor} onClose={() => setEnquiryFor(null)}
            onRequireAuth={() => { setEnquiryFor(null); setAuthNeeded(true); }} />
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

      {authNeeded && <AuthTrigger onDone={() => setAuthNeeded(false)} />}
    </>
  );
}

/* ─── ListingForm portal (full-screen overlay) ─── */
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

/* ─── AuthTrigger ─── */
function AuthTrigger({ onDone }) {
  useState(() => {
    window.dispatchEvent(new CustomEvent("tjc:openAuth", { detail: "login" }));
    onDone();
  });
  return null;
}