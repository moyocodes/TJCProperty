// src/pages/ListingsPage.jsx
// Full listings page with price filter derived from real DB values.

import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Search, X, ChevronDown,
  ExternalLink, MapPin, Home, Building2,
  LayoutGrid, List, MessageCircle, PhoneCall,
  Filter, ArrowRight,
} from "lucide-react";
import { useListings } from "../auth/ListingsProvider";
import { useAuth } from "../auth/AuthProvider";

/* ─── Helpers ─── */
function parsePrice(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  return parseInt(String(val).replace(/[^0-9]/g, ""), 10) || 0;
}
function formatPriceShort(n) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}
function getCover(listing) {
  if (Array.isArray(listing.images) && listing.images.length > 0) return listing.images[0];
  if (typeof listing.image === "string" && listing.image) return listing.image;
  return null;
}

/* ─── Build price buckets from real DB data ─── */
function buildPriceBuckets(listings) {
  const prices = listings.map(l => parsePrice(l.price)).filter(p => p > 0);
  if (prices.length === 0) return [];
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const step = (max - min) / 4;
  return [
    { label: "Any Price",                                                      min: 0,       max: Infinity },
    { label: `Under ${formatPriceShort(min + step)}`,                          min: 0,       max: min + step },
    { label: `${formatPriceShort(min + step)} – ${formatPriceShort(min + step * 2)}`, min: min + step, max: min + step * 2 },
    { label: `${formatPriceShort(min + step * 2)} – ${formatPriceShort(min + step * 3)}`, min: min + step * 2, max: min + step * 3 },
    { label: `Above ${formatPriceShort(min + step * 3)}`,                      min: min + step * 3, max: Infinity },
  ];
}

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "name_asc",   label: "Name A–Z" },
];

function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function ActiveChip({ label, onRemove }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 bg-primary-50 border border-primary-200 font-heading font-bold text-[11px] text-primary-600">
      {label}
      <button onClick={onRemove}
        className="w-4 h-4 flex items-center justify-center bg-transparent border-none cursor-pointer text-primary-400 hover:text-primary-700">
        <X size={9} />
      </button>
    </motion.div>
  );
}

