// src/components/listings/EnquiryModal.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, CheckCircle, LogIn } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { useListings } from "../../auth/ListingsProvider";


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
  success:    "#16A34A",
  successLt:  "#ECFDF3",
};

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase" style={{ color: T.navy }}>
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="font-body text-[11px]" style={{ color: T.danger }}>{error}</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const baseInput = (focused, error) => ({
  width: "100%", background: T.white, fontFamily: "inherit", fontSize: 14,
  outline: "none", padding: "0.65rem 1rem", color: T.navy,
  border: `1px solid ${error ? T.danger : focused ? T.primary : T.border}`,
  transition: "border-color 0.2s",
});

function TInput({ value, onChange, placeholder, disabled, error }) {
  const [f, setF] = useState(false);
  return <input value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
    onFocus={() => setF(true)} onBlur={() => setF(false)}
    style={{ ...baseInput(f, error), opacity: disabled ? 0.6 : 1 }} />;
}

function TTextarea({ value, onChange, placeholder, rows = 4, disabled, error }) {
  const [f, setF] = useState(false);
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    disabled={disabled}
    onFocus={() => setF(true)} onBlur={() => setF(false)}
    style={{ ...baseInput(f, error), resize: "vertical", opacity: disabled ? 0.6 : 1 }} />;
}

export default function EnquiryModal({ listing, onClose, onRequireAuth }) {
  const { user } = useAuth();
  const { submitEnquiry } = useListings();

  const [step,  setStep]  = useState("form");
  const [busy,  setBusy]  = useState(false);
  const [errs,  setErrs]  = useState({});
  const [form, setForm] = useState({
    contact: user?.email || "",
    message: `Hi, I'm interested in the ${listing.name} at ${listing.location}. Please get in touch.`,
  });

  const up = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrs(e => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.contact.trim()) e.contact = "Phone or email required";
    if (!form.message.trim()) e.message = "Please write a message";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!user) { onClose(); onRequireAuth(); return; }
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setBusy(true);
    try {
      await submitEnquiry({
        listingId:   listing.id,
        listingName: listing.name,
        message:     form.message,
        contact:     form.contact,
      });
      setStep("success");
    } catch (err) {
      console.error(err);
      setErrs({ message: "Failed to send. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center px-4"
        style={{ background: "rgba(14,26,43,0.65)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px] relative overflow-hidden shadow-2xl"
          style={{ background: T.bg }}
          onClick={e => e.stopPropagation()}
        >
          <div className="h-[3px]" style={{ background: T.primary }} />

          {/* Grid texture */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "linear-gradient(rgba(14,26,43,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(14,26,43,0.03) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }} />

          {/* Header */}
          <div className="relative px-6 pt-5 pb-4 border-b" style={{ borderColor: T.border }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-[10px] tracking-[0.18em] uppercase" style={{ color: T.primary }}>
                  Property Enquiry
                </p>
                <h3 className="font-heading font-bold mt-1 truncate" style={{ fontSize: 17, color: T.navy }}>
                  {listing.name}
                </h3>
                <p className="font-body text-[12px] mt-0.5" style={{ color: T.muted }}>📍 {listing.location}</p>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer flex-shrink-0"
                style={{ color: T.muted }}>
                <X size={16} />
              </motion.button>
            </div>

            {/* Listing thumbnail row */}
            {listing.image && (
              <div className="mt-3 flex items-center gap-3 p-3 border" style={{ borderColor: T.border, background: T.white }}>
                <img src={listing.image} alt={listing.name} className="w-14 h-14 object-cover flex-shrink-0" />
                <div>
                  {listing.priceLabel && (
                    <div className="font-heading font-bold text-[14px]" style={{ color: T.primary }}>{listing.priceLabel}</div>
                  )}
                  <div className="font-body text-[11px] mt-0.5" style={{ color: T.muted }}>
                    {listing.units} {listing.units === 1 ? "unit" : "units"} available
                  </div>
                  <span className="inline-block mt-1 text-[9px] font-heading font-bold tracking-widest uppercase px-2 py-0.5 text-white"
                    style={{ background: listing.status === "available" ? T.primary : "#6B7280" }}>
                    {listing.status || "available"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="relative px-6 py-5">
            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.form key="form" onSubmit={handleSubmit}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-4">
                  {/* Not logged in notice */}
                  {!user && (
                    <div className="flex items-start gap-3 px-4 py-3 border" style={{ background: T.primaryLt, borderColor: "#F5D4C7" }}>
                      <LogIn size={14} style={{ color: T.primary, flexShrink: 0, marginTop: 2 }} />
                      <p className="font-body text-[13px]" style={{ color: T.navy }}>
                        <strong className="font-heading">Sign in required</strong> — you'll be prompted to log in before sending.
                      </p>
                    </div>
                  )}

                  <Field label="Your Phone or Email" error={errs.contact}>
                    <TInput value={form.contact} onChange={e => up("contact", e.target.value)}
                      placeholder="+234 800 000 0000 or email" disabled={busy} error={errs.contact} />
                  </Field>

                  <Field label="Message" error={errs.message}>
                    <TTextarea value={form.message} onChange={e => up("message", e.target.value)}
                      rows={4} disabled={busy} error={errs.message} />
                  </Field>

                  <motion.button type="submit" disabled={busy}
                    whileHover={!busy ? { scale: 1.02, y: -1 } : {}} whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 h-11 text-white font-heading font-bold text-[12px] tracking-[0.1em] uppercase border-none cursor-pointer disabled:opacity-60 transition-colors duration-300"
                    style={{ background: busy ? T.muted : T.primary }}
                    onMouseEnter={e => { if (!busy) e.currentTarget.style.background = T.primaryHov; }}
                    onMouseLeave={e => { if (!busy) e.currentTarget.style.background = busy ? T.muted : T.primary; }}>
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {busy ? "Sending…" : user ? "Send Enquiry" : "Sign In & Send"}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div key="success"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 mx-auto mb-5 flex items-center justify-center"
                    style={{ background: "#ECFDF3" }}>
                    <CheckCircle size={30} style={{ color: T.success }} />
                  </motion.div>
                  <h3 className="font-heading font-bold text-xl" style={{ color: T.navy }}>Enquiry Sent!</h3>
                  <p className="font-body text-[14px] mt-2 leading-relaxed" style={{ color: T.muted }}>
                    The TJC team will reach out to <strong style={{ color: T.navy }}>{form.contact}</strong> shortly.
                  </p>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClose}
                    className="mt-6 h-10 px-7 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none cursor-pointer"
                    style={{ background: T.primary }}>
                    Close
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
