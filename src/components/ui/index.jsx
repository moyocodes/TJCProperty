import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/* ── Scroll-triggered fade-up wrapper ── */
export function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Section label tag ── */
export function SectionTag({ children, light = false }) {
  return (
    <div
      className={`inline-flex items-center gap-2 text-[11px] font-heading font-bold tracking-[0.18em] uppercase mb-3 ${
        light ? "text-primary-500" : "text-primary-600"
      }`}
    >
      <span
        className={`inline-block w-5 h-px ${light ? "bg-primary-500" : "bg-primary-600"}`}
      />
      {children}
    </div>
  );
}

/* ── Primary CTA button ── */
export function BtnPrimary({ children, onClick, className = "" }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-xs tracking-[0.08em] uppercase px-8 py-3.5 transition-colors duration-300 cursor-pointer border-none ${className}`}
    >
      {children}
    </motion.button>
  );
}

/* ── Ghost / outline button ── */
export function BtnOutline({ children, onClick, className = "" }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`bg-transparent text-white font-heading font-bold text-xs tracking-[0.08em] uppercase px-8 py-3.5 border-2 border-white/30 hover:border-white/70 transition-colors duration-300 cursor-pointer ${className}`}
    >
      {children}
    </motion.button>
  );
}

/* ── Logo mark ── */
export function LogoMark({ size = 40 }) {
  return (
    <div
      className="bg-primary-600 flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
      }}
    >
      <span className="text-white font-heading font-extrabold" style={{ fontSize: size * 0.27 }}>
        TJC
      </span>
    </div>
  );
}
