// src/auth/AuthModal.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "./AuthProvider";

const T = {
  primary:    "#9F4325",
  primaryHov: "#D97C5C",
  primaryLt:  "#FBEAE2",
  navy:       "#0E1A2B",
  bg:         "#F5F4F1",
  border:     "#E5E0D8",
  muted:      "#7A7A7A",
  white:      "#FFFFFF",
  danger:     "#B91C1C",
};

/* ── Primitive field wrapper ── */
function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase" style={{ color: T.navy }}>
        {label}{required && <span className="ml-1" style={{ color: T.primary }}>*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="font-body text-[11px]" style={{ color: T.danger }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Shared input style ── */
function Input({ type = "text", value, onChange, placeholder, disabled, autoComplete, error, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        disabled={disabled} autoComplete={autoComplete}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", background: T.white, fontFamily: "inherit",
          fontSize: 14, outline: "none", padding: "0.7rem 1rem",
          paddingRight: rightSlot ? "2.8rem" : "1rem",
          border: `1px solid ${error ? T.danger : focused ? T.primary : T.border}`,
          transition: "border-color 0.2s",
          opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "text",
          color: T.navy,
        }}
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  );
}

/* ── Login form ── */
function LoginForm({ onSwitch, onSuccess }) {
  const { login, authError, clearError } = useAuth();
  const [busy, setBusy]     = useState(false);
  const [show, setShow]     = useState(false);
  const [form, setForm]     = useState({ email: "", password: "" });
  const [errs, setErrs]     = useState({});

  const up = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrs(e => ({ ...e, [k]: "" })); clearError(); };

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
    const res = await login(form);
    setBusy(false);
    if (res.success) onSuccess();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email" required error={errs.email}>
        <Input type="email" autoComplete="email" value={form.email}
          onChange={e => up("email", e.target.value)} placeholder="you@example.com"
          error={errs.email} disabled={busy} />
      </Field>

      <Field label="Password" required error={errs.password}>
        <Input type={show ? "text" : "password"} autoComplete="current-password"
          value={form.password} onChange={e => up("password", e.target.value)}
          placeholder="Your password" error={errs.password} disabled={busy}
          rightSlot={
            <button type="button" onClick={() => setShow(v => !v)}
              className="bg-transparent border-none cursor-pointer" style={{ color: T.muted }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
      </Field>

      {authError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-4 py-3 border font-body text-[13px]"
          style={{ background: "#FEF2F2", borderColor: "#FECACA", color: T.danger }}>
          {authError}
        </motion.div>
      )}

      <motion.button type="submit" disabled={busy}
        whileHover={!busy ? { scale: 1.02, y: -1 } : {}} whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 h-11 text-white font-heading font-bold text-[12px] tracking-[0.1em] uppercase border-none cursor-pointer disabled:opacity-60 transition-colors duration-300"
        style={{ background: busy ? T.muted : T.primary }}
        onMouseEnter={e => { if (!busy) e.currentTarget.style.background = T.primaryHov; }}
        onMouseLeave={e => { if (!busy) e.currentTarget.style.background = T.primary; }}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
        {busy ? "Signing in…" : "Sign In"}
      </motion.button>

      <p className="text-center font-body text-[13px]" style={{ color: T.muted }}>
        No account?{" "}
        <button type="button" onClick={onSwitch}
          className="font-heading font-bold bg-transparent border-none cursor-pointer" style={{ color: T.primary }}>
          Create one →
        </button>
      </p>
    </form>
  );
}

