import { motion } from "framer-motion";
import { LogoMark } from "./ui";

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const FOOTER_COLS = [
  {
    title: "Quick Links",
    links: [
      { label: "About Us", action: () => scrollTo("about") },
      { label: "Services", action: () => scrollTo("services") },
      { label: "Properties", action: () => scrollTo("properties") },
      { label: "Our Team", action: () => scrollTo("team") },
      { label: "Contact", action: () => scrollTo("contact") },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Property Sales" },
      { label: "Lettings" },
      { label: "Project Management" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "tokunbojames@yahoo.com" },
      { label: "Oke-Ado, Ibadan, Nigeria" },
      { label: "@tjc_Properties" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#060d17] pt-16 pb-8 px-[5%]">
      <div className="max-w-[1200px] mx-auto">
        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 mb-12">
          {/* Brand */}
          <div>
            <button
              onClick={() => scrollTo("hero")}
              className="flex items-center gap-2.5 mb-4 bg-transparent border-none cursor-pointer"
            >
              <img src="/public/tjlogobg.png" className="h-24" />
            </button>
            <p className="font-body text-white/35 text-[13px] leading-relaxed max-w-[240px]">
              Your trusted partner for residential and commercial real estate in
              Ibadan, Nigeria. Transparent deals. Professional service.
            </p>
            {/* Social icons */}
            <div className="flex gap-2.5 mt-5">
              {["📸", "✉️", "💬"].map((icon, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.1, backgroundColor: "#9F4325" }}
                  className="w-8 h-8 bg-white/[0.06] border border-white/10 flex items-center justify-center text-sm cursor-pointer transition-colors duration-300"
                >
                  {icon}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className="text-white font-heading font-bold text-[11px] tracking-[0.12em] uppercase mb-4">
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <motion.span
                      whileHover={{ color: "#D97C5C", x: 3 }}
                      onClick={link.action}
                      className="text-white/35 font-body text-[13px] cursor-pointer transition-colors duration-300 inline-block"
                    >
                      {link.label}
                    </motion.span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.07] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="font-body text-white/25 text-xs">
            © 2025 TJC Properties. All rights reserved.
          </div>
          <div className="flex gap-5">
            {["Privacy Policy", "Terms & Conditions"].map((l) => (
              <span
                key={l}
                className="font-body text-white/25 text-[11px] cursor-pointer hover:text-white/60 transition-colors duration-300"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
