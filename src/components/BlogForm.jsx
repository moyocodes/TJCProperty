import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  ImagePlus,
  Upload,
  Loader2,
  Trash2,
} from "lucide-react";

import { useBlog } from "../auth/BlogProvider";
import RichTextEditor from "./RichTextEditor";

/* ─────────────────────────────────────
   TJC Design Tokens
───────────────────────────────────── */
const T = {
  primary: "#9F4325",
  primaryHov: "#D97C5C",
  primaryLt: "#FBEAE2",
  navy: "#0E1A2B",
  navyLt: "#1C2A3F",
  bg: "#F5F4F1",
  white: "#FFFFFF",
  muted: "#7A7A7A",
  border: "#E5E0D8",
  text: "#0C0C0C",
  danger: "#B91C1C",
  dangerLt: "#FEF2F2",
};

const CATEGORIES = [
  "Market Insights",
  "Investment Tips",
  "Property Guide",
  "News & Updates",
  "Legal & Finance",
  "Lettings Advice",
];

/* ─────────────────────────────────────
   Primitive UI atoms
───────────────────────────────────── */
function Field({ label, required, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <label
          className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase"
          style={{ color: T.navy }}
        >
          {label}
          {required && (
            <span className="ml-1" style={{ color: T.primary }}>
              *
            </span>
          )}
        </label>
        {hint && (
          <span className="font-body text-[11px]" style={{ color: T.muted }}>
            {hint}
          </span>
        )}
      </div>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-body text-[11px]"
            style={{ color: T.danger }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const baseInput = (focused, error) => ({
  width: "100%",
  background: T.white,
  border: `1px solid ${error ? T.danger : focused ? T.primary : T.border}`,
  color: T.text,
  fontFamily: "inherit",
  fontSize: "14px",
  outline: "none",
  padding: "0.7rem 1rem",
  transition: "border-color 0.25s",
  borderRadius: 0,
});

function TInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  disabled,
  ...rest
}) {
  const [f, setF] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        ...baseInput(f, error),
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "text",
      }}
      {...rest}
    />
  );
}

function TTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  disabled,
}) {
  const [f, setF] = useState(false);
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        ...baseInput(f, error),
        resize: "vertical",
        minHeight: rows * 24,
        opacity: disabled ? 0.6 : 1,
      }}
    />
  );
}

