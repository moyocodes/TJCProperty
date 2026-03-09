import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useScrolled } from "../hooks/useScrolled";
import { useAuth } from "../auth/AuthProvider";
import { LayoutDashboard, User } from "lucide-react";

const NAV_LINKS = [
  "about",
  "services",
  "properties",
  "team",
  "blog",
  "contact",
];

export default function Navbar() {
  const scrolled = useScrolled(50);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";

  const scrollToSection = (id) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: id } });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navBackground =
    !isHome || scrolled
      ? "bg-secondary-600/95 backdrop-blur-md shadow-[0_2px_24px_rgba(0,0,0,0.3)]"
      : "bg-transparent";

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] py-[1.1rem] transition-all duration-400 ${navBackground}`}
    >
      {/* Logo */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer"
      >
        <img
          src="/tjlogobg.png"
          alt="TJC Properties logo"
          className="w-32 h-auto"
        />
      </button>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-7">
        {NAV_LINKS.map((id) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className="text-white/75 hover:text-primary-500 font-heading font-semibold text-[11px] tracking-[0.12em] uppercase transition-colors"
          >
            {id}
          </button>
        ))}
      </div>

      {/* Right section */}
      <div className="hidden md:flex items-center gap-3">
        {user && (
          <>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white/80 hover:text-white hover:border-white/50 font-heading font-bold text-[11px] uppercase"
            >
              <LayoutDashboard size={13} />
              Dashboard
            </button>

            <div className="flex items-center gap-2 px-3 py-2 border border-white/10 text-white/70">
              <User size={12} />
              <span className="font-heading text-[11px] truncate max-w-[90px]">
                {user.displayName || user.email?.split("@")[0]}
              </span>
            </div>
          </>
        )}

        {/* Enquire */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => scrollToSection("contact")}
          className="bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase px-5 py-2.5"
        >
          Enquire Now
        </motion.button>
      </div>

      {/* Hamburger */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="flex md:hidden flex-col gap-[5px]"
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

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="absolute top-full left-0 right-0 bg-secondary-600/98 backdrop-blur-md flex flex-col px-[5%] py-6 gap-5 md:hidden"
          >
            {NAV_LINKS.map((id) => (
              <button
                key={id}
                onClick={() => {
                  scrollToSection(id);
                  setMobileOpen(false);
                }}
                className="text-white/80 font-heading font-semibold text-sm uppercase text-left"
              >
                {id}
              </button>
            ))}

            {user && (
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setMobileOpen(false);
                }}
                className="text-white font-heading font-semibold text-sm uppercase text-left"
              >
                Dashboard
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}