import { motion } from "framer-motion";
import { FadeUp, SectionTag } from "./ui";
import { SERVICES } from "./../data";

export default function Services() {
  return (
    <section id="services" className="py-24 px-[5%] bg-secondary-600">
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="flex justify-between items-end mb-14 flex-wrap gap-8">
          <FadeUp>
            <SectionTag light>What We Do</SectionTag>
            <h2
              className="font-heading text-white leading-[1.2] mt-0"
              style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 400 }}
            >
              Our{" "}
              <em className="not-italic text-primary-500">Core</em>
              <br />
              Services
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="font-body text-white/50 text-[0.95rem] leading-relaxed max-w-[360px]">
              Every service is designed to make your property journey seamless —
              from finding the right space to managing it long-term.
            </p>
          </FadeUp>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5">
          {SERVICES.map((s, i) => (
            <FadeUp key={i} delay={i * 0.12}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden cursor-default h-[420px] group"
              >
                {/* BG image */}
                <img
                  src={s.img}
                  alt={s.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-secondary-600/95 via-secondary-600/40 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div
                    className="font-heading text-white/8 leading-none mb-2"
                    style={{ fontSize: "3.5rem", fontWeight: 300, color: "rgba(255,255,255,0.07)" }}
                  >
                    {s.n}
                  </div>
                  <div className="text-[22px] mb-2">{s.icon}</div>
                  <div className="font-heading font-bold text-white text-[17px] mb-2.5">
                    {s.name}
                  </div>
                  <p className="font-body text-white/60 text-[13px] leading-relaxed">
                    {s.desc}
                  </p>
                  <div className="text-primary-500 mt-4 text-lg">→</div>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400" />
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