function TSelect({ value, onChange, options, placeholder, disabled }) {
  const [f, setF] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      style={{
        ...baseInput(f, false),
        cursor: disabled ? "not-allowed" : "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239F4325' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
        paddingRight: "2.5rem",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/* ─────────────────────────────────────
   Image Upload Panel (real file upload)
───────────────────────────────────── */
function ImageUploadPanel({
  images,
  urlImage,
  onAddFiles,
  onRemoveFile,
  onUrlChange,
  disabled,
}) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (valid.length) onAddFiles(valid);
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        className="relative border-2 border-dashed transition-colors duration-200 cursor-pointer"
        style={{
          borderColor: dragging ? T.primary : T.border,
          background: dragging ? T.primaryLt : "#faf9f7",
          minHeight: 100,
        }}
        onClick={() =>
          !disabled && document.getElementById("blog-img-input").click()
        }
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          id="blog-img-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <Upload
            size={22}
            style={{ color: dragging ? T.primary : T.border }}
          />
          <p
            className="font-heading font-semibold text-[12px] tracking-wide text-center px-4"
            style={{ color: dragging ? T.primary : T.muted }}
          >
            {dragging ? "Drop images here" : "Click or drag images to upload"}
          </p>
          <p className="font-body text-[10px]" style={{ color: T.border }}>
            PNG, JPG, WEBP accepted
          </p>
        </div>
      </div>

      {/* OR URL input */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: T.border }} />
        <span
          className="font-heading font-bold text-[10px] tracking-widest uppercase"
          style={{ color: T.muted }}
        >
          or paste URL
        </span>
        <div className="flex-1 h-px" style={{ background: T.border }} />
      </div>

      <TInput
        value={urlImage}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="https://images.unsplash.com/..."
        disabled={disabled}
      />

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
          {images.map((img, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative group aspect-square overflow-hidden border"
              style={{ borderColor: T.border }}
            >
              <img
                src={typeof img === "string" ? img : img.preview}
                alt={`img-${i}`}
                className="w-full h-full object-cover"
              />
              {i === 0 && (
                <span
                  className="absolute bottom-1 left-1 text-[8px] font-heading font-bold tracking-widest uppercase text-white px-1.5 py-0.5"
                  style={{ background: T.primary }}
                >
                  Cover
                </span>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onRemoveFile(i)}
                disabled={disabled}
                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                style={{ background: "rgba(0,0,0,0.55)" }}
              >
                <X size={11} />
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────
   Live Preview Card
───────────────────────────────────── */
function PreviewCard({ form }) {
  const coverSrc = form.images?.[0]
    ? typeof form.images[0] === "string"
      ? form.images[0]
      : form.images[0].preview
    : null;

  return (
    <div
      className="border overflow-hidden"
      style={{ borderColor: T.border, background: T.white }}
    >
      <div className="relative h-40 overflow-hidden">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt="preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: T.primaryLt }}
          >
            <ImagePlus size={22} style={{ color: T.primary, opacity: 0.35 }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {form.category && (
          <span
            className="absolute top-2.5 left-2.5 text-[10px] tracking-[0.14em] uppercase font-bold px-2 py-0.5 text-white"
            style={{ background: T.primary }}
          >
            {form.category}
          </span>
        )}
        <div
          className="absolute bottom-0 left-0 right-0 h-[3px]"
          style={{ background: T.primary }}
        />
      </div>
      <div className="p-4">
        <h3
          className="font-heading font-bold text-[14px] leading-snug line-clamp-2"
          style={{ color: T.navy }}
        >
          {form.title || "Article Title"}
        </h3>
        <p
          className="font-body text-[12px] mt-1.5 line-clamp-2 leading-relaxed"
          style={{ color: T.muted }}
        >
          {form.description || "Article description will appear here…"}
        </p>
        <div
          className="mt-3 pt-3 flex items-center justify-between text-[10px]"
          style={{ borderTop: `1px solid ${T.border}` }}
        >
          <span className="font-heading font-bold" style={{ color: T.primary }}>
            {form.author || "TJC Properties"}
          </span>
          <span
            className="font-heading font-semibold tracking-widest uppercase"
            style={{ color: T.muted }}
          >
            {form.date}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════ */
export default function BlogForm({ editingBlog, onSave, onCancel }) {
  const { uploadFile } = useBlog();
  const isEditing = !!editingBlog;

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState({});

  /* imageFiles: array of { file: File, preview: string } | string (existing URL) */
  const [imageFiles, setImageFiles] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    author: "",
    category: "",
    urlImage: "", // temp URL field
    date: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  });

  /* Populate from editingBlog */
  useEffect(() => {
    if (editingBlog) {
      setForm({
        title: editingBlog.title || "",
        description: editingBlog.description || "",
        content: editingBlog.content || "",
        author: editingBlog.author || "",
        category: editingBlog.category || "",
        urlImage: "",
        date:
          editingBlog.date ||
          new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      });
      /* Seed existing images as plain strings */
      const existing =
        editingBlog.images || (editingBlog.image ? [editingBlog.image] : []);
      setImageFiles(existing.map((u) => u)); // just strings
    }
  }, [editingBlog]);

  const up = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  /* Add real files → create preview URL */
  const handleAddFiles = (files) => {
    const newEntries = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true,
    }));
    setImageFiles((prev) => [...prev, ...newEntries]);
  };

  /* URL image: press Enter or blur adds it */
  const commitUrlImage = () => {
    if (form.urlImage.trim()) {
      setImageFiles((prev) => [...prev, form.urlImage.trim()]);
      up("urlImage", "");
    }
  };

  const removeImage = (i) => {
    setImageFiles((prev) => {
      const next = [...prev];
      const entry = next[i];
      if (entry?.preview) URL.revokeObjectURL(entry.preview);
      next.splice(i, 1);
      return next;
    });
  };

  /* Normalise imageFiles for the preview card */
  const normImages = imageFiles.map((entry) =>
    typeof entry === "string" ? entry : entry.preview,
  );

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.content.trim()) errs.content = "Content is required";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = [];

      for (const entry of imageFiles) {
        if (typeof entry === "string") {
          uploadedUrls.push(entry); // already a URL
        } else if (entry?.isNew && entry?.file) {
          const url = await uploadFile(entry.file); // upload real file
          uploadedUrls.push(url);
        }
      }

      // Add pending URL image if still in field
      if (form.urlImage.trim()) uploadedUrls.push(form.urlImage.trim());

      await onSave({
        title: form.title,
        description: form.description,
        content: form.content,
        author: form.author,
        category: form.category,
        date: form.date,
        images: uploadedUrls,
        image: uploadedUrls[0] || "",
      });
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setUploading(false);
    }
  };

  /* ── Render ── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen"
      style={{ background: T.bg }}
    >
      {/* Grid texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14,26,43,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(14,26,43,0.025) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          zIndex: 0,
        }}
      />

      {/* ── Sticky top bar ── */}
      <div
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ background: "rgba(245,244,241,0.92)", borderColor: T.border }}
      >
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <motion.button
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={onCancel}
              disabled={uploading}
              className="flex items-center gap-1.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer flex-shrink-0 disabled:opacity-50"
              style={{ color: T.muted }}
              onMouseEnter={(e) => (e.currentTarget.style.color = T.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Back</span>
            </motion.button>

            <span className="hidden sm:inline" style={{ color: T.border }}>
              |
            </span>

            <div className="min-w-0">
              <p
                className="text-[10px] tracking-[0.18em] uppercase font-heading font-bold"
                style={{ color: T.primary }}
              >
                {isEditing ? "Edit Article" : "New Article"}
              </p>
              <h1
                className="font-heading font-bold leading-none mt-0.5 truncate"
                style={{ fontSize: "clamp(14px, 2vw, 18px)", color: T.navy }}
              >
                {isEditing
                  ? form.title || "Edit Article"
                  : "Create New Article"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPreview((p) => !p)}
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 border font-heading font-bold text-[10px] tracking-[0.08em] uppercase cursor-pointer transition-colors duration-200"
              style={{
                borderColor: T.border,
                background: preview ? T.primaryLt : T.white,
                color: preview ? T.primary : T.muted,
              }}
            >
              {preview ? <EyeOff size={12} /> : <Eye size={12} />}
              {preview ? "Hide" : "Preview"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={uploading}
              className="flex items-center gap-1.5 h-8 px-4 text-white font-heading font-bold text-[10px] sm:text-[11px] tracking-[0.1em] uppercase border-none cursor-pointer transition-colors duration-300 disabled:opacity-60"
              style={{ background: uploading ? T.muted : T.primary }}
              onMouseEnter={(e) => {
                if (!uploading) e.currentTarget.style.background = T.primaryHov;
              }}
              onMouseLeave={(e) => {
                if (!uploading)
                  e.currentTarget.style.background = uploading
                    ? T.muted
                    : T.primary;
              }}
            >
              {uploading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}
              <span>
                {uploading ? "Saving…" : isEditing ? "Save" : "Publish"}
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Main body ── */}
      <div
        className="relative max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12"
        style={{ zIndex: 1 }}
      >
        {/* Mobile preview toggle */}
        <div className="flex sm:hidden justify-end mb-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-1.5 h-8 px-3 border font-heading font-bold text-[10px] tracking-[0.08em] uppercase cursor-pointer transition-colors duration-200"
            style={{
              borderColor: T.border,
              background: preview ? T.primaryLt : T.white,
              color: preview ? T.primary : T.muted,
            }}
          >
            {preview ? <EyeOff size={12} /> : <Eye size={12} />}
            {preview ? "Hide Preview" : "Show Preview"}
          </motion.button>
        </div>

        {/* Mobile preview (stacked) */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="sm:hidden overflow-hidden mb-6"
            >
              <p
                className="font-heading font-bold text-[11px] tracking-widest uppercase mb-2"
                style={{ color: T.muted }}
              >
                Card Preview
              </p>
              <PreviewCard form={{ ...form, images: normImages }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two-col on desktop */}
        <div
          className={`grid gap-8 ${preview ? "sm:grid-cols-[1fr_320px]" : "grid-cols-1 sm:max-w-[720px] sm:mx-auto"}`}
        >
          {/* ── Form column ── */}
          <div className="space-y-6">
            {/* Title */}
            <Field label="Article Title" required error={errors.title}>
              <TInput
                value={form.title}
                onChange={(e) => up("title", e.target.value)}
                placeholder="e.g. Why Oke-Ado is Ibadan's Best Investment Zone"
                error={errors.title}
                disabled={uploading}
              />
            </Field>

            {/* Description */}
            <Field
              label="Short Description"
              required
              hint={`${form.description.length}/200`}
              error={errors.description}
            >
              <TTextarea
                value={form.description}
                onChange={(e) =>
                  up("description", e.target.value.slice(0, 200))
                }
                placeholder="A brief summary shown on the blog listing card…"
                rows={3}
                error={errors.description}
                disabled={uploading}
              />
            </Field>

            {/* Meta row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Category">
                <TSelect
                  value={form.category}
                  onChange={(e) => up("category", e.target.value)}
                  options={CATEGORIES}
                  placeholder="Select category"
                  disabled={uploading}
                />
              </Field>
              <Field label="Author">
                <TInput
                  value={form.author}
                  onChange={(e) => up("author", e.target.value)}
                  placeholder="TJC Properties"
                  disabled={uploading}
                />
              </Field>
              <Field label="Publish Date">
                <TInput
                  value={form.date}
                  onChange={(e) => up("date", e.target.value)}
                  placeholder="15 Jan 2025"
                  disabled={uploading}
                />
              </Field>
            </div>

            {/* Images */}
            <div
              className="border p-5"
              style={{ borderColor: T.border, background: T.white }}
            >
              <p
                className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase mb-4"
                style={{ color: T.navy }}
              >
                Images
                <span
                  className="ml-2 font-body font-normal normal-case text-[10px]"
                  style={{ color: T.muted }}
                >
                  First image becomes the cover
                </span>
              </p>
              <ImageUploadPanel
                images={imageFiles}
                urlImage={form.urlImage}
                onAddFiles={handleAddFiles}
                onRemoveFile={removeImage}
                onUrlChange={(v) => up("urlImage", v)}
                disabled={uploading}
              />
              {/* Commit URL on Enter */}
              {form.urlImage.trim() && (
                <motion.button
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={commitUrlImage}
                  className="mt-3 flex items-center gap-1.5 h-8 px-4 font-heading font-bold text-[11px] tracking-[0.08em] uppercase text-white border-none cursor-pointer"
                  style={{ background: T.primary }}
                >
                  <ImagePlus size={12} /> Add URL Image
                </motion.button>
              )}
            </div>

            {/* Rich content editor */}
            <Field
              label="Article Content"
              required
              hint={`${form.content.replace(/<[^>]*>/g, "").length} chars`}
              error={errors.content}
            >
              <div
                className="border"
                style={{ borderColor: errors.content ? T.danger : T.border }}
              >
                <RichTextEditor
                  value={form.content}
                  onChange={(v) => up("content", v)}
                  disabled={uploading}
                />
              </div>
            </Field>

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
              <motion.button
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCancel}
                disabled={uploading}
                className="flex items-center gap-1.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer disabled:opacity-50"
                style={{ color: T.muted }}
                onMouseEnter={(e) => (e.currentTarget.style.color = T.danger)}
                onMouseLeave={(e) => (e.currentTarget.style.color = T.muted)}
              >
                <X size={13} /> Discard & Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={uploading}
                className="flex items-center gap-2 h-10 px-8 text-white font-heading font-bold text-xs tracking-[0.1em] uppercase border-none cursor-pointer transition-colors duration-300 disabled:opacity-60"
                style={{ background: uploading ? T.muted : T.primary }}
                onMouseEnter={(e) => {
                  if (!uploading)
                    e.currentTarget.style.background = T.primaryHov;
                }}
                onMouseLeave={(e) => {
                  if (!uploading)
                    e.currentTarget.style.background = uploading
                      ? T.muted
                      : T.primary;
                }}
              >
                {uploading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                {uploading
                  ? "Saving…"
                  : isEditing
                    ? "Save Changes"
                    : "Publish Article"}
              </motion.button>
            </div>
          </div>

          {/* ── Desktop preview column ── */}
          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.35 }}
                className="hidden sm:block space-y-4"
              >
                <div>
                  <p
                    className="font-heading font-bold text-[11px] tracking-[0.14em] uppercase mb-2"
                    style={{ color: T.muted }}
                  >
                    Card Preview
                  </p>
                  <PreviewCard form={{ ...form, images: normImages }} />
                </div>

                {/* Tips */}
                <div
                  className="p-4 border"
                  style={{ borderColor: T.border, background: T.primaryLt }}
                >
                  <p
                    className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase mb-3"
                    style={{ color: T.primary }}
                  >
                    Writing Tips
                  </p>
                  {[
                    "Use a specific title with location or numbers.",
                    "Keep description under 160 chars for best display.",
                    "First uploaded image becomes the cover.",
                    "Write short, scannable paragraphs.",
                    "Add a clear call-to-action at the end.",
                  ].map((tip, i) => (
                    <p
                      key={i}
                      className="font-body text-[12px] leading-relaxed mb-1.5"
                      style={{ color: T.navy }}
                    >
                      <span className="mr-1" style={{ color: T.primary }}>
                        →
                      </span>
                      {tip}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
