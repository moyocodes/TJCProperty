// src/pages/AdminLoginPage.jsx
// Shown at /admin when the user is not logged in.
// Clean, minimal login form — no register, no public links.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

const inputCls = (focused, error) =>
  `w-full bg-white font-body text-[14px] px-4 py-3 outline-none transition-colors placeholder:text-neutral-300 ${
    error
      ? "border border-red-400"
      : focused
      ? "border border-primary-600"
      : "border border-neutral-200"
  }`;

export default function AdminLoginPage() {
  const { login, authError, clearError } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errs, setErrs] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [focusedEmail, setFocusedEmail]       = useState(false);
  const [focusedPassword, setFocusedPassword] = useState(false);

  const up = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrs((e) => ({ ...e, [k]: "" }));
    clearError();
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = "Email required";
    if (!form.password.trim()) e.password = "Password required";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setBusy(true);
    await login(form);
    setBusy(false);
    // AuthProvider's onAuthStateChanged will trigger re-render —
    // App.jsx will swap AdminLoginPage for AdminPanel automatically.
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-neutral-100"
      style={{
        backgroundImage:
          "linear-gradient(rgba(14,26,43,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(14,26,43,0.03) 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px] shadow-xl bg-neutral-50"
      >
        {/* Top accent */}
        <div className="h-[3px] bg-primary-600" />

        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 flex items-center justify-center text-white font-heading font-extrabold text-[13px] bg-primary-600"
              style={{
                clipPath:
                  "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
              }}
            >
              TJC
            </div>
            <div>
              <div className="font-heading font-bold text-[14px] text-secondary-600">
                TJC Properties
              </div>
              <div className="font-heading text-[9px] tracking-[0.16em] uppercase text-primary-600">
                Admin Access
              </div>
            </div>
          </div>

          <h1 className="font-heading font-bold text-[22px] text-secondary-600 leading-tight">
            Sign In
          </h1>
          <p className="font-body text-[13px] text-neutral-400 mt-1">
            Admin accounts only. Contact your administrator if you need access.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="px-8 pb-8 space-y-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              autoComplete="email"
              onChange={(e) => up("email", e.target.value)}
              placeholder="admin@tjcproperties.com"
              disabled={busy}
              onFocus={() => setFocusedEmail(true)}
              onBlur={() => setFocusedEmail(false)}
              className={inputCls(focusedEmail, errs.email)}
            />
            {errs.email && (
              <p className="font-body text-[11px] text-red-500">{errs.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600">
              Password
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={form.password}
                autoComplete="current-password"
                onChange={(e) => up("password", e.target.value)}
                placeholder="Your password"
                disabled={busy}
                onFocus={() => setFocusedPassword(true)}
                onBlur={() => setFocusedPassword(false)}
                className={`${inputCls(focusedPassword, errs.password)} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 bg-transparent border-none cursor-pointer"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errs.password && (
              <p className="font-body text-[11px] text-red-500">
                {errs.password}
              </p>
            )}
          </div>

          {/* Firebase error */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 px-4 py-3 border border-red-200 bg-red-50"
              >
                <ShieldAlert
                  size={14}
                  className="text-red-500 flex-shrink-0 mt-0.5"
                />
                <p className="font-body text-[13px] text-red-600">{authError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={busy}
            whileHover={!busy ? { scale: 1.02, y: -1 } : {}}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 h-12 text-white font-heading font-bold text-[12px] tracking-[0.1em] uppercase border-none cursor-pointer disabled:opacity-60 transition-colors bg-primary-600 hover:bg-primary-500 disabled:bg-neutral-400"
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <LogIn size={15} />
            )}
            {busy ? "Signing in…" : "Sign In"}
          </motion.button>
        </form>

        {/* Bottom bar */}
        <div className="h-[3px] bg-gradient-to-r from-primary-600 to-primary-400" />
      </motion.div>
    </div>
  );
}
