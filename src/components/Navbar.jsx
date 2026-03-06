import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrolled } from "./../hooks/useScrolled";
import { LogoMark } from "./ui";


const NAV_LINKS = ["about", "services", "properties", "team", "contact"];

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export default function Navbar() {
  const scrolled = useScrolled(50);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] py-[1.1rem] transition-all duration-400 ${
          scrolled
            ? "bg-secondary-600/95 backdrop-blur-md shadow-[0_2px_24px_rgba(0,0,0,0.3)]"
            : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <button
          onClick={() => scrollTo("hero")}
          className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none"
        >
          <LogoMark size={40} />
          <div className="text-left">
            <div className="text-white font-heading font-bold text-[13px] tracking-[0.05em]">
              TJC Properties
            </div>
            <div className="text-primary-500 font-heading font-normal text-[9px] tracking-[0.14em] uppercase">
              Premium Real Estate · Ibadan
            </div>
          </div>
        </button>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((id) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-white/75 hover:text-primary-500 font-heading font-semibold text-[11px] tracking-[0.12em] uppercase transition-colors duration-300 bg-transparent border-none cursor-pointer"
            >
              {id}
            </button>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => scrollTo("contact")}
          className="hidden md:block bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase px-5 py-2.5 transition-colors duration-300 border-none cursor-pointer"
        >
          Enquire Now
        </motion.button>

        {/* Hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex md:hidden flex-col gap-[5px] bg-transparent border-none cursor-pointer p-1"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={
                mobileOpen
                  ? i === 0
                    ? { rotate: 45, y: 7 }
                    : i === 1
                    ? { opacity: 0 }
                    : { rotate: -45, y: -7 }
                  : { rotate: 0, y: 0, opacity: 1 }
              }
              className="block w-6 h-[2px] bg-white"
            />
          ))}
        </button>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="fixed top-[72px] left-0 right-0 z-40 bg-secondary-700/98 backdrop-blur-md flex flex-col px-[5%] py-6 gap-5"
          >
            {NAV_LINKS.map((id) => (
              <button
                key={id}
                onClick={() => { scrollTo(id); setMobileOpen(false); }}
                className="text-white/80 font-heading font-semibold text-sm tracking-[0.1em] uppercase text-left bg-transparent border-none cursor-pointer"
              >
                {id}
              </button>
            ))}
            <button
              onClick={() => { scrollTo("contact"); setMobileOpen(false); }}
              className="bg-primary-600 text-white font-heading font-bold text-xs tracking-[0.1em] uppercase px-5 py-3 mt-2 border-none cursor-pointer text-left"
            >
              Enquire Now →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
