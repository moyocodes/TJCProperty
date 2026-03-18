// src/components/sections/Team.jsx
// Team members persisted to Firestore. Photos uploaded via Cloudinary.
//
// Collection: /team  { name, role, imgUrl, order }
//
// Add to Firestore rules:
//   match /team/{id} { allow read: if true; allow write: if isAdmin(); }
// Photos go to your Cloudinary 'yagso-products' folder via POST /api/upload.

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  Upload,
  User,
  Loader,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "../auth/AuthProvider";

// Cloudinary upload endpoint (your existing Vercel API route)
const CLOUDINARY_UPLOAD_URL = "/api/upload";

const SEED_TEAM = [
  { name: "Toyin Johnson", role: "Managing Director", imgUrl: "", order: 0 },
  { name: "Chidi Okafor", role: "Head of Sales", imgUrl: "", order: 1 },
  { name: "Amina Bello", role: "Legal Advisor", imgUrl: "", order: 2 },
  { name: "Emeka Nwosu", role: "Property Manager", imgUrl: "", order: 3 },
];

/* ─── Helpers ─── */
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionTag({ children }) {
  return (
    <div className="inline-flex items-center gap-2 text-[11px] font-heading font-bold tracking-[0.18em] uppercase mb-3 text-primary-600">
      <span className="inline-block w-5 h-px bg-primary-600" />
      {children}
    </div>
  );
}

/* ─── Upload helper — posts to Cloudinary via your API route ─── */
async function uploadTeamPhoto(file) {
  if (!file.type.startsWith("image/"))
    throw new Error("Only image files are allowed.");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success)
    throw new Error(data.message || "Upload failed");
  return data.imageUrl;
}

