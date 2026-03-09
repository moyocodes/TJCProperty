// src/components/admin/AdminPanel.jsx
// Full-page admin panel. Reached via /admin route.
// Import paths fixed: db, useListings, useAuth all corrected.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox, Users, UserPlus, ChevronDown, ChevronUp,
  Check, Archive, Trash2, Search, Loader2,
  Eye, EyeOff, Shield, ShieldOff, Calendar,
  RefreshCw, ArrowLeft, MessageSquare,
} from "lucide-react";
import {
  collection, onSnapshot, query, orderBy,
  doc, updateDoc, deleteDoc,
} from "firebase/firestore";
import { db }           from "../components/firebase";        // ← fixed
import { useListings }  from "../auth/ListingsProvider"; // ← fixed
import { useAuth }      from "../auth/AuthProvider";       // ← fixed

// ── Shared primitives ────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600">
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="font-body text-[11px] text-red-500">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = "w-full bg-neutral-50 border border-neutral-200 text-secondary-600 font-body text-[13px] px-4 py-2.5 outline-none transition-colors focus:border-primary-600 placeholder:text-neutral-400";

function TInput({ value, onChange, placeholder, type = "text", error, disabled, rightSlot }) {
  return (
    <div className="relative">
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        disabled={disabled}
        className={`${inputCls} ${error ? "border-red-400" : ""} ${disabled ? "opacity-60" : ""} ${rightSlot ? "pr-10" : ""}`} />
      {rightSlot && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>}
    </div>
  );
}

