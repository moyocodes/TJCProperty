// src/components/sections/FeaturedProperties.jsx
// Showcases listings where featured === true.
// Layout: large hero card (first) + up to 2 smaller side cards.
// Falls back gracefully when nothing is featured.

import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Star, ArrowRight, MapPin, Tag } from "lucide-react";
import { useListings } from "../auth/ListingsProvider";

function getCover(listing) {
  if (Array.isArray(listing.images) && listing.images.length > 0)
    return listing.images[0];
  if (typeof listing.image === "string" && listing.image) return listing.image;
  return null;
}

function FadeUp({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Big hero card (left / top) ─────────────────────────── */
function HeroCard({ listing, onClick }) {
  const cover = getCover(listing);
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35 }}
      onClick={() => onClick(listing)}
      className="relative overflow-hidden cursor-pointer group"
      style={{ minHeight: 440 }}
    >
      {/* Image */}
      {cover ? (
        <motion.img
          src={cover}
          alt={listing.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-primary-50 flex items-center justify-center">
          <span className="font-heading font-bold text-[13px] text-primary-400">
            No Image
          </span>
        </div>
      )}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-secondary-600/95 via-secondary-600/40 to-transparent" />

      {/* Featured badge */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-amber-400">
        <Star size={10} className="text-white fill-white" />
        <span className="font-heading font-bold text-[9px] tracking-[0.2em] uppercase text-white">
          Featured
        </span>
      </div>

      {/* Type pill */}
      <div
        className="absolute top-4 right-4 px-3 py-1 font-heading font-bold text-[10px] tracking-[0.1em] uppercase text-white"
        style={{
          background: listing.type === "residential" ? "#9F4325" : "#0E1A2B",
        }}
      >
        {listing.category || listing.type}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 pt-12">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={11} className="text-primary-400 flex-shrink-0" />
          <span className="font-body text-[12px] text-white/60 truncate">
            {listing.location}
          </span>
        </div>
        <h3
          className="font-heading font-bold text-white leading-tight mb-2"
          style={{ fontSize: "clamp(1.25rem, 2.2vw, 1.7rem)" }}
        >
          {listing.name}
        </h3>
        {listing.priceLabel && (
          <p className="font-heading font-bold text-primary-400 text-[16px] mb-4">
            {listing.priceLabel}
          </p>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          {listing.features?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {listing.features.slice(0, 3).map((f, i) => (
                <span
                  key={i}
                  className="font-body text-[10px] text-white/50 bg-white/10 px-2 py-0.5"
                >
                  ✓ {f}
                </span>
              ))}
            </div>
          )}
          <motion.div
            className="flex items-center gap-1.5 font-heading font-bold text-[11px] uppercase text-white/80 group-hover:text-primary-400 transition-colors"
            animate={{ x: 0 }}
            whileHover={{ x: 4 }}
          >
            View Property <ArrowRight size={12} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Compact side card ───────────────────────────────────── */
function SideCard({ listing, onClick, delay = 0 }) {
  const cover = getCover(listing);
  return (
    <FadeUp delay={delay}>
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.1)" }}
        transition={{ duration: 0.3 }}
        onClick={() => onClick(listing)}
        className="relative overflow-hidden cursor-pointer group flex bg-white border border-neutral-200"
        style={{ minHeight: 140 }}
      >
        {/* Thumbnail */}
        <div className="relative w-[120px] flex-shrink-0 overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={listing.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 bg-primary-50 flex items-center justify-center">
              <span className="font-heading font-bold text-[9px] text-primary-300">
                No Image
              </span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-400">
              <Star size={7} className="text-white fill-white" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
          <div>
            <span className="font-heading font-bold text-[9px] tracking-[0.14em] uppercase text-primary-600">
              {listing.category || listing.type}
            </span>
            <h4 className="font-heading font-bold text-[14px] text-secondary-600 leading-snug mt-0.5 line-clamp-2">
              {listing.name}
            </h4>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={9} className="text-neutral-400 flex-shrink-0" />
              <span className="font-body text-[11px] text-neutral-400 truncate">
                {listing.location}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            {listing.priceLabel ? (
              <span className="font-heading font-bold text-[13px] text-primary-600">
                {listing.priceLabel}
              </span>
            ) : (
              <span />
            )}
            <span className="font-heading font-bold text-[10px] uppercase text-neutral-400 group-hover:text-primary-600 transition-colors flex items-center gap-1">
              Details <ArrowRight size={9} />
            </span>
          </div>
        </div>
      </motion.div>
    </FadeUp>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════ */
export default function FeaturedProperties() {
  const navigate = useNavigate();
  const { listings, loading } = useListings();

  const featured = listings.filter((l) => l.featured === true);

  // Nothing featured — render nothing (no awkward empty state in the flow)
  if (!loading && featured.length === 0) return null;

  const [hero, ...rest] = featured;
  const side = rest.slice(0, 2);

  const goTo = (l) => navigate(`/properties/${l.id}`);

  return (
    <section className="py-20 px-[5%] bg-neutral-100 border-b border-neutral-200">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <FadeUp>
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] font-heading font-bold tracking-[0.18em] uppercase mb-3 text-amber-500">
                <Star size={11} className="fill-amber-400" />
                Featured Listings
              </div>
              <h2
                className="font-heading text-secondary-600 leading-[1.2] mt-0"
                style={{
                  fontSize: "clamp(1.6rem, 2.6vw, 2.4rem)",
                  fontWeight: 400,
                }}
              >
                Handpicked{" "}
                <em className="not-italic text-primary-600">Properties</em>
              </h2>
            </div>

            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/properties")}
              className="flex items-center gap-2 h-10 px-6 border border-secondary-600 text-secondary-600 hover:bg-secondary-600 hover:text-white font-heading font-bold text-[11px] uppercase tracking-[0.08em] bg-transparent cursor-pointer transition-colors duration-200"
            >
              Browse All <ArrowRight size={12} />
            </motion.button>
          </div>
        </FadeUp>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
            <div
              className="animate-pulse bg-neutral-200"
              style={{ minHeight: 440 }}
            />
            <div className="flex flex-col gap-4">
              <div className="animate-pulse bg-neutral-200 h-[140px]" />
              <div className="animate-pulse bg-neutral-200 h-[140px]" />
            </div>
          </div>
        )}

        {/* Content grid */}
        {!loading && hero && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
            {/* Hero */}
            <FadeUp>
              <HeroCard listing={hero} onClick={goTo} />
            </FadeUp>

            {/* Side cards + CTA */}
            <div className="flex flex-col gap-4">
              {side.map((l, i) => (
                <SideCard
                  key={l.id}
                  listing={l}
                  onClick={goTo}
                  delay={0.1 + i * 0.07}
                />
              ))}

              {/* CTA card — fills remaining space */}
              <FadeUp delay={0.25}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-7 py-8 bg-secondary-600 cursor-pointer group min-h-[140px]"
                  onClick={() => navigate("/properties")}
                  style={{ flex: side.length < 2 ? 1 : undefined }}
                >
                  <div className="w-10 h-10 flex items-center justify-center border border-white/20 mb-4">
                    <Tag size={16} className="text-white/70" />
                  </div>
                  <p className="font-heading font-bold text-white text-[15px] leading-snug mb-1">
                    {featured.length} Featured{featured.length !== 1 ? "" : ""}{" "}
                    Listing{featured.length !== 1 ? "s" : ""}
                  </p>
                  <p className="font-body text-white/50 text-[12px] mb-4 leading-relaxed">
                    Explore our complete portfolio of {listings.length}{" "}
                    properties.
                  </p>
                  <span className="inline-flex items-center gap-1.5 font-heading font-bold text-[11px] uppercase text-primary-400 group-hover:text-primary-300 transition-colors">
                    View All Properties <ArrowRight size={12} />
                  </span>
                </motion.div>
              </FadeUp>
            </div>
          </div>
        )}

        {/* If only 1 featured, no side cards — show a wider CTA strip below */}
        {!loading && hero && side.length === 0 && (
          <FadeUp delay={0.2}>
            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => navigate("/properties")}
              className="mt-4 flex items-center justify-between px-8 py-5 bg-secondary-600 cursor-pointer group"
              style={{ display: "none" }} // hidden because CTA is already in the side column above
            />
          </FadeUp>
        )}
      </div>
    </section>
  );
}
