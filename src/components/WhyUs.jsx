// src/components/sections/WhyUs.jsx
// Animated counting stats + admin-editable stats and reasons inline

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Pencil, Check, X, Plus, Trash2, GripVertical } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

/* ─── default data (replace with Firestore later if needed) ─── */
const DEFAULT_STATS = [
  { id: 1, num: "200+", label: "Properties Sold" },
  { id: 2, num: "15+",  label: "Years Experience" },
  { id: 3, num: "98%",  label: "Client Satisfaction" },
  { id: 4, num: "50+",  label: "Expert Agents" },
];

const DEFAULT_REASONS = [
  { id: 1, label: "Legal Expertise",        desc: "In-house legal team ensures every transaction is fully documented and compliant." },
  { id: 2, label: "End-to-End Support",     desc: "From search to handover, we manage every step so you don't have to." },
  { id: 3, label: "Verified Listings Only", desc: "Every property is physically inspected and title-verified before listing." },
  { id: 4, label: "Transparent Pricing",    desc: "No hidden fees. What you see is what you pay." },
];

/* ─── Helpers ─── */
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className}
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

/* ─── Animated counter ─── */
function AnimatedNumber({ target, suffix, duration = 1800 }) {
  const [display, setDisplay] = useState(0);
  const ref       = useRef(null);
  const inView    = useInView(ref, { once: true, margin: "-60px" });
  const startedAt = useRef(null);
  const rafId     = useRef(null);

  useEffect(() => {
    if (!inView) return;
    startedAt.current = null;

    const step = (ts) => {
      if (!startedAt.current) startedAt.current = ts;
      const elapsed  = ts - startedAt.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) rafId.current = requestAnimationFrame(step);
    };

    rafId.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId.current);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      <span className="text-primary-600">{suffix}</span>
    </span>
  );
}

// Parse "200+" → { value: 200, suffix: "+" }
function parseStat(numStr) {
  const s = String(numStr).trim();
  const suffix = s.endsWith("+") ? "+" : s.endsWith("%") ? "%" : "";
  const value  = parseInt(s.replace(/[^0-9]/g, ""), 10) || 0;
  return { value, suffix };
}

/* ─── Editable stat card ─── */
function StatCard({ stat, isAdmin, onUpdate, onDelete, delay }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState({ num: stat.num, label: stat.label });
  const { value, suffix } = parseStat(stat.num);

  const save = () => { onUpdate({ ...stat, ...draft }); setEditing(false); };
  const cancel = () => { setDraft({ num: stat.num, label: stat.label }); setEditing(false); };

  return (
    <FadeUp delay={delay}>
      <motion.div whileHover={!editing ? { y: -5 } : {}}
        className="bg-white p-6 shadow-soft border-t-4 border-transparent hover:border-primary-600 transition-all duration-300 relative group min-h-[120px]">

        {isAdmin && !editing && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)}
              className="w-6 h-6 flex items-center justify-center bg-secondary-600 text-white border-none cursor-pointer hover:bg-primary-600 transition-colors">
              <Pencil size={11} />
            </button>
            <button onClick={onDelete}
              className="w-6 h-6 flex items-center justify-center bg-red-600 text-white border-none cursor-pointer">
              <Trash2 size={11} />
            </button>
          </div>
        )}

        {editing ? (
          <div className="space-y-2">
            <input value={draft.num} onChange={e => setDraft(d => ({ ...d, num: e.target.value }))}
              placeholder="e.g. 200+ or 98%"
              className="w-full border border-primary-400 outline-none px-2 py-1 font-heading font-bold text-[22px] text-secondary-600 text-center" />
            <input value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
              placeholder="Label"
              className="w-full border border-neutral-200 outline-none px-2 py-1 font-body text-[12px] text-neutral-500 text-center" />
            <div className="flex gap-1.5 justify-center pt-1">
              <button onClick={save}
                className="flex items-center gap-1 h-7 px-3 bg-primary-600 text-white font-heading font-bold text-[10px] uppercase border-none cursor-pointer">
                <Check size={11} /> Save
              </button>
              <button onClick={cancel}
                className="flex items-center gap-1 h-7 px-3 border border-neutral-200 text-neutral-500 font-heading font-bold text-[10px] uppercase bg-white cursor-pointer">
                <X size={11} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="font-heading text-secondary-600 leading-none"
              style={{ fontSize: "2.6rem", fontWeight: 600 }}>
              <AnimatedNumber target={value} suffix={suffix} />
            </div>
            <div className="font-body text-neutral-400 text-[12px] mt-2 font-semibold">
              {stat.label}
            </div>
          </>
        )}
      </motion.div>
    </FadeUp>
  );
}

