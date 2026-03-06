import { motion } from "framer-motion";
import { FadeUp, SectionTag } from "./ui";
import { STATS, WHY_REASONS } from "./../data";

export default function WhyUs() {
  return (
    <section
      id="why"
      className="py-24 px-[5%] bg-primary-50 relative overflow-hidden"
    >
      {/* Radial glow */}
      <div className="absolute -right-[5%] -top-[10%] w-[500px] h-[500px] rounded-full bg-primary-600/10 pointer-events-none blur-3xl" />

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

        {/* Left — reasons */}
        <FadeUp>
          <SectionTag>Why Choose Us</SectionTag>
          <h2
            className="font-heading text-secondary-600 leading-[1.2] my-5"
            style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 400 }}
          >
            A Team You Can{" "}
            <em className="not-italic text-primary-600">Trust</em>
          </h2>
          <p className="font-body text-neutral-500 text-[0.97rem] leading-relaxed mb-7">
            We bring together expertise across law, architecture, construction, and
            management — giving you a single trusted partner for every aspect of your
            property journey.
          </p>

          <ul className="space-y-4">
            {WHY_REASONS.map((r, i) => (
              <motion.li
                key={i}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-3.5"
              >
                <div className="w-5 h-5 min-w-5 bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                  ✓
                </div>
                <div>
                  <div className="font-heading font-bold text-[13px] text-secondary-600">
                    {r.label}
                  </div>
                  <div className="font-body text-neutral-500 text-[12px]">
                    {r.desc}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </FadeUp>

        {/* Right — stat cards */}
        <div className="grid grid-cols-2 gap-4">
          {STATS.map((s, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-white p-7 shadow-soft border-t-4 border-transparent hover:border-primary-600 transition-all duration-300"
              >
                <div
                  className="font-heading text-secondary-600 leading-none"
                  style={{ fontSize: "2.8rem", fontWeight: 600 }}
                >
                  {s.num.replace("+", "").replace("%", "")}
                  <span className="text-primary-600">
                    {s.num.includes("+")
                      ? "+"
                      : s.num.includes("%")
                      ? "%"
                      : ""}
                  </span>
                </div>
                <div className="font-body text-neutral-400 text-[12px] mt-2 font-semibold">
                  {s.label}
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
