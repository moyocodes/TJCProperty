// src/components/sections/BlogSection.jsx
// Home-page blog preview. Featured articles get a spotlight above the grid.

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
  Edit2,
  Plus,
  Trash2,
  FileText,
  Star,
  MapPin,
} from "lucide-react";
import BlogForm from "./BlogForm";
import { useBlog } from "../auth/BlogProvider";
import { useAuth } from "../auth/AuthProvider";
import { Link, useNavigate } from "react-router-dom";

function FadeUp({ children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Skeleton ────────────────────────────────────────────── */
export function BlogGridSkeleton({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden border border-neutral-200 bg-white flex flex-col animate-pulse"
        >
          <div className="h-48 w-full bg-neutral-200" />
          <div className="p-5 flex flex-col gap-3 flex-1">
            <div className="h-5 w-3/4 bg-neutral-200" />
            <div className="h-4 w-full bg-neutral-200" />
            <div className="h-4 w-5/6 bg-neutral-200" />
            <div className="mt-auto flex justify-between pt-4 border-t border-neutral-200">
              <div className="h-3 w-20 bg-neutral-200" />
              <div className="h-3 w-16 bg-neutral-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Featured hero card ──────────────────────────────────── */
function FeaturedHeroCard({ blog, onEdit, isAdmin, navigate }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden cursor-pointer group col-span-1 lg:col-span-2"
      style={{ minHeight: 380 }}
      onClick={() => navigate(`/blog/${blog.id}`)}
    >
      {blog.image || blog.images?.[0] ? (
        <img
          src={blog.images?.[0] || blog.image}
          alt={blog.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-primary-50 flex items-center justify-center">
          <FileText size={28} className="text-primary-400 opacity-40" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-secondary-600/95 via-secondary-600/40 to-transparent" />

      {/* Badges */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-400">
        <Star size={10} className="text-white fill-white" />
        <span className="font-heading font-bold text-[9px] tracking-[0.2em] uppercase text-white">
          Featured
        </span>
      </div>
      {blog.category && (
        <div className="absolute top-4 right-4 px-3 py-1 font-heading font-bold text-[10px] tracking-[0.1em] uppercase text-white bg-primary-600">
          {blog.category}
        </div>
      )}

      {/* Admin */}
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(blog);
          }}
          className="absolute bottom-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-white border-none cursor-pointer bg-secondary-600/70 hover:bg-secondary-600 transition-colors backdrop-blur-sm"
        >
          <Edit2 size={13} />
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 pt-12 max-w-[640px]">
        <p className="font-body text-[12px] text-white/55 mb-2">{blog.date}</p>
        <h3
          className="font-heading font-bold text-white leading-tight mb-2"
          style={{ fontSize: "clamp(1.2rem, 2.4vw, 1.75rem)" }}
        >
          {blog.title}
        </h3>
        <p className="font-body text-white/60 text-[13px] leading-relaxed line-clamp-2 mb-4">
          {blog.description}
        </p>
        <motion.div
          className="flex items-center gap-1.5 font-heading font-bold text-[11px] uppercase text-white/80 group-hover:text-primary-400 transition-colors"
          whileHover={{ x: 4 }}
        >
          Read Article <ArrowRight size={12} />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Featured side card ──────────────────────────────────── */
function FeaturedSideCard({ blog, isAdmin, onEdit, navigate, delay = 0 }) {
  const cover = blog.images?.[0] || blog.image;
  return (
    <FadeUp delay={delay}>
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 14px 36px rgba(0,0,0,0.1)" }}
        transition={{ duration: 0.3 }}
        onClick={() => navigate(`/blog/${blog.id}`)}
        className="relative overflow-hidden cursor-pointer group flex bg-white border border-neutral-200"
      >
        <div className="relative w-[100px] flex-shrink-0 overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={blog.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 bg-primary-50 flex items-center justify-center">
              <FileText size={16} className="text-primary-300 opacity-60" />
            </div>
          )}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 bg-amber-400">
            <Star size={7} className="text-white fill-white" />
          </div>
        </div>
        <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
          <div>
            {blog.category && (
              <span className="font-heading font-bold text-[9px] tracking-[0.12em] uppercase text-primary-600">
                {blog.category}
              </span>
            )}
            <h4 className="font-heading font-bold text-[13px] text-secondary-600 leading-snug mt-0.5 line-clamp-2">
              {blog.title}
            </h4>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="font-body text-[10px] text-neutral-400">
              {blog.date}
            </span>
            <span className="font-heading font-bold text-[9px] uppercase text-neutral-400 group-hover:text-primary-600 transition-colors flex items-center gap-0.5">
              Read <ArrowRight size={9} />
            </span>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(blog);
            }}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-white border-none cursor-pointer bg-secondary-600/70 hover:bg-secondary-600 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
          >
            <Edit2 size={10} />
          </button>
        )}
      </motion.div>
    </FadeUp>
  );
}

/* ── Regular blog card ───────────────────────────────────── */
function BlogCard({ blog, isAdmin, onEdit, onDelete, navigate }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cover = blog.images?.[0] || blog.image;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: "0 20px 48px rgba(14,26,43,0.12)" }}
      className="h-full flex flex-col overflow-hidden border border-neutral-200 bg-white group"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
    >
      {/* Image */}
      <div
        className="relative h-48 overflow-hidden flex-shrink-0 cursor-pointer"
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
            <p className="text-[11px] font-heading font-semibold tracking-widest uppercase text-primary-400 opacity-50">
              No Cover
            </p>
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
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3
          className="font-heading font-bold text-[16px] leading-snug line-clamp-2 text-secondary-600 hover:text-primary-600 transition-colors cursor-pointer"
          onClick={() => navigate(`/blog/${blog.id}`)}
        >
          {blog.title}
        </h3>
        <p className="font-body text-sm mt-2 leading-relaxed line-clamp-2 flex-1 text-neutral-500">
          {blog.description}
        </p>

        {/* Meta */}
        <div className="mt-4 pt-3.5 flex items-center justify-between text-[11px] border-t border-neutral-200">
          <span className="font-heading font-bold tracking-wide text-primary-600">
            {blog.author || "TJC Properties"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary-600" />
            <span className="font-heading font-bold tracking-[0.14em] uppercase text-[10px] text-neutral-400">
              Real Estate
            </span>
          </span>
        </div>

        {/* Actions */}
        <div
          className={`mt-4 grid gap-2 ${isAdmin ? "grid-cols-3" : "grid-cols-1"}`}
        >
          {isAdmin && (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onEdit(blog)}
                className="flex items-center justify-center gap-1 h-9 border border-neutral-200 text-[11px] font-heading font-bold tracking-wide cursor-pointer bg-white text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <Edit2 size={11} /> Edit
              </motion.button>

              <AnimatePresence mode="wait">
                {confirmDelete ? (
                  <motion.button
                    key="confirm"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      onDelete(blog.id);
                      setConfirmDelete(false);
                    }}
                    className="flex items-center justify-center gap-1 h-9 text-[11px] font-heading font-bold tracking-wide text-white cursor-pointer bg-red-700 border-none"
                  >
                    Confirm?
                  </motion.button>
                ) : (
                  <motion.button
                    key="delete"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center justify-center gap-1 h-9 border border-neutral-200 text-[11px] font-heading font-bold tracking-wide cursor-pointer bg-white text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={11} /> Delete
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/blog/${blog.id}`)}
            className="flex items-center justify-center gap-1.5 h-9 text-[11px] font-heading font-bold tracking-[0.08em] uppercase text-white border-none cursor-pointer bg-primary-600 hover:bg-primary-500 transition-colors"
          >
            Read <ArrowRight size={11} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
function EmptyState({ isAdmin, onCreate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20"
    >
      <div className="max-w-md mx-auto border border-neutral-200 bg-white p-12">
        <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center bg-primary-50">
          <FileText size={28} className="text-primary-600" />
        </div>
        <h3 className="font-heading font-bold text-[18px] text-secondary-600">
          No Articles Yet
        </h3>
        <p className="font-body text-sm mt-2 leading-relaxed text-neutral-500">
          Insights and property guides will appear here once published.
        </p>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCreate}
            className="mt-6 flex items-center justify-center gap-2 mx-auto h-10 px-6 text-white font-heading font-bold text-xs tracking-[0.1em] uppercase border-none cursor-pointer bg-primary-600 hover:bg-primary-500 transition-colors"
          >
            <Plus size={14} /> Publish First Article
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════ */
export default function BlogSection() {
  const { blogs, loading, createBlog, updateBlog, deleteBlog } = useBlog();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [editingBlog, setEditingBlog] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

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

  const featured = blogs.filter((b) => b.featured === true);
  const [featuredHero, ...featuredRest] = featured;
  const featuredSide = featuredRest.slice(0, 2);

  // Preview grid: up to 6, exclude featured hero to avoid duplication
  const preview = blogs.filter((b) => b.id !== featuredHero?.id).slice(0, 6);

  return (
    <section
      id="blog"
      className="relative py-20 md:py-28 px-[5%] bg-neutral-100"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14,26,43,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(14,26,43,0.025) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-[1200px] mx-auto">
        {/* Section header */}
        <FadeUp>
          <div className="mb-12 md:mb-14">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="inline-block w-5 h-px bg-primary-600" />
                  <p className="text-[11px] tracking-[0.2em] uppercase font-heading font-bold text-primary-600">
                    From the Desk
                  </p>
                </div>
                <h2
                  className="font-heading leading-[1.15] text-secondary-600"
                  style={{
                    fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                    fontWeight: 400,
                  }}
                >
                  Property{" "}
                  <em className="not-italic text-primary-600 font-semibold">
                    Insights
                  </em>{" "}
                  &<br className="hidden md:block" /> Market Guides
                </h2>
              </div>

              <div className="md:max-w-[340px] flex flex-col items-start md:items-end gap-4">
                <p className="font-body text-sm leading-relaxed md:text-right text-neutral-500">
                  Expert articles on Ibadan's property market, investment
                  opportunities, and real estate advice.
                </p>
                {isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 h-10 px-5 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none cursor-pointer bg-primary-600 hover:bg-primary-500 transition-colors"
                  >
                    <Plus size={14} /> New Article
                  </motion.button>
                )}
              </div>
            </div>
            <div className="mt-8 h-px bg-neutral-200" />
          </div>
        </FadeUp>

        {/* Body */}
        {loading ? (
          <BlogGridSkeleton count={6} />
        ) : blogs.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onCreate={() => setIsCreating(true)} />
        ) : (
          <>
            {/* ── Featured spotlight ── */}
            {featuredHero && (
              <FadeUp>
                <div className="mb-14">
                  <div className="inline-flex items-center gap-2 text-[11px] font-heading font-bold tracking-[0.18em] uppercase mb-5 text-amber-500">
                    <Star size={11} className="fill-amber-400" /> Featured
                    Article
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
                    <FeaturedHeroCard
                      blog={featuredHero}
                      isAdmin={isAdmin}
                      onEdit={setEditingBlog}
                      navigate={navigate}
                    />
                    <div className="flex flex-col gap-4">
                      {featuredSide.map((b, i) => (
                        <FeaturedSideCard
                          key={b.id}
                          blog={b}
                          isAdmin={isAdmin}
                          onEdit={setEditingBlog}
                          navigate={navigate}
                          delay={0.08 + i * 0.06}
                        />
                      ))}
                      {/* CTA block */}
                      <FadeUp delay={0.2}>
                        <motion.div
                          whileHover={{ y: -3 }}
                          onClick={() => navigate("/blog")}
                          className="flex-1 flex flex-col items-center justify-center text-center px-6 py-7 bg-secondary-600 cursor-pointer group min-h-[120px]"
                        >
                          <p className="font-heading font-bold text-white text-[14px] mb-1">
                            {blogs.length} Article
                            {blogs.length !== 1 ? "s" : ""} Published
                          </p>
                          <p className="font-body text-white/45 text-[11px] mb-3 leading-relaxed">
                            Property insights, guides, and market reports
                          </p>
                          <span className="inline-flex items-center gap-1.5 font-heading font-bold text-[10px] uppercase text-primary-400 group-hover:text-primary-300 transition-colors">
                            Browse All <ArrowRight size={11} />
                          </span>
                        </motion.div>
                      </FadeUp>
                    </div>
                  </div>
                </div>
              </FadeUp>
            )}

            {/* ── Grid ── */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {preview.map((blog, i) => (
                <FadeUp key={blog.id} delay={i * 0.07}>
                  <BlogCard
                    blog={blog}
                    isAdmin={isAdmin}
                    onEdit={setEditingBlog}
                    onDelete={deleteBlog}
                    navigate={navigate}
                  />
                </FadeUp>
              ))}
            </div>

            {/* View all CTA */}
            {blogs.length && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center mt-12"
              >
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/blog")}
                  className="inline-flex items-center gap-2 h-11 px-8 font-heading font-bold text-xs tracking-[0.1em] uppercase text-white border-none cursor-pointer bg-secondary-600 hover:bg-secondary-500 transition-colors"
                >
                  View All Articles <ArrowRight size={13} />
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