/* ─── Editable reason item ─── */
function ReasonItem({ reason, isAdmin, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState({ label: reason.label, desc: reason.desc });

  const save   = () => { onUpdate({ ...reason, ...draft }); setEditing(false); };
  const cancel = () => { setDraft({ label: reason.label, desc: reason.desc }); setEditing(false); };

  return (
    <motion.li whileHover={!editing ? { x: 4 } : {}} transition={{ duration: 0.25 }}
      className="flex items-start gap-3.5 group">
      <div className="w-5 h-5 min-w-5 bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
        ✓
      </div>

      {editing ? (
        <div className="flex-1 space-y-1.5">
          <input value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
            className="w-full border border-primary-400 outline-none px-2 py-1 font-heading font-bold text-[13px] text-secondary-600" />
          <textarea value={draft.desc} onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))}
            rows={2}
            className="w-full border border-neutral-200 outline-none px-2 py-1 font-body text-[12px] text-neutral-500 resize-none" />
          <div className="flex gap-1.5">
            <button onClick={save}
              className="flex items-center gap-1 h-6 px-2.5 bg-primary-600 text-white font-heading font-bold text-[10px] uppercase border-none cursor-pointer">
              <Check size={10} /> Save
            </button>
            <button onClick={cancel}
              className="flex items-center gap-1 h-6 px-2.5 border border-neutral-200 text-neutral-500 font-heading font-bold text-[10px] uppercase bg-white cursor-pointer">
              <X size={10} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <div className="font-heading font-bold text-[13px] text-secondary-600">{reason.label}</div>
          <div className="font-body text-neutral-500 text-[12px]">{reason.desc}</div>
        </div>
      )}

      {isAdmin && !editing && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
          <button onClick={() => setEditing(true)}
            className="w-5 h-5 flex items-center justify-center bg-secondary-600 text-white border-none cursor-pointer hover:bg-primary-600 transition-colors">
            <Pencil size={9} />
          </button>
          <button onClick={onDelete}
            className="w-5 h-5 flex items-center justify-center bg-red-600 text-white border-none cursor-pointer">
            <Trash2 size={9} />
          </button>
        </div>
      )}
    </motion.li>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function WhyUs() {
  const { isAdmin } = useAuth();

  const [stats,   setStats]   = useState(DEFAULT_STATS);
  const [reasons, setReasons] = useState(DEFAULT_REASONS);

  // ── stat actions ──
  const updateStat  = (updated) => setStats(s => s.map(x => x.id === updated.id ? updated : x));
  const deleteStat  = (id)      => setStats(s => s.filter(x => x.id !== id));
  const addStat     = ()        => setStats(s => [...s, { id: Date.now(), num: "0+", label: "New Stat" }]);

  // ── reason actions ──
  const updateReason = (updated) => setReasons(r => r.map(x => x.id === updated.id ? updated : x));
  const deleteReason = (id)      => setReasons(r => r.filter(x => x.id !== id));
  const addReason    = ()        => setReasons(r => [...r, { id: Date.now(), label: "New Point", desc: "Describe it here." }]);

  return (
    <section id="why" className="py-24 px-[5%] bg-primary-50 relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute -right-[5%] -top-[10%] w-[500px] h-[500px] rounded-full bg-primary-600/10 pointer-events-none blur-3xl" />

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

        {/* Left — reasons */}
        <FadeUp>
          <SectionTag>Why Choose Us</SectionTag>
          <h2 className="font-heading text-secondary-600 leading-[1.2] my-5"
            style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 400 }}>
            A Team You Can{" "}
            <em className="not-italic text-primary-600">Trust</em>
          </h2>
          <p className="font-body text-neutral-500 text-[0.97rem] leading-relaxed mb-7">
            We bring together expertise across law, architecture, construction, and
            management — giving you a single trusted partner for every aspect of your
            property journey.
          </p>

          <ul className="space-y-4">
            <AnimatePresence>
              {reasons.map((r) => (
                <ReasonItem key={r.id} reason={r} isAdmin={isAdmin}
                  onUpdate={updateReason}
                  onDelete={() => deleteReason(r.id)} />
              ))}
            </AnimatePresence>
          </ul>

          {isAdmin && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={addReason}
              className="mt-5 flex items-center gap-1.5 h-8 px-4 border border-dashed border-primary-400 text-primary-600 font-heading font-bold text-[10px] uppercase bg-transparent cursor-pointer hover:bg-primary-50 transition-colors">
              <Plus size={12} /> Add Point
            </motion.button>
          )}
        </FadeUp>

        {/* Right — stat cards */}
        <div>
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {stats.map((s, i) => (
                <StatCard key={s.id} stat={s} isAdmin={isAdmin} delay={i * 0.1}
                  onUpdate={updateStat}
                  onDelete={() => deleteStat(s.id)} />
              ))}
            </AnimatePresence>
          </div>

          {isAdmin && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={addStat}
              className="mt-4 w-full h-10 border border-dashed border-primary-400 text-primary-600 font-heading font-bold text-[10px] uppercase bg-transparent cursor-pointer hover:bg-primary-50 transition-colors flex items-center justify-center gap-1.5">
              <Plus size={12} /> Add Stat
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}