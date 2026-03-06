import { motion, useScroll, useTransform } from "framer-motion";
import { BtnPrimary, BtnOutline } from "./ui";
import { STATS } from "./../data";

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export default function Hero() {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 500], [0, 100]);

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
            transition={{ delay: 0.45, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="font-heading text-white leading-[1.1] mb-4"
            style={{ fontSize: "clamp(2.8rem, 5vw, 4.6rem)", fontWeight: 300 }}
          >
            Find Your <br />
            <em className="not-italic text-primary-500 font-semibold">Perfect Property</em>
            <br />
            <span className="font-bold">in Ibadan.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.7 }}
            className="text-white/60 font-body text-base leading-relaxed max-w-[440px] mb-8"
          >
            TJC Properties specialises in residential and commercial real estate —
            offering curated listings, professional lettings, and end-to-end project
            oversight across Ibadan.
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

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex gap-8 mt-10 pt-7 border-t border-white/10"
          >
            {STATS.slice(0, 3).map((s, i) => (
              <div key={i}>
                <div
                  className="font-heading text-white leading-none"
                  style={{ fontSize: "2.2rem", fontWeight: 600 }}
                >
                  {s.num.replace("+", "").replace("%", "")}
                  <span className="text-primary-500">
                    {s.num.includes("+") ? "+" : s.num.includes("%") ? "%" : ""}
                  </span>
                </div>
                <div className="font-heading text-white/45 text-[10px] tracking-[0.1em] uppercase mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — Floating featured card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex justify-center"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white/[0.06] border border-white/10 backdrop-blur-md p-4 max-w-[340px] w-full"
          >
            <div className="relative h-[220px] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=700&q=80"
                alt="Featured warehouse"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 left-3 bg-primary-600 text-white px-3 py-1 text-[10px] font-heading font-bold tracking-[0.1em] uppercase">
                Featured
              </span>
            </div>
            <div className="pt-3.5 px-1 pb-1">
              <div className="text-primary-500 text-[10px] font-heading font-bold tracking-[0.12em] uppercase">
                Commercial
              </div>
              <div className="text-white font-heading font-bold text-[15px] my-1">
                Warehouse Complex
              </div>
              <div className="text-white/50 font-body text-xs">
                📍 KM 10, Ibadan-Oyo Expressway
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                <span className="text-white font-heading font-bold text-[13px]">
                  1,250 sqm each
                </span>
                <span className="bg-white/10 text-white/60 font-body text-[10px] px-2.5 py-1">
                  6 Units
                </span>
              </div>
            </div>
          </motion.div>
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
