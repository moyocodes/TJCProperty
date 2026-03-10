// src/components/blog/BlogForm.jsx
// Featured toggle added (same amber pattern as ListingForm).

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
  Star,
} from "lucide-react";
import { useBlog } from "../auth/BlogProvider";
import RichTextEditor from "./RichTextEditor";

const CATEGORIES = [
  "Market Insights",
  "Investment Tips",
  "Property Guide",
  "News & Updates",
  "Legal & Finance",
  "Lettings Advice",
];

/* ── Form primitives ─────────────────────────────────────── */
function Field({ label, required, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <label className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase text-secondary-600">
          {label}
          {required && <span className="ml-1 text-primary-600">*</span>}
        </label>
        {hint && (
          <span className="font-body text-[11px] text-neutral-500">{hint}</span>
        )}
      </div>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-body text-[11px] text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const base =
  "w-full bg-white font-[inherit] text-[14px] text-secondary-600 outline-none px-4 py-[0.7rem] border transition-colors duration-200";

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
      {...rest}
      className={`${base} ${error ? "border-red-500" : f ? "border-primary-600" : "border-neutral-200"} ${disabled ? "opacity-60" : ""}`}
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
      className={`${base} resize-y ${error ? "border-red-500" : f ? "border-primary-600" : "border-neutral-200"} ${disabled ? "opacity-60" : ""}`}
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
      className={`${base} cursor-pointer appearance-none pr-10 ${f ? "border-primary-600" : "border-neutral-200"} ${disabled ? "opacity-60" : ""}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239F4325' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
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

/* ── Image upload panel ──────────────────────────────────── */
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
      <div
        className={`relative border-2 border-dashed transition-colors duration-200 cursor-pointer ${dragging ? "border-primary-600 bg-primary-50" : "border-neutral-200"}`}
        style={{ minHeight: 100, background: dragging ? undefined : "#faf9f7" }}
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
            className={dragging ? "text-primary-600" : "text-neutral-300"}
          />
          <p
            className={`font-heading font-semibold text-[12px] ${dragging ? "text-primary-600" : "text-neutral-500"}`}
          >
            {dragging ? "Drop images here" : "Click or drag images to upload"}
          </p>
          <p className="font-body text-[10px] text-neutral-300">
            PNG, JPG, WEBP
          </p>
        </div>
      </div>

    

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
          {images.map((img, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group aspect-square overflow-hidden border border-neutral-200"
            >
              <img
                src={typeof img === "string" ? img : img.preview}
                alt={`img-${i}`}
                className="w-full h-full object-cover"
              />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[8px] font-heading font-bold tracking-widest uppercase text-white px-1.5 py-0.5 bg-primary-600">
                  Cover
                </span>
              )}
              <button
                onClick={() => onRemoveFile(i)}
                disabled={disabled}
                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer bg-black/55"
              >
                <X size={11} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Live preview card ───────────────────────────────────── */
function PreviewCard({ form }) {
  const coverSrc = form.images?.[0]
    ? typeof form.images[0] === "string"
      ? form.images[0]
      : form.images[0].preview
    : null;
  return (
    <div className="border border-neutral-200 bg-white overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt="preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-50">
            <ImagePlus size={22} className="text-primary-400 opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {form.category && (
          <span className="absolute top-2.5 left-2.5 text-[10px] tracking-[0.14em] uppercase font-bold px-2 py-0.5 text-white bg-primary-600">
            {form.category}
          </span>
        )}
        {form.featured && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 bg-amber-400">
            <Star size={8} className="text-white fill-white" />
            <span className="font-heading font-bold text-[8px] tracking-widest uppercase text-white">
              Featured
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600" />
      </div>
      <div className="p-4">
        <h3 className="font-heading font-bold text-[14px] leading-snug line-clamp-2 text-secondary-600">
          {form.title || "Article Title"}
        </h3>
        <p className="font-body text-[12px] mt-1.5 line-clamp-2 leading-relaxed text-neutral-500">
          {form.description || "Article description will appear here…"}
        </p>
        <div className="mt-3 pt-3 flex items-center justify-between text-[10px] border-t border-neutral-200">
          <span className="font-heading font-bold text-primary-600">
            {form.author || "TJC Properties"}
          </span>
          <span className="font-heading font-semibold tracking-widest uppercase text-neutral-400">
            {form.date}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════ */
export default function BlogForm({ editingBlog, onSave, onCancel }) {
  const { uploadFile } = useBlog();
  const isEditing = !!editingBlog;

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFiles, setImageFiles] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    author: "",
    category: "",
    urlImage: "",
    featured: false,
    date: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  });

  useEffect(() => {
    if (!editingBlog) return;
    setForm({
      title: editingBlog.title || "",
      description: editingBlog.description || "",
      content: editingBlog.content || "",
      author: editingBlog.author || "",
      category: editingBlog.category || "",
      urlImage: "",
      featured: editingBlog.featured ?? false,
      date:
        editingBlog.date ||
        new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    });
    const existing =
      editingBlog.images || (editingBlog.image ? [editingBlog.image] : []);
    setImageFiles(existing);
  }, [editingBlog]);

  const up = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const handleAddFiles = (files) => {
    const entries = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true,
    }));
    setImageFiles((prev) => [...prev, ...entries]);
  };

  const commitUrlImage = () => {
    if (form.urlImage.trim()) {
      setImageFiles((prev) => [...prev, form.urlImage.trim()]);
      up("urlImage", "");
    }
  };

  const removeImage = (i) => {
    setImageFiles((prev) => {
      const next = [...prev];
      if (next[i]?.preview) URL.revokeObjectURL(next[i].preview);
      next.splice(i, 1);
      return next;
    });
  };

  const normImages = imageFiles.map((e) =>
    typeof e === "string" ? e : e.preview,
  );

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.content.trim()) e.content = "Content is required";
    return e;
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
        if (typeof entry === "string") uploadedUrls.push(entry);
        else if (entry?.isNew && entry?.file)
          uploadedUrls.push(await uploadFile(entry.file));
      }
      if (form.urlImage.trim()) uploadedUrls.push(form.urlImage.trim());
      await onSave({
        title: form.title,
        description: form.description,
        content: form.content,
        author: form.author,
        category: form.category,
        date: form.date,
        featured: form.featured,
        images: uploadedUrls,
        image: uploadedUrls[0] || "",
      });
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-neutral-100"
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14,26,43,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(14,26,43,0.025) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          zIndex: 0,
        }}
      />

      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 border-b border-neutral-200 backdrop-blur-md"
        style={{ background: "rgba(245,244,241,0.92)" }}
      >
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={onCancel}
              disabled={uploading}
              className="flex items-center gap-1.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer disabled:opacity-50 text-neutral-500 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={13} />{" "}
              <span className="hidden sm:inline">Back</span>
            </motion.button>
            <span className="hidden sm:inline text-neutral-200">|</span>
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.18em] uppercase font-heading font-bold text-primary-600">
                {isEditing ? "Edit Article" : "New Article"}
              </p>
              <h1
                className="font-heading font-bold leading-none mt-0.5 truncate text-secondary-600"
                style={{ fontSize: "clamp(14px,2vw,18px)" }}
              >
                {isEditing
                  ? form.title || "Edit Article"
                  : "Create New Article"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {form.featured && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200"
              >
                <Star size={11} className="text-amber-500 fill-amber-400" />
                <span className="font-heading font-bold text-[10px] uppercase tracking-widest text-amber-600">
                  Featured
                </span>
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setPreview((p) => !p)}
              className="hidden sm:flex items-center gap-1.5 h-8 px-3 border font-heading font-bold text-[10px] tracking-[0.08em] uppercase cursor-pointer transition-colors"
              style={{ borderColor: preview ? "#9F4325" : undefined }}
            >
              {" "}
              {preview ? <EyeOff size={12} /> : <Eye size={12} />}
              {preview ? "Hide" : "Preview"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={uploading}
              className={`flex items-center gap-1.5 h-8 px-4 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none cursor-pointer disabled:opacity-60 transition-colors ${uploading ? "bg-neutral-400" : "bg-primary-600 hover:bg-primary-500"}`}
            >
              {uploading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}
              {uploading ? "Saving…" : isEditing ? "Save" : "Publish"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        className="relative max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12"
        style={{ zIndex: 1 }}
      >
        {/* Mobile preview toggle */}
        <div className="flex sm:hidden justify-end mb-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPreview((p) => !p)}
            className={`flex items-center gap-1.5 h-8 px-3 border font-heading font-bold text-[10px] uppercase cursor-pointer transition-colors ${preview ? "border-primary-600 bg-primary-50 text-primary-600" : "border-neutral-200 bg-white text-neutral-500"}`}
          >
            {preview ? <EyeOff size={12} /> : <Eye size={12} />}
            {preview ? "Hide Preview" : "Show Preview"}
          </motion.button>
        </div>

        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="sm:hidden overflow-hidden mb-6"
            >
              <p className="font-heading font-bold text-[11px] tracking-widest uppercase mb-2 text-neutral-500">
                Card Preview
              </p>
              <PreviewCard form={{ ...form, images: normImages }} />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`grid gap-8 ${preview ? "sm:grid-cols-[1fr_320px]" : "grid-cols-1 sm:max-w-[720px] sm:mx-auto"}`}
        >
          {/* Form */}
          <div className="space-y-6">
            {/* ════ FEATURED TOGGLE ════ */}
            <motion.div
              whileTap={{ scale: 0.99 }}
              onClick={() => up("featured", !form.featured)}
              className={`flex items-center justify-between px-5 py-4 border-2 cursor-pointer transition-all duration-200 ${
                form.featured
                  ? "border-amber-400 bg-amber-50"
                  : "border-neutral-200 bg-white hover:border-amber-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 flex items-center justify-center transition-colors ${form.featured ? "bg-amber-400" : "bg-neutral-100"}`}
                >
                  <Star
                    size={18}
                    className={
                      form.featured
                        ? "text-white fill-white"
                        : "text-neutral-400"
                    }
                  />
                </div>
                <div>
                  <p className="font-heading font-bold text-[13px] text-secondary-600">
                    Feature this article
                  </p>
                  <p className="font-body text-[12px] text-neutral-500 mt-0.5">
                    Featured articles appear in the homepage blog spotlight with
                    a larger card.
                  </p>
                </div>
              </div>
              <div
                className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${form.featured ? "bg-amber-400" : "bg-neutral-200"}`}
              >
                <motion.div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                  animate={{
                    left: form.featured ? "calc(100% - 22px)" : "2px",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              </div>
            </motion.div>

            <Field label="Article Title" required error={errors.title}>
              <TInput
                value={form.title}
                onChange={(e) => up("title", e.target.value)}
                placeholder="e.g. Why Oke-Ado is Ibadan's Best Investment Zone"
                error={errors.title}
                disabled={uploading}
              />
            </Field>

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

            <div className="border border-neutral-200 bg-white p-5">
              <p className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase mb-4 text-secondary-600">
                Images
                <span className="ml-2 font-body font-normal normal-case text-[10px] text-neutral-400">
                  First image = cover
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
              {form.urlImage.trim() && (
                <motion.button
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={commitUrlImage}
                  className="mt-3 flex items-center gap-1.5 h-8 px-4 font-heading font-bold text-[11px] tracking-[0.08em] uppercase text-white border-none cursor-pointer bg-primary-600 hover:bg-primary-500 transition-colors"
                >
                  <ImagePlus size={12} /> Add URL Image
                </motion.button>
              )}
            </div>

            <Field
              label="Article Content"
              required
              hint={`${form.content.replace(/<[^>]*>/g, "").length} chars`}
              error={errors.content}
            >
              <div
                className={`border ${errors.content ? "border-red-500" : "border-neutral-200"}`}
              >
                <RichTextEditor
                  value={form.content}
                  onChange={(v) => up("content", v)}
                  disabled={uploading}
                />
              </div>
            </Field>

            <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
              <motion.button
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCancel}
                disabled={uploading}
                className="flex items-center gap-1.5 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer disabled:opacity-50 text-neutral-500 hover:text-red-600 transition-colors"
              >
                <X size={13} /> Discard & Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={uploading}
                className={`flex items-center gap-2 h-10 px-8 text-white font-heading font-bold text-xs tracking-[0.1em] uppercase border-none cursor-pointer disabled:opacity-60 transition-colors ${uploading ? "bg-neutral-400" : "bg-primary-600 hover:bg-primary-500"}`}
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

          {/* Desktop preview column */}
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
                  <p className="font-heading font-bold text-[11px] tracking-[0.14em] uppercase mb-2 text-neutral-400">
                    Card Preview
                  </p>
                  <PreviewCard form={{ ...form, images: normImages }} />
                </div>
                <div className="p-4 border border-neutral-200 bg-primary-50">
                  <p className="font-heading font-bold text-[11px] tracking-[0.12em] uppercase mb-3 text-primary-600">
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
                      className="font-body text-[12px] leading-relaxed mb-1.5 text-secondary-600"
                    >
                      <span className="mr-1 text-primary-600">→</span>
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
