// src/components/admin/AdminButton.jsx
// Drop into Navbar. Admin button navigates to /admin (or calls onAdminOpen prop).
// Pass onAdminOpen as a prop to control how you show AdminPanel.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import AuthModal from "../../auth/AuthModal";

export default function AdminButton({ onAdminOpen }) {
  const { user, isAdmin, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        {user ? (
          <>
            {/* User pill */}
            <div className="hidden sm:flex items-center gap-1.5 h-9 px-3 border border-neutral-200 bg-white">
              <User size={12} className="text-primary-600" />
              <span className="font-heading font-bold text-[11px] max-w-[100px] truncate text-secondary-600">
                {user.displayName || user.email?.split("@")[0]}
              </span>
              {isAdmin && (
                <span className="text-[8px] font-heading font-bold tracking-widest uppercase px-1.5 py-0.5 text-white bg-primary-600">
                  Admin
                </span>
              )}
            </div>

            {/* Admin panel — only for admins */}
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAdminOpen}
                className="flex items-center gap-1.5 h-9 px-4 text-white font-heading font-bold text-[11px] tracking-[0.08em] uppercase border-none cursor-pointer bg-primary-600 hover:bg-primary-500 transition-colors"
              >
                <Settings size={13} /> Admin
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="h-9 w-9 flex items-center justify-center border border-neutral-200 bg-white cursor-pointer text-neutral-400 hover:text-secondary-600 transition-colors"
              title="Sign out"
            >
              <LogOut size={13} />
            </motion.button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAuthOpen(true)}
            className="flex items-center gap-1.5 h-9 px-4 border border-neutral-200 bg-white font-heading font-bold text-[11px] uppercase cursor-pointer text-secondary-600 hover:border-primary-600 hover:text-primary-600 transition-colors"
          >
            <LogIn size={13} /> Sign In
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