/* ── Register form ── */
function RegisterForm({ onSwitch, onSuccess }) {
  const { register, authError, clearError } = useAuth();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [errs, setErrs] = useState({});

  const up = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrs(e => ({ ...e, [k]: "" })); clearError(); };

  const validate = () => {
    const e = {};
    if (!form.displayName.trim())       e.displayName = "Name required";
    if (!form.email.trim())             e.email       = "Email required";
    if (form.password.length < 6)       e.password    = "Min 6 characters";
    if (form.password !== form.confirm) e.confirm     = "Passwords don't match";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setBusy(true);
    const res = await register({ email: form.email, password: form.password, displayName: form.displayName });
    setBusy(false);
    if (res.success) onSuccess();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Full Name" required error={errs.displayName}>
        <Input autoComplete="name" value={form.displayName}
          onChange={e => up("displayName", e.target.value)} placeholder="Jane Doe"
          error={errs.displayName} disabled={busy} />
      </Field>

      <Field label="Email" required error={errs.email}>
        <Input type="email" autoComplete="email" value={form.email}
          onChange={e => up("email", e.target.value)} placeholder="you@example.com"
          error={errs.email} disabled={busy} />
      </Field>

      <Field label="Password" required error={errs.password}>
        <Input type={show ? "text" : "password"} autoComplete="new-password"
          value={form.password} onChange={e => up("password", e.target.value)}
          placeholder="Min 6 characters" error={errs.password} disabled={busy}
          rightSlot={
            <button type="button" onClick={() => setShow(v => !v)}
              className="bg-transparent border-none cursor-pointer" style={{ color: T.muted }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
      </Field>

      <Field label="Confirm Password" required error={errs.confirm}>
        <Input type={show ? "text" : "password"} autoComplete="new-password"
          value={form.confirm} onChange={e => up("confirm", e.target.value)}
          placeholder="Repeat password" error={errs.confirm} disabled={busy} />
      </Field>

      {authError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-4 py-3 border font-body text-[13px]"
          style={{ background: "#FEF2F2", borderColor: "#FECACA", color: T.danger }}>
          {authError}
        </motion.div>
      )}

      <motion.button type="submit" disabled={busy}
        whileHover={!busy ? { scale: 1.02, y: -1 } : {}} whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 h-11 text-white font-heading font-bold text-[12px] tracking-[0.1em] uppercase border-none cursor-pointer disabled:opacity-60 transition-colors duration-300"
        style={{ background: busy ? T.muted : T.primary }}
        onMouseEnter={e => { if (!busy) e.currentTarget.style.background = T.primaryHov; }}
        onMouseLeave={e => { if (!busy) e.currentTarget.style.background = T.primary; }}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
        {busy ? "Creating account…" : "Create Account"}
      </motion.button>

      <p className="text-center font-body text-[13px]" style={{ color: T.muted }}>
        Have an account?{" "}
        <button type="button" onClick={onSwitch}
          className="font-heading font-bold bg-transparent border-none cursor-pointer" style={{ color: T.primary }}>
          Sign in →
        </button>
      </p>
    </form>
  );
}

/* ═══ MAIN EXPORT ═══ */
export default function AuthModal({ onClose, defaultTab = "login" }) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: "rgba(14,26,43,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] relative overflow-hidden shadow-2xl"
        style={{ background: T.bg }}
        onClick={e => e.stopPropagation()}
      >
        {/* Grid texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(14,26,43,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(14,26,43,0.03) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        {/* Top accent */}
        <div className="h-[3px]" style={{ background: T.primary }} />

        {/* Header */}
        <div className="relative px-7 pt-6 pb-4">
          {/* Logo + title */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 flex items-center justify-center text-white font-heading font-extrabold text-[13px]"
              style={{
                background: T.primary,
                clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
              }}>
              TJC
            </div>
            <div>
              <div className="font-heading font-bold text-[13px]" style={{ color: T.navy }}>TJC Properties</div>
              <div className="font-heading text-[9px] tracking-[0.14em] uppercase" style={{ color: T.primary }}>
                {tab === "login" ? "Sign in to your account" : "Create a new account"}
              </div>
            </div>
          </div>

          {/* Tab pills */}
          <div className="flex border" style={{ borderColor: T.border }}>
            {[["login", "Sign In"], ["register", "Create Account"]].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none cursor-pointer transition-colors duration-200"
                style={{ background: tab === t ? T.primary : T.white, color: tab === t ? T.white : T.muted }}>
                {label}
              </button>
            ))}
          </div>

          {/* Close */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
            style={{ color: T.muted }}>
            <X size={18} />
          </motion.button>
        </div>

        {/* Form area */}
        <div className="relative px-7 pb-7">
          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity: 0, x: tab === "login" ? -14 : 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === "login" ? 14 : -14 }}
              transition={{ duration: 0.22 }}>
              {tab === "login"
                ? <LoginForm    onSwitch={() => setTab("register")} onSuccess={onClose} />
                : <RegisterForm onSwitch={() => setTab("login")}    onSuccess={onClose} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${T.primary}, ${T.primaryHov})` }} />
      </motion.div>
    </motion.div>
  );
}
