// src/components/sections/Hero.jsx
// Featured card pulls from Firestore — shows listing with featured:true,
// falling back to the most recently added listing if none is marked featured.

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MapPin, Home } from "lucide-react";

import { useListings } from "../auth/ListingsProvider";

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

function BtnPrimary({ onClick, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="h-11 px-7 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none cursor-pointer transition-colors"
    >
      {children}
    </motion.button>
  );
}

function BtnOutline({ onClick, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="h-11 px-7 border border-white/30 hover:border-white/70 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase bg-transparent cursor-pointer transition-colors"
    >
      {children}
    </motion.button>
  );
}

/* ─── Animated counter (same as WhyUs) ─── */
function AnimatedNumber({ target, suffix }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null;
    const duration = 1600;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = setTimeout(() => requestAnimationFrame(step), 1000); // delay until hero loads
    return () => clearTimeout(id);
  }, [target]);
  return (
    <>
      {display.toLocaleString()}
      <span className="text-primary-500">{suffix}</span>
    </>
  );
}

function parseStat(numStr) {
  const s = String(numStr).trim();
  return {
    suffix: s.endsWith("+") ? "+" : s.endsWith("%") ? "%" : "",
    value: parseInt(s.replace(/[^0-9]/g, ""), 10) || 0,
  };
}

/* ─── Featured card skeleton ─── */
function CardSkeleton() {
  return (
    <div className="bg-white/[0.06] border border-white/10 backdrop-blur-md p-4 max-w-[340px] w-full animate-pulse">
      <div className="h-[220px] bg-white/10" />
      <div className="pt-4 px-1 space-y-2">
        <div className="h-2.5 bg-white/10 w-1/3 rounded" />
        <div className="h-4 bg-white/10 w-2/3 rounded" />
        <div className="h-2.5 bg-white/10 w-1/2 rounded" />
      </div>
    </div>
  );
}

/* ─── Featured listing card ─── */
function FeaturedCard({ listing }) {
  const cover =
    Array.isArray(listing.images) && listing.images.length
      ? listing.images[0]
      : typeof listing.image === "string"
        ? listing.image
        : null;

  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="bg-white/[0.06] border border-white/10 backdrop-blur-md p-4 max-w-[340px] w-full"
    >
      <div className="relative h-[220px] overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={listing.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center">
            <Home size={36} className="text-white/20" />
          </div>
        )}
        <span className="absolute top-3 left-3 bg-primary-600 text-white px-3 py-1 text-[10px] font-heading font-bold tracking-[0.1em] uppercase">
          Featured
        </span>
        {listing.status && listing.status !== "available" && (
          <span className="absolute top-3 right-3 bg-neutral-700/80 text-white px-2 py-0.5 font-heading font-bold text-[9px] tracking-widest uppercase">
            {listing.status}
          </span>
        )}
      </div>

      <div className="pt-3.5 px-1 pb-1">
        <div className="text-primary-500 text-[10px] font-heading font-bold tracking-[0.12em] uppercase">
          {listing.category || listing.type}
        </div>
        <div className="text-white font-heading font-bold text-[15px] my-1 line-clamp-1">
          {listing.name}
        </div>
        <div className="flex items-center gap-1 text-white/50 font-body text-xs">
          <MapPin size={10} className="text-primary-500 flex-shrink-0" />
          {listing.location}
        </div>

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
          {listing.priceLabel ? (
            <span className="text-white font-heading font-bold text-[13px]">
              {listing.priceLabel}
            </span>
          ) : (
            <span className="text-white/40 font-body text-[11px]">
              Price on request
            </span>
          )}
          {listing.units && (
            <span className="bg-white/10 text-white/60 font-body text-[10px] px-2.5 py-1">
              {listing.units} {listing.units === 1 ? "Unit" : "Units"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function Hero() {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 500], [0, 100]);

  const { listings, loading: listingsLoading } = useListings();
  const [featured, setFeatured] = useState(null);
  const [cardReady, setCardReady] = useState(false);

  // Pick featured listing: first one with featured:true, else newest
  useEffect(() => {
    if (listingsLoading || listings.length === 0) return;

    const marked = listings.find((l) => l.featured === true);
    if (marked) {
      setFeatured(marked);
      setCardReady(true);
      return;
    }

    // Fall back to most recently added (Firestore createdAt desc)
    // listings from onSnapshot may not be sorted by date, so sort here
    const sorted = [...listings].sort((a, b) => {
      const ta = a.createdAt?.seconds ?? 0;
      const tb = b.createdAt?.seconds ?? 0;
      return tb - ta;
    });
    setFeatured(sorted[0]);
    setCardReady(true);
  }, [listings, listingsLoading]);

  // Hero stats — driven by real listing counts
  const STATS = [
    { num: `${listings.length}+`, label: "Listings" },
    {
      num: `${listings.filter((l) => l.type === "residential").length}+`,
      label: "Residential",
    },
    {
      num: `${listings.filter((l) => !l.status || l.status === "available").length}+`,
      label: "Available",
    },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-secondary-600"
    >
      {/* Parallax BG */}
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=80"
          alt="TJC Properties hero"
          className="w-full object-cover"
          style={{ height: "110%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-600/90 via-secondary-600/65 to-secondary-600/40" />
      </motion.div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary-600 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-[90%] max-w-[1200px] mx-auto pt-28 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* LEFT */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-600/35 text-primary-500 px-4 py-1.5 text-[10px] font-heading font-bold tracking-[0.15em] uppercase mb-5"
          >
            ◆ Trusted Real Estate Partner
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.45,
              duration: 0.75,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="font-heading text-white leading-[1.1] mb-4"
            style={{ fontSize: "clamp(2.8rem, 5vw, 4.6rem)", fontWeight: 300 }}
          >
            Find Your <br />
            <em className="not-italic text-primary-500 font-semibold">
              Perfect Property
            </em>
            <br />
            <span className="font-bold">in Ibadan.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.7 }}
            className="text-white/60 font-body text-base leading-relaxed max-w-[440px] mb-8"
          >
            TJC Properties specialises in residential and commercial real estate
            — offering curated listings, professional lettings, and end-to-end
            project oversight across Ibadan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex gap-3 flex-wrap"
          >
            <BtnPrimary onClick={() => scrollTo("properties")}>
              View Properties →
            </BtnPrimary>
            <BtnOutline onClick={() => scrollTo("contact")}>
              Get In Touch
            </BtnOutline>
          </motion.div>

          {/* Live stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex gap-8 mt-10 pt-7 border-t border-white/10"
          >
            {STATS.map((s, i) => {
              const { value, suffix } = parseStat(s.num);
              return (
                <div key={i}>
                  <div
                    className="font-heading text-white leading-none"
                    style={{ fontSize: "2.2rem", fontWeight: 600 }}
                  >
                    <AnimatedNumber target={value} suffix={suffix} />
                  </div>
                  <div className="font-heading text-white/45 text-[10px] tracking-[0.1em] uppercase mt-1">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* RIGHT — Featured listing card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex justify-center"
        >
          {cardReady && featured ? (
            <FeaturedCard listing={featured} />
          ) : (
            <CardSkeleton />
          )}
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}
