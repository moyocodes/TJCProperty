import { motion } from "framer-motion";
import { FadeUp, SectionTag, BtnPrimary } from "./ui";
import { ABOUT_HIGHLIGHTS } from "./../data";

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export default function About() {
  return (
    <section id="about" className="py-24 px-[5%] bg-white">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

        {/* Visual */}
        <FadeUp>
          <div className="relative">
            <div className="w-full aspect-[4/5] overflow-hidden">
              <img
                src="tjc.jpeg"
                alt="TJC Properties office"
                className="w-full h-full  "
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary-600/40 to-transparent" />
            </div>

            {/* Corner badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="absolute -bottom-5 -right-5 bg-primary-600 text-white w-[110px] h-[110px] flex flex-col items-center justify-center"
            >
              <span className="font-heading font-semibold text-[2.2rem] leading-none">
                TJC
              </span>
              <span className="font-heading font-normal text-[9px] tracking-[0.12em] uppercase opacity-80 mt-0.5">
                Est. Ibadan
              </span>
            </motion.div>
          </div>
        </FadeUp>

        {/* Text */}
        <FadeUp delay={0.15}>
          <SectionTag>Who We Are</SectionTag>
          <h2
            className="font-heading text-secondary-600 leading-[1.2] mb-5"
            style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 400 }}
          >
            Building Trust
            <br />
            Through{" "}
            <em className="not-italic text-primary-600">Every Deal</em>
          </h2>

          <p className="font-body text-neutral-600 text-base leading-relaxed mb-3">
            TJC Properties is a full-service real estate firm based in Ibadan, Nigeria.
            We connect property seekers with quality residential and commercial spaces —
            backed by a dedicated team spanning architecture, law, construction, and management.
          </p>
          <p className="font-body text-neutral-600 text-base leading-relaxed mb-7">
            Our approach is built on transparency and deep understanding of the Ibadan
            property market. From first enquiry to final handover, we're with you every step.
          </p>

          {/* Highlights grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {ABOUT_HIGHLIGHTS.map((h, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -3 }}
                className="flex items-start gap-3 p-3.5 bg-neutral-100 border border-neutral-200"
              >
                <span className="text-xl mt-0.5">{h.icon}</span>
                <div>
                  <div className="font-heading font-bold text-[13px] text-secondary-600">
                    {h.label}
                  </div>
                  <div className="font-body text-neutral-400 text-[11px]">
                    {h.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <BtnPrimary onClick={() => scrollTo("services")}>
            Our Services →
          </BtnPrimary>
        </FadeUp>
      </div>
    </section>
  );
}
