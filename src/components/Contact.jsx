import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeUp, SectionTag } from "./ui";
import { CONTACT_INFO } from "./../data";

const INTERESTS = [
  "Select a service...",
  "Buying a Property",
  "Renting a Property",
  "Commercial Space",
  "Project Management",
  "General Enquiry",
];

const labelCls =
  "block font-heading font-semibold text-[10px] tracking-[0.1em] uppercase text-white/40 mb-1.5";

const inputCls =
  "w-full bg-white/[0.06] border border-white/12 text-white font-body text-sm px-4 py-3 outline-none focus:border-primary-500 transition-colors duration-300 placeholder:text-white/25";

export default function Contact() {
  const [form, setForm] = useState({
    first: "", last: "", email: "", phone: "", interest: "", message: "",
  });
  const [sent, setSent] = useState(false);

  const up = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <section id="contact" className="py-24 px-[5%] bg-secondary-600">
      <div className="max-w-[1200px] mx-auto">

        <FadeUp>
          <SectionTag light>Get In Touch</SectionTag>
          <h2
            className="font-heading text-white leading-[1.2] mb-12"
            style={{ fontSize: "clamp(2rem, 3vw, 2.8rem)", fontWeight: 400 }}
          >
            Ready to Find Your{" "}
            <em className="not-italic text-primary-500">Next Property?</em>
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-16 items-start">

          {/* Left — info */}
          <FadeUp>
            <p className="font-body text-white/55 text-[0.97rem] leading-relaxed mb-8">
              Whether you're looking to buy, rent, or invest — our team is ready.
              Reach out directly or fill in the form and we'll get back to you promptly.
            </p>

            {/* Office image */}
            <div className="h-[190px] overflow-hidden mb-8">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
                alt="TJC office"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-5">
              {CONTACT_INFO.map((c, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className="w-11 h-11 min-w-11 bg-primary-600/20 border border-primary-600/30 flex items-center justify-center text-base flex-shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <div className="font-heading font-semibold text-[10px] tracking-[0.1em] uppercase text-white/35 mb-0.5">
                      {c.label}
                    </div>
                    <div className="font-body text-white text-[13px] leading-snug">
                      {c.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Socials */}
            <div className="flex gap-3 mt-7">
              {[
                { icon: "📸", href: "https://instagram.com/tjc_Properties", title: "Instagram" },
                { icon: "✉️", href: "mailto:tokunbojames@yahoo.com", title: "Email" },
                { icon: "💬", href: "https://wa.me/", title: "WhatsApp" },
              ].map((s) => (
                <motion.a
                  key={s.title}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  title={s.title}
                  whileHover={{ scale: 1.1, backgroundColor: "#9F4325" }}
                  className="w-10 h-10 bg-white/[0.06] border border-white/12 flex items-center justify-center text-base transition-colors duration-300"
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </FadeUp>

          {/* Right — form */}
          <FadeUp delay={0.15}>
            <div className="bg-white/[0.04] border border-white/8 p-8 lg:p-10">
              <div className="font-heading font-bold text-white text-[16px] mb-6">
                Send Us a Message
              </div>

              {/* Row: First + Last */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[["first", "First Name", "John"], ["last", "Last Name", "Doe"]].map(
                  ([k, l, p]) => (
                    <div key={k}>
                      <label className={labelCls}>{l}</label>
                      <input
                        className={inputCls}
                        placeholder={p}
                        value={form[k]}
                        onChange={(e) => up(k, e.target.value)}
                      />
                    </div>
                  )
                )}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className={labelCls}>Email Address</label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => up("email", e.target.value)}
                />
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label className={labelCls}>Phone Number</label>
                <input
                  type="tel"
                  className={inputCls}
                  placeholder="+234 ..."
                  value={form.phone}
                  onChange={(e) => up("phone", e.target.value)}
                />
              </div>

              {/* Interest */}
              <div className="mb-4">
                <label className={labelCls}>I'm Interested In</label>
                <select
                  className={`${inputCls} cursor-pointer`}
                  value={form.interest}
                  onChange={(e) => up("interest", e.target.value)}
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  {INTERESTS.map((o) => (
                    <option key={o} style={{ background: "#0E1A2B" }}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className={labelCls}>Message</label>
                <textarea
                  className={`${inputCls} resize-y min-h-[90px]`}
                  placeholder="Tell us more about what you're looking for..."
                  value={form.message}
                  onChange={(e) => up("message", e.target.value)}
                />
              </div>

              {/* Submit / Success */}
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-success-500/15 border border-success-400/30 text-success-400 px-4 py-3.5 text-center font-heading font-semibold text-[13px]"
                  >
                    ✓ Message sent! We'll be in touch shortly.
                  </motion.div>
                ) : (
                  <motion.button
                    key="btn"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white border-none cursor-pointer py-4 font-heading font-bold text-[13px] tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition-colors duration-300"
                  >
                    Send Message →
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
