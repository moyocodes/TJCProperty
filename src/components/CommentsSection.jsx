// src/components/blog/CommentsSection.jsx
// Public: add a comment (name + message, email optional).
// Admin: approve / reject / delete / edit any comment.
// Stored in Firestore: blogs/{blogId}/comments (subcollection).

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  MessageSquare,
  Send,
  Trash2,
  Pencil,
  Check,
  X,
  ShieldCheck,
  Clock,
  AlertCircle,
  ChevronDown,
  ThumbsUp,
  Flag,
} from "lucide-react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "../auth/AuthProvider";

/* ── helpers ──────────────────────────────────────────────── */
function timeAgo(ts) {
  if (!ts) return "";
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return ts.toDate().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function avatar(name = "") {
  return name.trim().charAt(0).toUpperCase() || "?";
}

/* deterministic colour from name string */
const AVATAR_COLOURS = [
  "#9F4325",
  "#0E1A2B",
  "#2D6A4F",
  "#6B4226",
  "#1C4E80",
  "#7B2D8B",
  "#C05621",
  "#2C5F2E",
  "#1A365D",
  "#742A2A",
];
function avatarColour(name = "") {
  let n = 0;
  for (const c of name) n = (n + c.charCodeAt(0)) % AVATAR_COLOURS.length;
  return AVATAR_COLOURS[n];
}

function FadeUp({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMMENT FORM  (public)
══════════════════════════════════════════════════════════ */
function CommentForm({ blogId, onSubmitted }) {
  const { user } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Pre-fill from auth user if signed in
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: f.name || user.displayName || user.email?.split("@")[0] || "",
        email: f.email || user.email || "",
      }));
    }
  }, [user]);

  const up = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!form.message.trim()) e.message = "Message cannot be empty";
    if (form.message.trim().length < 5)
      e.message = "Too short — say a little more!";
    return e;
  };

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, "blogs", blogId, "comments"), {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        approved: false, // needs admin approval before showing
        uid: user?.uid || null,
        createdAt: serverTimestamp(),
        likes: 0,
      });
      setDone(true);
      setForm({ name: form.name, email: form.email, message: "" });
      onSubmitted?.();
    } catch (err) {
      console.error(err);
      setErrors({ _global: "Failed to post comment. Try again." });
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-start gap-4 p-5 border border-green-200 bg-green-50"
      >
        <div className="w-8 h-8 flex items-center justify-center bg-green-500 flex-shrink-0 mt-0.5">
          <Check size={14} className="text-white" />
        </div>
        <div>
          <p className="font-heading font-bold text-[13px] text-green-800">
            Comment submitted!
          </p>
          <p className="font-body text-[12px] text-green-700 mt-0.5">
            Your comment is awaiting moderation and will appear once approved.
          </p>
          <button
            onClick={() => setDone(false)}
            className="mt-2 font-heading font-bold text-[10px] uppercase tracking-widest text-green-700 hover:text-green-900 bg-transparent border-none cursor-pointer transition-colors"
          >
            Leave another comment →
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {errors._global && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200">
          <AlertCircle size={14} className="text-red-600 flex-shrink-0" />
          <p className="font-body text-[13px] text-red-700">{errors._global}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <input
            value={form.name}
            onChange={(e) => up("name", e.target.value)}
            placeholder="Your name *"
            className={`w-full bg-white border outline-none px-4 py-3 font-body text-[14px] text-secondary-600 transition-colors ${errors.name ? "border-red-400" : "border-neutral-200 focus:border-primary-600"}`}
          />
          {errors.name && (
            <p className="font-body text-[11px] text-red-600 mt-1">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <input
            value={form.email}
            onChange={(e) => up("email", e.target.value)}
            placeholder="Email (optional, not shown)"
            className="w-full bg-white border border-neutral-200 focus:border-primary-600 outline-none px-4 py-3 font-body text-[14px] text-secondary-600 transition-colors"
          />
        </div>
      </div>

      <div>
        <textarea
          value={form.message}
          onChange={(e) => up("message", e.target.value)}
          placeholder="Share your thoughts on this article…"
          rows={4}
          className={`w-full bg-white border outline-none px-4 py-3 font-body text-[14px] text-secondary-600 resize-y transition-colors ${errors.message ? "border-red-400" : "border-neutral-200 focus:border-primary-600"}`}
        />
        {errors.message && (
          <p className="font-body text-[11px] text-red-600 mt-1">
            {errors.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="font-body text-[11px] text-neutral-400 flex items-center gap-1.5">
          <Clock size={11} /> Comments are reviewed before publishing
        </p>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={saving}
          className={`flex items-center gap-2 h-10 px-6 text-white font-heading font-bold text-[11px] uppercase tracking-[0.08em] border-none cursor-pointer disabled:opacity-60 transition-colors ${saving ? "bg-neutral-400" : "bg-primary-600 hover:bg-primary-500"}`}
        >
          {saving ? (
            "Posting…"
          ) : (
            <>
              <Send size={12} /> Post Comment
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SINGLE COMMENT  (admin controls inline)
══════════════════════════════════════════════════════════ */
function CommentItem({ comment, blogId, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.message);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const ref = doc(db, "blogs", blogId, "comments", comment.id);

  const approve = async () => {
    await updateDoc(ref, { approved: true });
  };

  const reject = async () => {
    await updateDoc(ref, { approved: false });
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    await updateDoc(ref, {
      message: editText.trim(),
      editedAt: serverTimestamp(),
    });
    setSaving(false);
    setEditing(false);
  };

  const del = async () => {
    await deleteDoc(ref);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className={`relative group border transition-colors ${
        !comment.approved && isAdmin
          ? "border-amber-200 bg-amber-50"
          : "border-neutral-200 bg-white"
      }`}
    >
      {/* Pending banner */}
      {!comment.approved && isAdmin && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <Clock size={11} className="text-amber-600 flex-shrink-0" />
          <p className="font-heading font-bold text-[9px] tracking-[0.16em] uppercase text-amber-600">
            Awaiting Approval
          </p>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center font-heading font-bold text-[14px] text-white"
              style={{ background: avatarColour(comment.name) }}
            >
              {avatar(comment.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-heading font-bold text-[13px] text-secondary-600 truncate">
                  {comment.name}
                </p>
                {comment.uid && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-primary-50 border border-primary-100">
                    <ShieldCheck size={8} className="text-primary-600" />
                    <span className="font-heading font-bold text-[8px] uppercase tracking-widest text-primary-600">
                      Verified
                    </span>
                  </span>
                )}
              </div>
              <p className="font-body text-[11px] text-neutral-400">
                {timeAgo(comment.createdAt)}
              </p>
            </div>
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Approve / reject toggle */}
              {comment.approved ? (
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={reject}
                  title="Reject (hide)"
                  className="w-7 h-7 flex items-center justify-center text-amber-600 bg-amber-50 hover:bg-amber-100 border-none cursor-pointer transition-colors"
                >
                  <Flag size={11} />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={approve}
                  title="Approve"
                  className="w-7 h-7 flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-100 border-none cursor-pointer transition-colors"
                >
                  <Check size={11} />
                </motion.button>
              )}

              {/* Edit */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setEditing((v) => !v);
                  setEditText(comment.message);
                }}
                className="w-7 h-7 flex items-center justify-center text-secondary-600 bg-neutral-100 hover:bg-neutral-200 border-none cursor-pointer transition-colors"
              >
                <Pencil size={11} />
              </motion.button>

              {/* Delete */}
              <AnimatePresence mode="wait">
                {confirmDel ? (
                  <motion.button
                    key="sure"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    onClick={del}
                    className="flex items-center gap-1 px-2 h-7 text-white font-heading font-bold text-[9px] uppercase bg-red-700 border-none cursor-pointer"
                  >
                    <Check size={9} /> Sure?
                  </motion.button>
                ) : (
                  <motion.button
                    key="del"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setConfirmDel(true)}
                    className="w-7 h-7 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 border-none cursor-pointer transition-colors"
                  >
                    <Trash2 size={11} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Message / edit input */}
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full bg-white border border-primary-600 focus:border-primary-500 outline-none px-3 py-2 font-body text-[14px] text-secondary-600 resize-y transition-colors"
              />
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex items-center gap-1.5 h-8 px-4 text-white font-heading font-bold text-[10px] uppercase bg-primary-600 hover:bg-primary-500 border-none cursor-pointer disabled:opacity-60 transition-colors"
                >
                  <Check size={11} /> {saving ? "Saving…" : "Save"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 h-8 px-4 font-heading font-bold text-[10px] uppercase text-neutral-500 bg-white border border-neutral-200 cursor-pointer hover:border-neutral-400 transition-colors"
                >
                  <X size={11} /> Cancel
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="msg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-body text-[14px] leading-relaxed text-secondary-600"
            >
              {comment.message}
              {comment.editedAt && (
                <span className="ml-2 font-body text-[10px] text-neutral-400 italic">
                  (edited)
                </span>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT — CommentsSection
══════════════════════════════════════════════════════════ */
export default function CommentsSection({ blogId }) {
  const { isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!blogId) return;
    const q = query(
      collection(db, "blogs", blogId, "comments"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [blogId]);

  // Public sees only approved; admin sees all
  const visible = isAdmin ? comments : comments.filter((c) => c.approved);
  const pending = comments.filter((c) => !c.approved);
  const INITIAL_CAP = 5;
  const displayed = showAll ? visible : visible.slice(0, INITIAL_CAP);
  const hasMore = visible.length > INITIAL_CAP && !showAll;

  return (
    <section className="mt-14">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="inline-block w-4 h-px bg-primary-600" />
            <p className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase text-primary-600">
              Discussion
            </p>
          </div>
          <h3 className="font-heading font-bold text-xl text-secondary-600 flex items-center gap-2">
            <MessageSquare size={18} className="text-primary-600" />
            Comments
            {visible.length > 0 && (
              <span className="font-body text-[13px] font-normal text-neutral-400">
                ({visible.length})
              </span>
            )}
          </h3>
        </div>

        {/* Admin: pending badge */}
        {isAdmin && pending.length > 0 && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200"
          >
            <Clock size={13} className="text-amber-600" />
            <span className="font-heading font-bold text-[11px] text-amber-700">
              {pending.length} pending approval
            </span>
          </motion.div>
        )}
      </div>

      {/* ── Comments list ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse border border-neutral-200 bg-white p-5"
            >
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-neutral-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-neutral-200 w-1/4" />
                  <div className="h-3 bg-neutral-200 w-full" />
                  <div className="h-3 bg-neutral-200 w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10 border border-neutral-200 bg-white"
        >
          <MessageSquare size={28} className="text-neutral-300 mx-auto mb-3" />
          <p className="font-heading font-bold text-[15px] text-secondary-600">
            No comments yet
          </p>
          <p className="font-body text-[13px] mt-1 text-neutral-400">
            Be the first to share your thoughts.
          </p>
        </motion.div>
      ) : (
        <>
          <div className="space-y-3">
            <AnimatePresence>
              {displayed.map((c, i) => (
                <FadeUp key={c.id} delay={i * 0.04}>
                  <CommentItem comment={c} blogId={blogId} isAdmin={isAdmin} />
                </FadeUp>
              ))}
            </AnimatePresence>
          </div>

          {/* Show more */}
          {hasMore && (
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAll(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 h-10 border border-neutral-200 bg-white font-heading font-bold text-[11px] uppercase text-neutral-500 hover:border-primary-600 hover:text-primary-600 cursor-pointer transition-colors"
            >
              Show {visible.length - INITIAL_CAP} more comment
              {visible.length - INITIAL_CAP !== 1 ? "s" : ""}
              <ChevronDown size={13} />
            </motion.button>
          )}
        </>
      )}

      {/* ── Add comment form ── */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-neutral-200" />
          <p className="font-heading font-bold text-[11px] tracking-[0.16em] uppercase text-neutral-400">
            Leave a Comment
          </p>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>
        <CommentForm blogId={blogId} />
      </div>
    </section>
  );
}
