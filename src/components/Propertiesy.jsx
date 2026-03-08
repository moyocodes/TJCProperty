import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeUp, SectionTag, BtnPrimary } from "./ui";
import { PROPERTIES } from "../data";

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const FILTERS = ["all", "residential", "commercial"];

export default function Properties() {
  const [active, setActive] = useState("all");
  const filtered =
    active === "all" ? PROPERTIES : PROPERTIES.filter((p) => p.type === active);

  return (
    <section id="properties" className="py-24 px-[5%] bg-neutral-100">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-10 flex-wrap gap-6">
          <FadeUp>
            <SectionTag>Listings</SectionTag>
            <h2
              className="font-heading text-secondary-600 leading-[1.2] mt-0"
              style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 400 }}
            >
              Available{" "}
              <em className="not-italic text-primary-600">Properties</em>
            </h2>
          </FadeUp>

          {/* Filter tabs */}
          <FadeUp delay={0.1}>
            <div className="flex gap-1.5 flex-wrap">
              {FILTERS.map((f) => (
                <motion.button
                  key={f}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActive(f)}
                  className={`px-5 py-2 font-heading font-semibold text-[11px] tracking-[0.06em] uppercase border transition-colors duration-250 cursor-pointer ${
                    active === f
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-neutral-400 border-neutral-200 hover:border-primary-600 hover:text-primary-600"
                  }`}
                >
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </motion.button>
              ))}
            </div>
          </FadeUp>
        </div>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                whileHover={{
                  y: -7,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
                }}
                className="bg-white overflow-hidden cursor-pointer shadow-card group"
              >
                {/* Image */}
                <div className="relative h-[200px] overflow-hidden">
                  <motion.img
                    src={p.img}
                    alt={p.name}
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full object-cover block"
                  />
                  <span
                    className={`absolute top-3 left-3 text-white px-3 py-1 font-heading font-bold text-[10px] tracking-[0.1em] uppercase ${
                      p.type === "residential"
                        ? "bg-primary-600"
                        : "bg-secondary-600"
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="font-heading font-bold text-[15px] text-secondary-600 mb-1">
                    {p.name}
                  </div>
                  <div className="font-body text-neutral-400 text-xs mb-4">
                    📍 {p.location}
                  </div>

                  {/* Feature tags */}
                  <div className="flex gap-2 flex-wrap mb-4">
                    {p.features.map((f, fi) => (
                      <span
                        key={fi}
                        className="font-body text-neutral-500 bg-neutral-100 text-[11px] px-2.5 py-1"
                      >
                        ✓ {f}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center pt-3.5 border-t border-neutral-200">
                    <div className="font-body text-neutral-400 text-[12px]">
                      <strong className="font-heading text-primary-600 text-[15px]">
                        {p.units}
                      </strong>{" "}
                      {p.units === 1 ? "Unit" : "Units"} Available
                    </div>
                    <motion.button
                      whileHover={{ x: 3 }}
                      onClick={() => scrollTo("contact")}
                      className="bg-transparent border-none cursor-pointer font-heading font-bold text-primary-600 hover:text-primary-700 text-[11px] tracking-[0.06em] uppercase"
                    >
                      Enquire →
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* CTA */}
        <FadeUp delay={0.2}>
          <div className="text-center mt-12">
            <BtnPrimary onClick={() => scrollTo("contact")}>
              Request Full Portfolio →
            </BtnPrimary>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
