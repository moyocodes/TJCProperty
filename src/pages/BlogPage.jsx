// src/pages/BlogPage.jsx
// Full /blog page — search, category filters (live from Firestore),
// sort, featured spotlight, full grid with pagination.

import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
  Search,
  X,
  Star,
  Filter,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Plus,
  FileText,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../components/firebase";

import { useBlog } from "../auth/BlogProvider";
import { useAuth } from "../auth/AuthProvider";
import BlogForm from "../components/BlogForm";

const PAGE_SIZE = 9;

function FadeUp({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Blog card ───────────────────────────────────────────── */
function BlogCard({ blog, isAdmin, onEdit, onDelete, navigate }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cover = blog.images?.[0] || blog.image;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -6, boxShadow: "0 20px 48px rgba(14,26,43,0.12)" }}
      className="h-full flex flex-col overflow-hidden border border-neutral-200 bg-white group"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      {/* Image */}
      <div
        className="relative h-52 overflow-hidden flex-shrink-0 cursor-pointer"
        onClick={() => navigate(`/blog/${blog.id}`)}
      >
        {cover ? (
          <motion.img
            src={cover}
            alt={blog.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.55 }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-primary-50">
            <FileText size={28} className="text-primary-400 opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between gap-2">
          {blog.category ? (
            <span className="text-[10px] tracking-[0.16em] uppercase font-bold px-2.5 py-1 text-white bg-primary-600">
              {blog.category}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1.5">
            {blog.featured && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-400">
                <Star size={8} className="text-white fill-white" />
                <span className="font-heading font-bold text-[8px] tracking-widest uppercase text-white">
                  Featured
                </span>
              </div>
            )}
            <span className="text-[10px] px-2.5 py-1 font-heading font-semibold bg-white/90 text-secondary-600">
              {blog.date}
            </span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400" />

        {isAdmin && (
          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(blog);
              }}
              className="w-7 h-7 flex items-center justify-center text-white border-none cursor-pointer bg-secondary-600/80 hover:bg-secondary-600 transition-colors backdrop-blur-sm"
            >
              <Edit2 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3
          className="font-heading font-bold text-[15px] leading-snug line-clamp-2 text-secondary-600 hover:text-primary-600 transition-colors cursor-pointer"
          onClick={() => navigate(`/blog/${blog.id}`)}
        >
          {blog.title}
        </h3>
        <p className="font-body text-[13px] mt-2 leading-relaxed line-clamp-2 flex-1 text-neutral-500">
          {blog.description}
        </p>
        <div className="mt-4 pt-3.5 flex items-center justify-between text-[11px] border-t border-neutral-200">
          <span className="font-heading font-bold tracking-wide text-primary-600">
            {blog.author || "TJC Properties"}
          </span>
          {isAdmin && (
            <AnimatePresence mode="wait">
              {confirmDelete ? (
                <motion.button
                  key="confirm"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  onClick={() => {
                    onDelete(blog.id);
                    setConfirmDelete(false);
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-red-700 text-white font-heading font-bold text-[9px] uppercase border-none cursor-pointer"
                >
                  <Check size={9} /> Sure?
                </motion.button>
              ) : (
                <motion.button
                  key="del"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 font-heading font-bold text-[9px] uppercase text-red-600 hover:text-red-700 bg-transparent border-none cursor-pointer transition-colors"
                >
                  <Trash2 size={9} /> Delete
                </motion.button>
              )}
            </AnimatePresence>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/blog/${blog.id}`)}
          className="mt-3 flex items-center justify-center gap-1.5 h-9 text-[11px] font-heading font-bold tracking-[0.08em] uppercase text-white border-none cursor-pointer bg-primary-600 hover:bg-primary-500 transition-colors"
        >
          Read Article <ArrowRight size={11} />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Category manager modal ──────────────────────────────── */
function CategoriesManager({ categories, onClose }) {
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);

  const addCat = async () => {
    if (!newCat.trim()) return;
    setSaving(true);
    await addDoc(collection(db, "blogCategories"), {
      name: newCat.trim(),
      createdAt: serverTimestamp(),
    });
    setNewCat("");
    setSaving(false);
  };

  const delCat = async (id) => {
    await deleteDoc(doc(db, "blogCategories", id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: "rgba(14,26,43,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 14 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-[400px] bg-neutral-100 border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-white">
          <p className="font-heading font-bold text-[13px] text-secondary-600">
            Manage Blog Categories
          </p>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-neutral-400 hover:text-secondary-600"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="New category name…"
              onKeyDown={(e) => e.key === "Enter" && addCat()}
              className="flex-1 bg-white border border-neutral-200 focus:border-primary-600 outline-none px-3 py-2 font-body text-[13px] text-secondary-600 transition-colors"
            />
            <button
              onClick={addCat}
              disabled={saving || !newCat.trim()}
              className="px-4 h-[38px] bg-primary-600 hover:bg-primary-500 text-white font-heading font-bold text-[11px] uppercase border-none cursor-pointer disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {categories.length === 0 && (
              <p className="font-body text-[12px] text-neutral-400 text-center py-4">
                No custom categories yet.
              </p>
            )}
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between px-3 py-2 bg-white border border-neutral-200"
              >
                <span className="font-heading font-semibold text-[12px] text-secondary-600">
                  {cat.name}
                </span>
                <button
                  onClick={() => delCat(cat.id)}
                  className="text-neutral-400 hover:text-red-600 bg-transparent border-none cursor-pointer transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT — BlogPage
══════════════════════════════════════════════════════════ */
export default function BlogPage() {
  const navigate = useNavigate();
  const { blogs, loading, createBlog, updateBlog, deleteBlog } = useBlog();
  const { isAdmin } = useAuth();

  const [editingBlog, setEditingBlog] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [mobileFilter, setMobileFilter] = useState(false);
  const [showCatMgr, setShowCatMgr] = useState(false);

  // Firestore categories
  const [dbCategories, setDbCategories] = useState([]);
  useEffect(() => {
    const q = query(collection(db, "blogCategories"), orderBy("name"));
    return onSnapshot(q, (snap) => {
      setDbCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Merge DB categories + categories from blog posts (unique)
  const allCategories = useMemo(() => {
    const fromBlogs = [
      ...new Set(blogs.map((b) => b.category).filter(Boolean)),
    ];
    const fromDb = dbCategories.map((c) => c.name);
    return [...new Set([...fromDb, ...fromBlogs])].sort();
  }, [blogs, dbCategories]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...blogs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q),
      );
    }
    if (activeCategory !== "all")
      result = result.filter((b) => b.category === activeCategory);
    if (sort === "newest")
      result.sort(
        (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0),
      );
    if (sort === "oldest")
      result.sort(
        (a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0),
      );
    if (sort === "az")
      result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    if (sort === "featured")
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return result;
  }, [blogs, search, activeCategory, sort]);

  const featured = blogs.filter((b) => b.featured === true);
  const [featuredHero, ...featuredRest] = featured;
  const featuredSide = featuredRest.slice(0, 2);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < filtered.length;

  useEffect(() => {
    setPage(1);
  }, [search, activeCategory, sort]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSave = async (blogData) => {
    if (editingBlog) {
      await updateBlog(editingBlog.id, blogData);
      setEditingBlog(null);
    } else {
      await createBlog(blogData);
      setIsCreating(false);
    }
  };

  if (editingBlog || isCreating) {
    return (
      <BlogForm
        editingBlog={editingBlog}
        onSave={handleSave}
        onCancel={() => {
          setEditingBlog(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className="bg-secondary-600 px-[5%] pt-28 pb-14 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="max-w-[1200px] mx-auto relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-4 text-[11px] font-heading font-bold tracking-[0.2em] uppercase text-primary-400">
                <span className="inline-block w-5 h-px bg-primary-400" /> TJC
                Properties
              </div>
              <h1
                className="font-heading text-white leading-[1.15]"
                style={{
                  fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
                  fontWeight: 400,
                }}
              >
                Property{" "}
                <em className="not-italic text-primary-400 font-semibold">
                  Insights
                </em>
                <br className="hidden md:block" /> & Market Guides
              </h1>
              <p className="font-body text-white/50 text-[15px] mt-3 max-w-[520px] leading-relaxed">
                Expert articles on Ibadan's property market, investment
                strategies, and real estate advice from the TJC team.
              </p>
            </div>

            {/* Stats + admin CTA */}
            <div className="flex items-end gap-6 flex-wrap">
              <div className="text-center">
                <div
                  className="font-heading font-bold text-white leading-none"
                  style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
                >
                  {blogs.length}
                </div>
                <div className="font-body text-white/40 text-[11px] mt-1">
                  Articles
                </div>
              </div>
              <div className="text-center">
                <div
                  className="font-heading font-bold text-white leading-none"
                  style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}
                >
                  {allCategories.length}
                </div>
                <div className="font-body text-white/40 text-[11px] mt-1">
                  Categories
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-1.5 h-9 px-4 text-white font-heading font-bold text-[11px] uppercase border border-white/25 hover:border-white/60 bg-transparent cursor-pointer transition-colors"
                  >
                    <Plus size={13} /> New Article
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowCatMgr(true)}
                    className="flex items-center gap-1.5 h-9 px-4 text-white/70 font-heading font-bold text-[11px] uppercase border border-white/15 hover:border-white/40 bg-transparent cursor-pointer transition-colors"
                  >
                    <SlidersHorizontal size={13} /> Categories
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-[5%] py-12">
        {/* ── Search + filters ─────────────────────────────── */}
        <div className="mb-10 space-y-4">
          {/* Search bar */}
          <div className="relative max-w-[600px]">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles, topics, authors…"
              className="w-full bg-white border border-neutral-200 focus:border-primary-600 outline-none pl-11 pr-10 py-3 font-body text-[14px] text-secondary-600 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-neutral-400 hover:text-secondary-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Desktop: category pills + sort */}
          <div className="hidden md:flex items-center justify-between gap-4 flex-wrap">
            {/* Category pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 font-heading font-semibold text-[11px] tracking-[0.06em] uppercase border transition-colors cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-neutral-400 border-neutral-200 hover:border-primary-600 hover:text-primary-600"
                }`}
              >
                All ({blogs.length})
              </button>
              {allCategories.map((cat) => {
                const count = blogs.filter((b) => b.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 font-heading font-semibold text-[11px] tracking-[0.06em] uppercase border transition-colors cursor-pointer ${
                      activeCategory === cat
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-neutral-400 border-neutral-200 hover:border-primary-600 hover:text-primary-600"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-[10px] uppercase tracking-widest text-neutral-400">
                Sort:
              </span>
              {[
                { value: "newest", label: "Newest" },
                { value: "oldest", label: "Oldest" },
                { value: "az", label: "A–Z" },
                { value: "featured", label: "Featured First" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className={`px-3 py-1.5 font-heading font-semibold text-[10px] uppercase border transition-colors cursor-pointer ${
                    sort === s.value
                      ? "bg-secondary-600 text-white border-secondary-600"
                      : "bg-white text-neutral-400 border-neutral-200 hover:border-secondary-600 hover:text-secondary-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile filter bar */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileFilter((v) => !v)}
              className={`flex items-center gap-1.5 h-9 px-4 border font-heading font-bold text-[11px] uppercase cursor-pointer transition-colors ${
                mobileFilter
                  ? "border-primary-600 bg-primary-50 text-primary-600"
                  : "border-neutral-200 bg-white text-neutral-500"
              }`}
            >
              <Filter size={12} /> Filters
              {activeCategory !== "all" && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 ml-0.5" />
              )}
            </button>
            {activeCategory !== "all" && (
              <button
                onClick={() => setActiveCategory("all")}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 border border-primary-200 font-heading font-bold text-[10px] uppercase text-primary-600 cursor-pointer"
              >
                {activeCategory} <X size={9} />
              </button>
            )}
          </div>

          {/* Mobile filter drawer */}
          <AnimatePresence>
            {mobileFilter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden"
              >
                <div className="bg-white border border-neutral-200 p-4 space-y-4">
                  <div>
                    <p className="font-heading font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-2">
                      Category
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["all", ...allCategories].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setActiveCategory(cat);
                            setMobileFilter(false);
                          }}
                          className={`px-3 py-1.5 font-heading font-semibold text-[11px] uppercase border transition-colors cursor-pointer ${
                            activeCategory === cat
                              ? "bg-primary-600 text-white border-primary-600"
                              : "bg-white text-neutral-400 border-neutral-200"
                          }`}
                        >
                          {cat === "all" ? "All" : cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-heading font-bold text-[10px] uppercase tracking-widest text-neutral-400 mb-2">
                      Sort
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "newest", label: "Newest" },
                        { value: "oldest", label: "Oldest" },
                        { value: "az", label: "A–Z" },
                        { value: "featured", label: "Featured First" },
                      ].map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setSort(s.value)}
                          className={`px-3 py-1.5 font-heading font-semibold text-[11px] uppercase border transition-colors cursor-pointer ${
                            sort === s.value
                              ? "bg-secondary-600 text-white border-secondary-600"
                              : "bg-white text-neutral-400 border-neutral-200"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Active filter chip ────────────────────────────── */}
        {(search || activeCategory !== "all") && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="font-heading font-bold text-[10px] uppercase tracking-widest text-neutral-400">
              Showing:
            </span>
            {activeCategory !== "all" && (
              <button
                onClick={() => setActiveCategory("all")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-200 font-heading font-bold text-[10px] uppercase text-primary-600 cursor-pointer hover:bg-primary-100 transition-colors"
              >
                {activeCategory} <X size={9} />
              </button>
            )}
            {search && (
              <button
                onClick={() => setSearch("")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary-50 border border-secondary-200 font-heading font-bold text-[10px] uppercase text-secondary-600 cursor-pointer hover:bg-secondary-100 transition-colors"
              >
                "{search}" <X size={9} />
              </button>
            )}
            <span className="font-body text-[12px] text-neutral-400 ml-1">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* ── Featured spotlight (only when no active filter) ─ */}
        {!search && activeCategory === "all" && featuredHero && (
          <FadeUp>
            <div className="mb-14">
              <div className="inline-flex items-center gap-2 text-[11px] font-heading font-bold tracking-[0.18em] uppercase mb-5 text-amber-500">
                <Star size={11} className="fill-amber-400" /> Featured
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
                {/* Hero */}
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.35 }}
                  onClick={() => navigate(`/blog/${featuredHero.id}`)}
                  className="relative overflow-hidden cursor-pointer group"
                  style={{ minHeight: 380 }}
                >
                  {featuredHero.images?.[0] || featuredHero.image ? (
                    <img
                      src={featuredHero.images?.[0] || featuredHero.image}
                      alt={featuredHero.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-primary-50 flex items-center justify-center">
                      <FileText
                        size={32}
                        className="text-primary-400 opacity-40"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary-600/95 via-secondary-600/40 to-transparent" />
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-400">
                    <Star size={10} className="text-white fill-white" />
                    <span className="font-heading font-bold text-[9px] tracking-[0.2em] uppercase text-white">
                      Featured
                    </span>
                  </div>
                  {featuredHero.category && (
                    <div className="absolute top-4 right-4 px-3 py-1 font-heading font-bold text-[10px] tracking-[0.1em] uppercase text-white bg-primary-600">
                      {featuredHero.category}
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBlog(featuredHero);
                      }}
                      className="absolute bottom-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-white border-none cursor-pointer bg-secondary-600/70 hover:bg-secondary-600 transition-colors backdrop-blur-sm"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 pt-12 max-w-[640px]">
                    <p className="font-body text-[12px] text-white/55 mb-2">
                      {featuredHero.date}
                    </p>
                    <h3
                      className="font-heading font-bold text-white leading-tight mb-2"
                      style={{ fontSize: "clamp(1.2rem, 2.4vw, 1.75rem)" }}
                    >
                      {featuredHero.title}
                    </h3>
                    <p className="font-body text-white/60 text-[13px] leading-relaxed line-clamp-2 mb-4">
                      {featuredHero.description}
                    </p>
                    <motion.div
                      className="flex items-center gap-1.5 font-heading font-bold text-[11px] uppercase text-white/80 group-hover:text-primary-400 transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      Read Article <ArrowRight size={12} />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Side + CTA */}
                <div className="flex flex-col gap-4">
                  {featuredSide.map((b, i) => (
                    <FadeUp key={b.id} delay={0.08 + i * 0.06}>
                      <motion.div
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => navigate(`/blog/${b.id}`)}
                        className="flex bg-white border border-neutral-200 cursor-pointer group overflow-hidden"
                      >
                        <div className="relative w-[100px] flex-shrink-0 overflow-hidden">
                          {b.images?.[0] || b.image ? (
                            <img
                              src={b.images?.[0] || b.image}
                              alt={b.title}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              draggable={false}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-primary-50 flex items-center justify-center">
                              <FileText
                                size={16}
                                className="text-primary-300 opacity-60"
                              />
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-amber-400">
                            <Star size={7} className="text-white fill-white" />
                          </div>
                        </div>
                        <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
                          {b.category && (
                            <span className="font-heading font-bold text-[9px] tracking-[0.12em] uppercase text-primary-600">
                              {b.category}
                            </span>
                          )}
                          <h4 className="font-heading font-bold text-[13px] text-secondary-600 leading-snug mt-0.5 line-clamp-2">
                            {b.title}
                          </h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-body text-[10px] text-neutral-400">
                              {b.date}
                            </span>
                            <span className="font-heading font-bold text-[9px] uppercase text-neutral-400 group-hover:text-primary-600 transition-colors flex items-center gap-0.5">
                              Read <ArrowRight size={9} />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </FadeUp>
                  ))}
                  <FadeUp delay={0.2}>
                    <motion.div
                      whileHover={{ y: -3 }}
                      onClick={() => {}}
                      className="flex-1 flex flex-col items-center justify-center text-center px-6 py-7 bg-secondary-600 min-h-[120px]"
                    >
                      <p className="font-heading font-bold text-white text-[14px] mb-1">
                        {blogs.length} Article{blogs.length !== 1 ? "s" : ""}{" "}
                        Published
                      </p>
                      <p className="font-body text-white/45 text-[11px] mb-3 leading-relaxed">
                        Scroll down to browse all articles below
                      </p>
                      <span className="inline-flex items-center gap-1.5 font-heading font-bold text-[10px] uppercase text-primary-400">
                        ↓ See all below
                      </span>
                    </motion.div>
                  </FadeUp>
                </div>
              </div>
            </div>
          </FadeUp>
        )}

        {/* ── Loading ─────────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-neutral-200 overflow-hidden animate-pulse"
              >
                <div className="h-52 bg-neutral-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-neutral-200 w-3/4" />
                  <div className="h-4 bg-neutral-200" />
                  <div className="h-4 bg-neutral-200 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty ───────────────────────────────────────────── */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 border border-neutral-200 bg-white"
          >
            <FileText size={32} className="text-neutral-300 mx-auto mb-4" />
            <p className="font-heading font-bold text-lg text-secondary-600">
              No articles found
            </p>
            <p className="font-body text-sm mt-1 text-neutral-500">
              {search
                ? `No results for "${search}"`
                : "No articles in this category yet."}
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("all");
              }}
              className="mt-4 font-heading font-bold text-[11px] uppercase text-primary-600 hover:text-primary-500 bg-transparent border-none cursor-pointer transition-colors"
            >
              Clear filters
            </button>
          </motion.div>
        )}

        {/* ── Grid ─────────────────────────────────────────────── */}
        {!loading && paged.length > 0 && (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              <AnimatePresence>
                {paged.map((blog, i) => (
                  <FadeUp
                    key={blog.id}
                    delay={Math.min((i % PAGE_SIZE) * 0.05, 0.3)}
                  >
                    <BlogCard
                      blog={blog}
                      isAdmin={isAdmin}
                      onEdit={setEditingBlog}
                      onDelete={deleteBlog}
                      navigate={navigate}
                    />
                  </FadeUp>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-12">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-2 h-11 px-8 font-heading font-bold text-xs tracking-[0.1em] uppercase text-white border-none cursor-pointer bg-secondary-600 hover:bg-secondary-500 transition-colors"
                >
                  Load More Articles <ChevronDown size={13} />
                </motion.button>
                <p className="font-body text-[11px] text-neutral-400 mt-2">
                  Showing {paged.length} of {filtered.length}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Category manager modal */}
      <AnimatePresence>
        {showCatMgr && (
          <CategoriesManager
            categories={dbCategories}
            onClose={() => setShowCatMgr(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