/* ─── Add member modal ─── */
function AddMemberModal({ onAdd, onClose }) {
  const [draft, setDraft] = useState({ name: "", role: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const valid = draft.name.trim() && draft.role.trim();

  const handleAdd = async () => {
    if (!valid) return;
    setUploading(true);
    setError("");
    try {
      const tempId = `temp_${Date.now()}`;
      let imgUrl = "";
      if (file) imgUrl = await uploadTeamPhoto(file);
      await onAdd({
        name: draft.name.trim(),
        role: draft.role.trim(),
        imgUrl,
        order: Date.now(),
      });
      onClose();
    } catch (e) {
      setError("Upload failed. Try again.");
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: "rgba(14,26,43,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px] bg-neutral-100 border border-neutral-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-neutral-200">
          <p className="font-heading font-bold text-[11px] tracking-[0.14em] uppercase text-primary-600">
            Add Team Member
          </p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-secondary-600 bg-transparent border-none cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 overflow-hidden border-2 border-dashed border-neutral-300 flex items-center justify-center bg-white cursor-pointer hover:border-primary-600 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <User size={32} className="text-neutral-300" />
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 h-7 px-3 border border-neutral-200 bg-white font-heading font-bold text-[10px] uppercase cursor-pointer text-neutral-500 hover:border-primary-600 hover:text-primary-600 transition-colors"
            >
              <Upload size={11} /> {file ? "Change Photo" : "Upload Photo"}
            </button>
          </div>

          <div>
            <label className="font-heading font-bold text-[10px] tracking-[0.12em] uppercase text-neutral-400 block mb-1.5">
              Full Name *
            </label>
            <input
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
              placeholder="e.g. Toyin Johnson"
              className="w-full border border-neutral-200 bg-white px-3 py-2.5 font-heading font-bold text-[13px] text-secondary-600 outline-none focus:border-primary-600 transition-colors"
            />
          </div>

          <div>
            <label className="font-heading font-bold text-[10px] tracking-[0.12em] uppercase text-neutral-400 block mb-1.5">
              Role / Title *
            </label>
            <input
              value={draft.role}
              onChange={(e) =>
                setDraft((d) => ({ ...d, role: e.target.value }))
              }
              placeholder="e.g. Managing Director"
              className="w-full border border-neutral-200 bg-white px-3 py-2.5 font-body text-[13px] text-secondary-600 outline-none focus:border-primary-600 transition-colors"
            />
          </div>

          {error && (
            <p className="font-body text-[11px] text-red-600">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              disabled={!valid || uploading}
              className="flex-1 h-10 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {uploading ? (
                <>
                  <Loader size={13} className="animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Plus size={13} /> Add Member
                </>
              )}
            </motion.button>
            <button
              onClick={onClose}
              className="h-10 px-4 border border-neutral-200 bg-white text-neutral-500 font-heading font-bold text-[11px] uppercase cursor-pointer hover:border-neutral-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Edit overlay on card ─── */
function EditOverlay({ member, onSave, onClose }) {
  const [draft, setDraft] = useState({ name: member.name, role: member.role });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(member.imgUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setUploading(true);
    try {
      let imgUrl = member.imgUrl;
      if (file) imgUrl = await uploadTeamPhoto(file);
      await onSave({ ...member, ...draft, imgUrl });
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 bg-secondary-600/97 flex flex-col items-center justify-center gap-2.5 px-4 py-5"
    >
      <div
        className="w-16 h-16 overflow-hidden border-2 border-white/20 cursor-pointer hover:border-primary-400 transition-colors flex items-center justify-center bg-white/10"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <User size={20} className="text-white/40" />
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1 h-6 px-2.5 border border-white/20 text-white/70 font-heading font-bold text-[9px] uppercase bg-transparent cursor-pointer hover:border-white/50 transition-colors"
      >
        <Upload size={9} /> {file ? "Change" : "Upload"}
      </button>

      <input
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        placeholder="Name"
        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 px-2 py-1.5 font-heading font-bold text-[12px] outline-none focus:border-primary-400 text-center"
      />
      <input
        value={draft.role}
        onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
        placeholder="Role"
        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 px-2 py-1.5 font-body text-[11px] outline-none focus:border-primary-400 text-center"
      />

      <div className="flex gap-2 w-full pt-1">
        <button
          onClick={handleSave}
          disabled={uploading}
          className="flex-1 h-7 bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[10px] uppercase border-none cursor-pointer flex items-center justify-center gap-1 transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <Loader size={10} className="animate-spin" />
          ) : (
            <Check size={10} />
          )}
          {uploading ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onClose}
          className="flex-1 h-7 bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-[10px] uppercase border-none cursor-pointer flex items-center justify-center gap-1 transition-colors"
        >
          <X size={10} /> Cancel
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Team card ─── */
function TeamCard({ member, isAdmin, onUpdate, onDelete, delay }) {
  const [editing, setEditing] = useState(false);

  return (
    <FadeUp delay={delay}>
      <motion.div
        whileHover={
          !editing ? { y: -6, boxShadow: "0 16px 40px rgba(0,0,0,0.1)" } : {}
        }
        transition={{ duration: 0.3 }}
        className="border border-neutral-200 overflow-hidden relative group"
      >
        {isAdmin && !editing && (
          <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditing(true)}
              className="w-6 h-6 flex items-center justify-center bg-secondary-600 text-white border-none cursor-pointer hover:bg-primary-600 transition-colors"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={onDelete}
              className="w-6 h-6 flex items-center justify-center bg-red-600 text-white border-none cursor-pointer"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}

        <div className="h-[180px] overflow-hidden relative bg-primary-50">
          {member.imgUrl ? (
            <motion.img
              src={member.imgUrl}
              alt={member.name}
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full object-cover object-top block"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={40} className="text-primary-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-secondary-600/50 to-transparent" />
        </div>

        <div className="px-4 py-4 text-center">
          <div className="font-heading font-bold text-[13px] text-secondary-600 mb-1 leading-snug">
            {member.name}
          </div>
          <div className="font-heading font-semibold text-primary-600 text-[11px] tracking-[0.06em] uppercase">
            {member.role}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400" />

        <AnimatePresence>
          {editing && (
            <EditOverlay
              member={member}
              onSave={async (updated) => {
                await onUpdate(updated);
                setEditing(false);
              }}
              onClose={() => setEditing(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </FadeUp>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function Team() {
  const { isAdmin } = useAuth();
  const [team, setTeam] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "team"), orderBy("order")),
      (snap) => {
        setTeam(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const addMember = async (data) => {
    await addDoc(collection(db, "team"), {
      ...data,
      createdAt: serverTimestamp(),
    });
  };

  const updateMember = async (updated) => {
    const { id, ...data } = updated;
    await updateDoc(doc(db, "team", id), data);
  };

  const deleteMember = async (member) => {
    // Note: Cloudinary images are not deleted here (use Cloudinary dashboard to manage storage)
    await deleteDoc(doc(db, "team", member.id));
  };

  if (loading)
    return (
      <section id="team" className="py-24 px-[5%] bg-white">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-neutral-100 animate-pulse">
              <div className="h-[180px] bg-neutral-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-neutral-200 w-3/4 mx-auto rounded" />
                <div className="h-2 bg-neutral-200 w-1/2 mx-auto rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );

  return (
    <>
      <section id="team" className="py-24 px-[5%] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <FadeUp>
            <div className="text-center mb-14">
              <div className="flex justify-center">
                <SectionTag>Our People</SectionTag>
              </div>
              <h2
                className="font-heading text-secondary-600 leading-[1.2] my-3"
                style={{
                  fontSize: "clamp(2rem, 3vw, 2.8rem)",
                  fontWeight: 400,
                }}
              >
                Meet the <em className="not-italic text-primary-600">Team</em>
              </h2>
              <p className="font-body text-neutral-400 text-[0.97rem] leading-relaxed max-w-[500px] mx-auto">
                A multidisciplinary team of professionals committed to
                excellence across every property transaction.
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <AnimatePresence>
              {team.map((m, i) => (
                <TeamCard
                  key={m.id}
                  member={m}
                  isAdmin={isAdmin}
                  delay={i * 0.08}
                  onUpdate={updateMember}
                  onDelete={() => deleteMember(m)}
                />
              ))}
            </AnimatePresence>

            {isAdmin && (
              <FadeUp delay={team.length * 0.08}>
                <motion.button
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAdd(true)}
                  className="w-full border-2 border-dashed border-neutral-200 hover:border-primary-400 transition-colors cursor-pointer bg-transparent flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-primary-600"
                  style={{ minHeight: 260 }}
                >
                  <div className="w-10 h-10 flex items-center justify-center border-2 border-dashed border-current">
                    <Plus size={18} />
                  </div>
                  <span className="font-heading font-bold text-[10px] tracking-[0.14em] uppercase">
                    Add Member
                  </span>
                </motion.button>
              </FadeUp>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showAdd && (
          <AddMemberModal onAdd={addMember} onClose={() => setShowAdd(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
