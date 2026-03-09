import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrolled } from "./../hooks/useScrolled";
import { LogoMark } from "./ui";
import { useAuth } from "../auth/AuthProvider";
import { useListings } from "../auth/ListingsProvider";
import AuthModal from "../auth/AuthModal";
import EnquiriesPanel from "./ui/EnquiriesPanel";
import { LogIn, LogOut, User, Inbox, ChevronDown } from "lucide-react";

const NAV_LINKS = ["about", "services", "properties", "team", "blog", "contact"];

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export default function Navbar() {
  const scrolled = useScrolled(50);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null);
  const [showInbox, setShowInbox] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const { enquiries } = useListings();

  // Listen for auth requests dispatched by child components (e.g. Properties)
  useEffect(() => {
    const handler = (e) => setAuthModal(e.detail || "login");
    window.addEventListener("tjc:openAuth", handler);
    return () => window.removeEventListener("tjc:openAuth", handler);
  }, []);
  const isAdmin = true; // replace with real check when ready
  const newCount = enquiries?.filter((e) => e.status === "new").length ?? 0;

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

        {/* Right side controls */}
        <div className="hidden md:flex items-center gap-2">
          {/* Admin: Enquiries inbox */}
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInbox(true)}
              className="relative flex items-center gap-1.5 h-9 px-3 border border-white/20 font-heading font-bold text-[11px] uppercase cursor-pointer transition-colors bg-transparent text-white/80 hover:text-white hover:border-white/50"
            >
              <Inbox size={13} />
              <span className="hidden lg:inline">Enquiries</span>
              {newCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-white font-heading font-bold text-[9px] bg-primary-600 rounded-none">
                  {newCount}
                </span>
              )}
            </motion.button>
          )}

          {/* Auth pill */}
          {user ? (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 h-9 px-3 border border-white/20 cursor-pointer bg-transparent text-white/80 hover:text-white hover:border-white/50 transition-colors"
              >
                <User size={12} />
                <span className="font-heading font-semibold text-[11px] max-w-[80px] truncate">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
                {isAdmin && (
                  <span className="text-[8px] font-heading font-bold tracking-widest uppercase px-1.5 py-0.5 text-white bg-primary-600">
                    Admin
                  </span>
                )}
                <ChevronDown size={10} />
              </motion.button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-1.5 w-44 bg-secondary-600 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-white/10">
                      <p className="font-heading font-bold text-[11px] text-white/50 uppercase tracking-widest">
                        Signed in as
                      </p>
                      <p className="font-heading font-bold text-[12px] text-white mt-0.5 truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 font-heading font-bold text-[11px] uppercase text-white/70 hover:text-white hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer"
                    >
                      <LogOut size={12} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setAuthModal("login")}
              className="flex items-center gap-1.5 h-9 px-3 border border-white/20 font-heading font-bold text-[11px] uppercase cursor-pointer transition-colors bg-transparent text-white/80 hover:text-white hover:border-white/50"
            >
              <LogIn size={13} /> Sign In
            </motion.button>
          )}

          {/* Enquire CTA */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => scrollTo("contact")}
            className="bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase px-5 py-2.5 transition-colors duration-300 border-none cursor-pointer"
          >
            Enquire Now
          </motion.button>
        </div>

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
            className="fixed top-[72px] left-0 right-0 z-40 bg-secondary-600/98 backdrop-blur-md flex flex-col px-[5%] py-6 gap-5"
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

            <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
              {isAdmin && (
                <button
                  onClick={() => { setShowInbox(true); setMobileOpen(false); }}
                  className="relative flex items-center gap-2 text-white/80 font-heading font-semibold text-sm tracking-[0.1em] uppercase text-left bg-transparent border-none cursor-pointer"
                >
                  <Inbox size={14} /> Enquiries
                  {newCount > 0 && (
                    <span className="w-4 h-4 flex items-center justify-center text-white font-heading font-bold text-[9px] bg-primary-600">
                      {newCount}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-white/80 font-heading font-semibold text-sm tracking-[0.1em] uppercase text-left bg-transparent border-none cursor-pointer"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              ) : (
                <button
                  onClick={() => { setAuthModal("login"); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-white/80 font-heading font-semibold text-sm tracking-[0.1em] uppercase text-left bg-transparent border-none cursor-pointer"
                >
                  <LogIn size={14} /> Sign In
                </button>
              )}

              <button
                onClick={() => { scrollTo("contact"); setMobileOpen(false); }}
                className="bg-primary-600 text-white font-heading font-bold text-xs tracking-[0.1em] uppercase px-5 py-3 mt-1 border-none cursor-pointer text-left"
              >
                Enquire Now →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays — mounted at navbar level so they're always above everything */}
      <AnimatePresence>
        {authModal && (
          <AuthModal
            defaultTab={authModal}
            onClose={() => setAuthModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInbox && isAdmin && (
          <EnquiriesPanel onClose={() => setShowInbox(false)} />
        )}
      </AnimatePresence>
    </>
  );
}