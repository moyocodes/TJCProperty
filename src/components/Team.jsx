import { motion } from "framer-motion";
import { FadeUp, SectionTag } from "./ui";
import { TEAM } from "./../data";

export default function Team() {
  return (
    <section id="team" className="py-24 px-[5%] bg-white">
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <FadeUp>
          <div className="text-center mb-14">
            <div className="flex justify-center">
              <SectionTag>Our People</SectionTag>
            </div>
            <h2
              className="font-heading text-secondary-600 leading-[1.2] my-3"
              style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 400 }}
            >
              Meet the{" "}
              <em className="not-italic text-primary-600">Team</em>
            </h2>
            <p className="font-body text-neutral-400 text-[0.97rem] leading-relaxed max-w-[500px] mx-auto">
              A multidisciplinary team of professionals committed to excellence
              across every property transaction.
            </p>
          </div>
        </FadeUp>

        {/* Grid — 4 cols desktop, 2 tablet, 1 mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.map((m, i) => (
            <FadeUp key={i} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 16px 40px rgba(0,0,0,0.1)" }}
                transition={{ duration: 0.3 }}
                className="border border-neutral-200 overflow-hidden relative group"
              >
                {/* Photo */}
                <div className="h-[180px] overflow-hidden relative">
                  <motion.img
                    src={m.img}
                    alt={m.name}
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full object-cover object-top block"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary-600/50 to-transparent" />
                </div>

                {/* Info */}
                <div className="px-4 py-4 text-center">
                  <div className="font-heading font-bold text-[13px] text-secondary-600 mb-1 leading-snug">
                    {m.name}
                  </div>
                  <div className="font-heading font-semibold text-primary-600 text-[11px] tracking-[0.06em] uppercase">
                    {m.role}
                  </div>
                </div>

                {/* Hover bottom line */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400" />
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