/* ─── Grid card ─── */
function ListingCard({ listing, onView, onEnquire, index }) {
  const cover = getCover(listing);
  const photoCount = Array.isArray(listing.images) ? listing.images.length : (cover ? 1 : 0);
  return (
    <motion.div layout
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      whileHover={{ y: -6, boxShadow: "0 24px 56px rgba(14,26,43,0.13)" }}
      className="bg-white overflow-hidden group relative cursor-pointer border border-transparent hover:border-primary-100 transition-all duration-300"
      onClick={() => onView(listing)}>
      <div className="relative h-[210px] overflow-hidden">
        {cover ? (
          <motion.img src={cover} alt={listing.name}
            whileHover={{ scale: 1.07 }} transition={{ duration: 0.55 }}
            className="w-full h-full object-cover block"
            onError={e => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-50">
            <Home size={32} className="text-primary-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 text-white px-2.5 py-1 font-heading font-bold text-[10px] tracking-[0.1em] uppercase"
          style={{ background: listing.type === "residential" ? "#9F4325" : "#0E1A2B" }}>
          {listing.category || listing.type}
        </span>
        {photoCount > 1 && (
          <span className="absolute top-3 right-3 bg-black/55 text-white font-heading font-bold text-[9px] px-2 py-0.5">
            +{photoCount - 1} photos
          </span>
        )}
        {listing.status && listing.status !== "available" && (
          <span className="absolute bottom-3 right-3 text-white px-2 py-0.5 font-heading font-bold text-[9px] tracking-widest uppercase bg-neutral-600">
            {listing.status}
          </span>
        )}
        {listing.priceLabel && (
          <span className="absolute bottom-3 left-3 font-heading font-bold text-white text-[13px] drop-shadow-md">{listing.priceLabel}</span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400" />
      </div>
      <div className="p-5">
        <h3 className="font-heading font-bold text-[15px] text-secondary-600 mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">{listing.name}</h3>
        <div className="flex items-center gap-1 font-body text-xs text-neutral-500 mb-3">
          <MapPin size={10} className="text-primary-600 flex-shrink-0" /> {listing.location}
        </div>
        {listing.features?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {listing.features.slice(0, 3).map((f, i) => (
              <span key={i} className="font-body text-neutral-500 bg-neutral-100 text-[10px] px-2 py-0.5">✓ {f}</span>
            ))}
          </div>
        )}
        <div className="flex justify-between items-center pt-3 border-t border-neutral-100 gap-2">
          <span className="font-body text-[11px] text-neutral-400">
            <strong className="font-heading text-[14px] text-primary-600">{listing.units}</strong> {listing.units === 1 ? "Unit" : "Units"}
          </span>
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={e => { e.stopPropagation(); onEnquire(listing); }}
              className="flex items-center gap-1 h-7 px-3 font-heading font-bold text-[10px] uppercase text-white bg-primary-600 hover:bg-primary-500 border-none cursor-pointer transition-colors">
              Enquire
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              onClick={e => { e.stopPropagation(); onView(listing); }}
              className="flex items-center gap-1 h-7 px-3 font-heading font-bold text-[10px] uppercase text-secondary-600 bg-transparent border border-neutral-200 hover:border-primary-600 hover:text-primary-600 cursor-pointer transition-colors">
              <ExternalLink size={10} /> View
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── List row ─── */
function ListingRow({ listing, onView, onEnquire, index }) {
  const cover = getCover(listing);
  return (
    <motion.div layout
      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.25) }}
      whileHover={{ x: 4, boxShadow: "0 4px 24px rgba(14,26,43,0.08)" }}
      className="bg-white border border-neutral-200 hover:border-primary-200 transition-all duration-200 cursor-pointer flex"
      onClick={() => onView(listing)}>
      <div className="w-[140px] sm:w-[200px] flex-shrink-0 h-[120px] overflow-hidden relative">
        {cover ? (
          <img src={cover} alt={listing.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary-50 flex items-center justify-center">
            <Home size={24} className="text-primary-300" />
          </div>
        )}
        <span className="absolute top-2 left-2 text-white px-2 py-0.5 font-heading font-bold text-[9px] uppercase"
          style={{ background: listing.type === "residential" ? "#9F4325" : "#0E1A2B" }}>
          {listing.type}
        </span>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-heading font-bold text-[14px] text-secondary-600 line-clamp-1">{listing.name}</h3>
            {listing.priceLabel && (
              <span className="font-heading font-bold text-[13px] text-primary-600 flex-shrink-0">{listing.priceLabel}</span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 font-body text-[11px] text-neutral-500">
            <MapPin size={9} className="text-primary-600" /> {listing.location}
          </div>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
          <div className="flex gap-1.5 flex-wrap">
            {listing.features?.slice(0, 2).map((f, i) => (
              <span key={i} className="font-body text-neutral-500 bg-neutral-100 text-[10px] px-2 py-0.5">✓ {f}</span>
            ))}
          </div>
          <button onClick={e => { e.stopPropagation(); onEnquire(listing); }}
            className="h-7 px-3 font-heading font-bold text-[10px] uppercase text-white bg-primary-600 hover:bg-primary-500 border-none cursor-pointer transition-colors">
            Enquire
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Native select ─── */
function NativeSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="appearance-none bg-white border border-neutral-200 px-4 py-2.5 pr-9 font-heading font-semibold text-[12px] text-secondary-600 cursor-pointer outline-none focus:border-primary-600 transition-colors"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%239F4325' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
      }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function ListingsPage() {
  const navigate = useNavigate();
  const { listings, loading } = useListings();
  const { user } = useAuth();

  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [priceFilter,  setPriceFilter]  = useState(0);
  const [sort,         setSort]         = useState("newest");
  const [viewMode,     setViewMode]     = useState("grid");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  const priceBuckets = useMemo(() => buildPriceBuckets(listings), [listings]);
  const categories   = useMemo(() => {
    const cats = [...new Set(listings.map(l => l.category).filter(Boolean))];
    return [{ value: "all", label: "All Categories" }, ...cats.map(c => ({ value: c, label: c }))];
  }, [listings]);
  const [catFilter, setCatFilter] = useState("all");

  const activeFilters = [
    typeFilter !== "all", catFilter !== "all", priceFilter !== 0, search.length > 0,
  ].filter(Boolean).length;

  const results = useMemo(() => {
    let out = [...listings];
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") out = out.filter(l => l.type === typeFilter);
    if (catFilter !== "all")  out = out.filter(l => l.category === catFilter);
    if (priceFilter > 0 && priceBuckets[priceFilter]) {
      const { min, max } = priceBuckets[priceFilter];
      out = out.filter(l => { const p = parsePrice(l.price); return p >= min && p < max; });
    }
    switch (sort) {
      case "price_asc":  out.sort((a, b) => parsePrice(a.price) - parsePrice(b.price)); break;
      case "price_desc": out.sort((a, b) => parsePrice(b.price) - parsePrice(a.price)); break;
      case "name_asc":   out.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
    }
    return out;
  }, [listings, search, typeFilter, catFilter, priceFilter, sort, priceBuckets]);

  const clearAll = () => { setSearch(""); setTypeFilter("all"); setCatFilter("all"); setPriceFilter(0); setSort("newest"); };

  const handleEnquire = (listing) => {
    if (user) window.dispatchEvent(new CustomEvent("tjc:openEnquiry", { detail: listing }));
    else       window.dispatchEvent(new CustomEvent("tjc:openAuth",   { detail: "login" }));
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {priceBuckets.length > 1 && (
        <div>
          <p className="font-heading font-bold text-[10px] tracking-[0.16em] uppercase text-primary-600 mb-2">Price Range</p>
          {priceBuckets.map((b, i) => (
            <button key={i} onClick={() => setPriceFilter(i)}
              className={`w-full text-left px-3 py-2 font-heading font-semibold text-[12px] transition-colors border-l-2 ${priceFilter === i ? "border-primary-600 bg-primary-50 text-primary-600" : "border-transparent text-neutral-500 hover:text-secondary-600 hover:border-neutral-300"}`}>
              {b.label}
            </button>
          ))}
        </div>
      )}
      <div>
        <p className="font-heading font-bold text-[10px] tracking-[0.16em] uppercase text-primary-600 mb-2">Property Type</p>
        {["all", "residential", "commercial"].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`w-full text-left px-3 py-2 font-heading font-semibold text-[12px] transition-colors border-l-2 ${typeFilter === t ? "border-primary-600 bg-primary-50 text-primary-600" : "border-transparent text-neutral-500 hover:text-secondary-600 hover:border-neutral-300"}`}>
            {t === "all" ? "All Types" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {categories.length > 2 && (
        <div>
          <p className="font-heading font-bold text-[10px] tracking-[0.16em] uppercase text-primary-600 mb-2">Category</p>
          {categories.map(c => (
            <button key={c.value} onClick={() => setCatFilter(c.value)}
              className={`w-full text-left px-3 py-2 font-heading font-semibold text-[12px] transition-colors border-l-2 ${catFilter === c.value ? "border-primary-600 bg-primary-50 text-primary-600" : "border-transparent text-neutral-500 hover:text-secondary-600 hover:border-neutral-300"}`}>
              {c.label}
            </button>
          ))}
        </div>
      )}
      {activeFilters > 0 && (
        <button onClick={clearAll}
          className="w-full h-9 border border-neutral-200 font-heading font-bold text-[11px] uppercase text-neutral-500 hover:text-red-600 hover:border-red-300 transition-colors bg-white cursor-pointer">
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-100">

      {/* Hero */}
      <div className="relative bg-secondary-600 overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-600 via-secondary-600/90 to-primary-600/30" />
        <div className="relative max-w-[1200px] mx-auto px-[5%] pt-32 pb-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="inline-block w-5 h-px bg-primary-500" />
              <p className="text-[11px] tracking-[0.2em] uppercase font-heading font-bold text-primary-500">TJC Properties</p>
            </div>
            <h1 className="font-heading font-bold text-white leading-[1.1]"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)" }}>
              All Available<br /><em className="not-italic text-primary-400">Properties</em>
            </h1>
            <p className="font-body text-white/60 mt-4 max-w-[480px]" style={{ fontSize: "clamp(13px, 1.5vw, 16px)" }}>
              Browse our full portfolio of residential and commercial properties across Ibadan.
            </p>
            {/* Search */}
            <div className="mt-8 flex gap-2 max-w-[560px]">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, location, category…"
                  className="w-full h-12 pl-11 pr-4 bg-white font-body text-[13px] text-secondary-600 outline-none border-none placeholder:text-neutral-400" />
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="h-12 px-6 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase tracking-[0.08em] border-none cursor-pointer transition-colors">
                Search
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/10">
          <div className="max-w-[1200px] mx-auto px-[5%] py-4 flex items-center gap-8 flex-wrap">
            {[
              { label: "Total Listings",  value: listings.length },
              { label: "Residential",     value: listings.filter(l => l.type === "residential").length },
              { label: "Commercial",      value: listings.filter(l => l.type === "commercial").length },
              { label: "Available",       value: listings.filter(l => !l.status || l.status === "available").length },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-heading font-bold text-white text-[20px]">{s.value}</span>
                <span className="font-body text-white/50 text-[11px] uppercase tracking-widest">{s.label}</span>
                {i < 3 && <span className="text-white/20 text-lg hidden sm:inline">·</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-[1200px] mx-auto px-[5%] py-10">
        <div className="flex gap-8">

          {/* Sidebar desktop */}
          <aside className="hidden lg:block w-[240px] flex-shrink-0">
            <div className="sticky top-24 bg-white border border-neutral-200 p-5">
              <div className="flex items-center justify-between mb-5">
                <p className="font-heading font-bold text-[11px] tracking-[0.16em] uppercase text-secondary-600">Filters</p>
                {activeFilters > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center bg-primary-600 text-white font-heading font-bold text-[10px]">{activeFilters}</span>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Grid area */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 h-9 px-4 border border-neutral-200 bg-white font-heading font-bold text-[11px] uppercase text-secondary-600 cursor-pointer hover:border-primary-600 hover:text-primary-600 transition-colors">
                  <Filter size={12} /> Filters {activeFilters > 0 && `(${activeFilters})`}
                </motion.button>
                <p className="font-body text-[13px] text-neutral-500">
                  <strong className="font-heading text-secondary-600">{results.length}</strong> propert{results.length !== 1 ? "ies" : "y"} found
                </p>
                <AnimatePresence>
                  {search && <ActiveChip label={`"${search}"`} onRemove={() => setSearch("")} />}
                  {typeFilter !== "all" && <ActiveChip label={typeFilter} onRemove={() => setTypeFilter("all")} />}
                  {catFilter !== "all" && <ActiveChip label={catFilter} onRemove={() => setCatFilter("all")} />}
                  {priceFilter > 0 && priceBuckets[priceFilter] && (
                    <ActiveChip label={priceBuckets[priceFilter].label} onRemove={() => setPriceFilter(0)} />
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2">
                <NativeSelect value={sort} onChange={setSort} options={SORT_OPTIONS} />
                <div className="flex border border-neutral-200 bg-white">
                  {[["grid", LayoutGrid], ["list", List]].map(([mode, Icon]) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                      className={`w-9 h-9 flex items-center justify-center cursor-pointer border-none transition-colors ${viewMode === mode ? "bg-primary-600 text-white" : "text-neutral-400 hover:text-primary-600"}`}>
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-3"}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white animate-pulse border border-neutral-100">
                    <div className={viewMode === "grid" ? "h-[210px] bg-neutral-200" : "h-[120px] bg-neutral-200"} />
                    <div className="p-5 space-y-2"><div className="h-4 bg-neutral-200 w-3/4" /><div className="h-3 bg-neutral-200 w-1/2" /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <motion.div layout
                className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-3"}>
                <AnimatePresence mode="popLayout">
                  {results.map((listing, i) =>
                    viewMode === "grid" ? (
                      <ListingCard key={listing.id} listing={listing} index={i}
                        onView={l => navigate(`/properties/${l.id}`)}
                        onEnquire={handleEnquire} />
                    ) : (
                      <ListingRow key={listing.id} listing={listing} index={i}
                        onView={l => navigate(`/properties/${l.id}`)}
                        onEnquire={handleEnquire} />
                    )
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Empty */}
            {!loading && results.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 bg-white border border-neutral-200">
                <div className="w-14 h-14 bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <Search size={22} className="text-primary-400" />
                </div>
                <h3 className="font-heading font-bold text-lg text-secondary-600">No properties match</h3>
                <p className="font-body text-sm mt-1 text-neutral-500 max-w-[280px] mx-auto">Try adjusting your filters or search terms.</p>
                <button onClick={clearAll}
                  className="mt-5 h-9 px-6 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors">
                  Clear All Filters
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* CTA Banner */}
        <FadeUp className="mt-16">
          <div className="relative overflow-hidden bg-secondary-600 p-8 sm:p-12">
            <div className="absolute inset-0" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }} />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase text-primary-400 mb-2">Can't find what you're looking for?</p>
                <h3 className="font-heading font-bold text-white leading-snug" style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)" }}>
                  Let us find your perfect property
                </h3>
                <p className="font-body text-white/55 text-sm mt-2 max-w-[380px]">
                  Tell us what you need and our team will match you with the right listing.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <motion.a href="https://wa.me/2348000000000" target="_blank" rel="noopener"
                  whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 h-11 px-6 font-heading font-bold text-[11px] uppercase text-white border border-white/25 hover:border-white/60 transition-colors no-underline">
                  <MessageCircle size={13} /> WhatsApp Us
                </motion.a>
                <motion.a href="/#contact"
                  whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 h-11 px-6 font-heading font-bold text-[11px] uppercase text-white bg-primary-600 hover:bg-primary-500 transition-colors no-underline border-none">
                  <PhoneCall size={13} /> Contact Agent
                </motion.a>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-[130] w-[300px] bg-white overflow-y-auto lg:hidden">
              <div className="flex items-center justify-between p-5 border-b border-neutral-200">
                <p className="font-heading font-bold text-[13px] tracking-[0.1em] uppercase text-secondary-600">Filters</p>
                <button onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 bg-transparent border-none cursor-pointer hover:text-secondary-600">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5">
                <FilterPanel />
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSidebarOpen(false)}
                  className="w-full h-10 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors mt-4">
                  Show {results.length} Results
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}