function NavTab({ id, label, icon, badge, active, onClick }) {
  return (
    <button onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-5 py-3.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-b-2 transition-all cursor-pointer whitespace-nowrap
        ${active ? "border-primary-600 text-primary-600 bg-primary-50" : "border-transparent text-neutral-400 hover:text-secondary-600 bg-transparent"}`}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge > 0 && (
        <span className="min-w-[18px] h-[18px] flex items-center justify-center font-bold text-[9px] px-1 text-white bg-primary-600">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function ActionBtn({ icon, label, cls, onClick }) {
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onClick}
      className={`flex items-center gap-1.5 h-8 px-3 border font-heading font-bold text-[10px] uppercase cursor-pointer transition-colors ${cls}`}>
      {icon} {label}
    </motion.button>
  );
}

const fmt = (ts) => ts?.toDate?.()?.toLocaleDateString("en-GB", {
  day: "numeric", month: "short", year: "numeric",
}) || "—";

// ══════════════════════════════════════════════════════════════
// ENQUIRIES VIEW
// ══════════════════════════════════════════════════════════════
function EnquiriesView() {
  const { enquiries, updateEnquiryStatus, deleteEnquiry } = useListings();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [open,   setOpen]   = useState(null);

  const counts = {
    all:    enquiries.length,
    new:    enquiries.filter((e) => e.status === "new").length,
    read:   enquiries.filter((e) => e.status === "read").length,
    closed: enquiries.filter((e) => e.status === "closed").length,
  };

  const filtered = enquiries.filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    const q = search.toLowerCase();
    return !q || [e.userName, e.userEmail, e.listingName, e.message, e.contact]
      .some((v) => v?.toLowerCase().includes(q));
  });

  const STATUS_CLS = {
    new:    "bg-yellow-50 text-yellow-800",
    read:   "bg-neutral-100 text-neutral-500",
    closed: "bg-green-50 text-green-700",
  };

  return (
    <div className="space-y-5">
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, listing…"
            className={`${inputCls} pl-9`} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "new", "read", "closed"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 font-heading font-bold text-[10px] uppercase tracking-wide border cursor-pointer transition-colors
                ${filter === f
                  ? "bg-primary-600 text-white border-primary-600"
                  : "bg-white text-neutral-400 border-neutral-200 hover:border-primary-600 hover:text-primary-600"}`}>
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Inbox size={28} className="text-neutral-200 mx-auto mb-3" />
          <p className="font-heading font-semibold text-[13px] text-neutral-400">No enquiries found</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((eq) => (
          <motion.div key={eq.id} layout className="border border-neutral-200 bg-white">
            <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
              onClick={() => setOpen(open === eq.id ? null : eq.id)}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${eq.status === "new" ? "bg-primary-600" : "bg-transparent"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-bold text-[13px] text-secondary-600">{eq.userName}</span>
                  <span className="font-body text-[11px] text-neutral-400">{eq.userEmail}</span>
                  <span className={`px-2 py-0.5 font-heading font-bold text-[9px] tracking-widest uppercase ${STATUS_CLS[eq.status] || STATUS_CLS.new}`}>
                    {eq.status}
                  </span>
                </div>
                <p className="font-heading font-semibold text-[12px] mt-0.5 text-primary-600">Re: {eq.listingName}</p>
                <p className="font-body text-[11px] mt-0.5 truncate text-neutral-400">{eq.message}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-body text-[10px] text-neutral-400 hidden sm:inline">{fmt(eq.createdAt)}</span>
                {open === eq.id ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
              </div>
            </div>

            <AnimatePresence>
              {open === eq.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  <div className="px-4 pb-4 pt-3 border-t border-neutral-200 space-y-3">
                    <p className="font-body text-[13px] leading-relaxed text-secondary-600 whitespace-pre-wrap bg-neutral-100 p-3">
                      {eq.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-[11px] uppercase text-neutral-400">Contact:</span>
                      <span className="font-body text-[13px] text-secondary-600">{eq.contact}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap pt-1">
                      {eq.status !== "read" && (
                        <ActionBtn icon={<Check size={11} />} label="Mark Read"
                          cls="bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-neutral-400"
                          onClick={() => updateEnquiryStatus(eq.id, "read")} />
                      )}
                      {eq.status !== "closed" && (
                        <ActionBtn icon={<Archive size={11} />} label="Close"
                          cls="bg-green-50 border-green-200 text-green-700 hover:border-green-400"
                          onClick={() => updateEnquiryStatus(eq.id, "closed")} />
                      )}
                      {eq.status !== "new" && (
                        <ActionBtn icon={<RefreshCw size={11} />} label="Reopen"
                          cls="bg-yellow-50 border-yellow-200 text-yellow-800 hover:border-yellow-400"
                          onClick={() => updateEnquiryStatus(eq.id, "new")} />
                      )}
                      <ActionBtn icon={<Trash2 size={11} />} label="Delete"
                        cls="bg-red-50 border-red-200 text-red-600 hover:border-red-400 ml-auto"
                        onClick={async () => { if (confirm("Delete this enquiry?")) await deleteEnquiry(eq.id); }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// USERS VIEW
// ══════════════════════════════════════════════════════════════
function UsersView() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [busy,    setBusy]    = useState(null);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || [u.displayName, u.email].some((v) => v?.toLowerCase().includes(q));
  });

  const toggleAdmin = async (u) => {
    setBusy(u.uid);
    await updateDoc(doc(db, "users", u.uid), { isAdmin: !u.isAdmin }).finally(() => setBusy(null));
  };

  const deleteUser = async (u) => {
    if (!confirm(`Remove ${u.displayName || u.email}?`)) return;
    setBusy(u.uid);
    await deleteDoc(doc(db, "users", u.uid)).finally(() => setBusy(null));
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…" className={`${inputCls} pl-9`} />
      </div>

      {loading ? (
        <p className="text-center py-10 font-body text-[13px] text-neutral-400">Loading users…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-10 font-body text-[13px] text-neutral-400">No users found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <motion.div key={u.id} layout
              className="flex items-center gap-3 p-4 border border-neutral-200 bg-white">
              <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 text-white font-heading font-bold text-[13px]
                ${u.isAdmin ? "bg-primary-600" : "bg-secondary-600"}`}>
                {(u.displayName || u.email || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-bold text-[13px] text-secondary-600 truncate">{u.displayName || "—"}</span>
                  {u.isAdmin && (
                    <span className="text-[9px] font-heading font-bold tracking-widest uppercase px-1.5 py-0.5 text-white bg-primary-600">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap mt-0.5">
                  <span className="font-body text-[11px] text-neutral-400">{u.email}</span>
                  <span className="font-body text-[10px] text-neutral-300 flex items-center gap-1">
                    <Calendar size={10} /> {fmt(u.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => toggleAdmin(u)} disabled={busy === u.uid}
                  title={u.isAdmin ? "Remove admin" : "Make admin"}
                  className={`w-8 h-8 flex items-center justify-center border cursor-pointer disabled:opacity-50 transition-colors
                    ${u.isAdmin
                      ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                      : "bg-white border-neutral-200 text-neutral-400 hover:border-primary-600 hover:text-primary-600"}`}>
                  {busy === u.uid ? <Loader2 size={12} className="animate-spin" /> : u.isAdmin ? <ShieldOff size={13} /> : <Shield size={13} />}
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => deleteUser(u)} disabled={busy === u.uid}
                  className="w-8 h-8 flex items-center justify-center border border-neutral-200 bg-white text-neutral-400 cursor-pointer disabled:opacity-50 hover:border-red-400 hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <p className="font-body text-[11px] text-neutral-400">
        {filtered.length} {filtered.length === 1 ? "user" : "users"} · Shield icon toggles admin access
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CREATE ACCOUNT VIEW
// ══════════════════════════════════════════════════════════════
function CreateAccountView() {
  const { createUser } = useAuth();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", isAdmin: false });
  const [errs, setErrs] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const up = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrs((e) => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.displayName.trim()) e.displayName = "Name required";
    if (!form.email.trim())       e.email       = "Email required";
    if (form.password.length < 6) e.password    = "Min 6 characters";
    return e;
  };

  const handleCreate = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setBusy(true);
    const res = await createUser(form);
    setBusy(false);
    if (res.success) {
      setDone({ name: form.displayName, email: form.email });
      setForm({ displayName: "", email: "", password: "", isAdmin: false });
    } else {
      setErrs({ _global: res.error });
    }
  };

  return (
    <div className="max-w-[500px]">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="border border-neutral-200 bg-white p-6 text-center space-y-3">
            <div className="w-12 h-12 mx-auto flex items-center justify-center bg-green-50">
              <Check size={22} className="text-green-600" />
            </div>
            <h3 className="font-heading font-bold text-[16px] text-secondary-600">Account Created</h3>
            <p className="font-body text-[13px] text-neutral-400">
              <strong className="text-secondary-600">{done.name}</strong> ({done.email}) can now sign in.
            </p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setDone(null)}
              className="h-9 px-6 font-heading font-bold text-[11px] uppercase text-white bg-primary-600 hover:bg-primary-500 border-none cursor-pointer transition-colors">
              Create Another
            </motion.button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleCreate}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="border border-neutral-200 bg-white p-6 space-y-4">
            <div className="mb-1">
              <p className="font-heading font-bold text-[11px] tracking-[0.14em] uppercase text-primary-600">New Account</p>
              <p className="font-body text-[13px] mt-1 text-neutral-400">
                Only admins can create accounts. New users receive login credentials directly.
              </p>
            </div>

            {errs._global && (
              <div className="px-4 py-3 border border-red-200 bg-red-50 font-body text-[13px] text-red-600">
                {errs._global}
              </div>
            )}

            <Field label="Full Name" error={errs.displayName}>
              <TInput value={form.displayName} onChange={(e) => up("displayName", e.target.value)}
                placeholder="Jane Doe" error={errs.displayName} disabled={busy} />
            </Field>
            <Field label="Email Address" error={errs.email}>
              <TInput type="email" value={form.email} onChange={(e) => up("email", e.target.value)}
                placeholder="jane@example.com" error={errs.email} disabled={busy} />
            </Field>
            <Field label="Password" error={errs.password}>
              <TInput type={show ? "text" : "password"} value={form.password}
                onChange={(e) => up("password", e.target.value)}
                placeholder="Min 6 characters" error={errs.password} disabled={busy}
                rightSlot={
                  <button type="button" onClick={() => setShow((v) => !v)}
                    className="text-neutral-400 hover:text-secondary-600 bg-transparent border-none cursor-pointer">
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                } />
            </Field>

            {/* Admin toggle */}
            <div className={`flex items-center justify-between px-4 py-3 border cursor-pointer transition-colors
              ${form.isAdmin ? "bg-primary-50 border-primary-200" : "bg-neutral-100 border-neutral-200"}`}
              onClick={() => up("isAdmin", !form.isAdmin)}>
              <div className="flex items-center gap-2">
                <Shield size={14} className={form.isAdmin ? "text-primary-600" : "text-neutral-400"} />
                <div>
                  <p className="font-heading font-bold text-[12px] text-secondary-600">Grant Admin Access</p>
                  <p className="font-body text-[11px] text-neutral-400">Can manage listings, enquiries and users</p>
                </div>
              </div>
              <div className={`w-10 h-5 flex items-center px-0.5 transition-colors ${form.isAdmin ? "bg-primary-600" : "bg-neutral-200"}`}>
                <motion.div animate={{ x: form.isAdmin ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-4 h-4 bg-white" />
              </div>
            </div>

            <motion.button type="submit" disabled={busy}
              whileHover={!busy ? { scale: 1.02, y: -1 } : {}} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 h-11 text-white font-heading font-bold text-[12px] tracking-[0.1em] uppercase border-none cursor-pointer transition-colors disabled:opacity-60 bg-primary-600 hover:bg-primary-500 disabled:bg-neutral-400">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              {busy ? "Creating…" : "Create Account"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════
export default function AdminPanel({ onBack }) {
  const [view, setView] = useState("enquiries");
  const { enquiries }   = useListings();
  const { logout }      = useAuth();
  const newCount = enquiries.filter((e) => e.status === "new").length;

  const tabs = [
    { id: "enquiries", label: "Enquiries",      icon: <Inbox size={14} />,    badge: newCount },
    { id: "users",     label: "Users",           icon: <Users size={14} />,    badge: 0 },
    { id: "create",    label: "Create Account",  icon: <UserPlus size={14} />, badge: 0 },
  ];

  return (
    <section className="min-h-screen bg-neutral-100 py-20">
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-neutral-100">

      <div className="h-[3px] bg-primary-600" />

      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-5 sm:px-8 py-4">
        <div className="max-w-[1000px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }} onClick={onBack}
                className="flex items-center gap-1.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase text-neutral-400 hover:text-primary-600 bg-transparent border-none cursor-pointer transition-colors">
                <ArrowLeft size={13} /> Back to site
              </motion.button>
            )}
            <div className="flex items-center gap-3">
              
              <div>
                <h1 className="font-heading font-bold text-[15px] text-secondary-600">Admin Panel</h1>
                <p className="font-body text-[11px] text-neutral-400">TJC Properties management</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {newCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200">
                <MessageSquare size={13} className="text-primary-600" />
                <span className="font-heading font-bold text-[11px] text-primary-600">
                  {newCount} new {newCount === 1 ? "enquiry" : "enquiries"}
                </span>
              </div>
            )}
            {/* Sign out */}
            <button onClick={logout}
              className="font-heading font-bold text-[11px] uppercase tracking-wide text-neutral-400 hover:text-red-500 bg-transparent border-none cursor-pointer transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-white border-b border-neutral-200 px-5 sm:px-8">
        <div className="max-w-[1000px] mx-auto flex overflow-x-auto">
          {tabs.map((t) => <NavTab key={t.id} {...t} active={view === t.id} onClick={setView} />)}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1000px] mx-auto px-5 sm:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={view}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {view === "enquiries" && <EnquiriesView />}
            {view === "users"     && <UsersView />}
            {view === "create"    && <CreateAccountView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
    </section>
  );
}
