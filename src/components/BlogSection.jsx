import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Edit2, Plus, Trash2, FileText } from "lucide-react";
import BlogForm from "./BlogForm";
import { useBlog } from "../auth/BlogProvider";
import { useAuth } from "../auth/AuthProvider";
import { Link } from "react-router-dom";

/* ── TJC Design Tokens ── */
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
};

/* ── Animation variants ── */
const gridVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};
const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ── Skeleton ── */
function SkeletonPulse({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-sm ${className}`}
      style={{ background: "#E8E3DE" }}
      aria-hidden="true"
    />
  );
}

export function BlogGridSkeleton({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden border flex flex-col"
          style={{ borderColor: T.border, background: T.white }}
        >
          <SkeletonPulse className="h-48 w-full" />
          <div className="p-5 flex flex-col gap-3 flex-1">
            <SkeletonPulse className="h-5 w-3/4" />
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-5/6" />
            <div
              className="mt-auto flex justify-between pt-4"
              style={{ borderTop: `1px solid ${T.border}` }}
            >
              <SkeletonPulse className="h-3 w-20" />
              <SkeletonPulse className="h-3 w-16" />
            </div>
            <SkeletonPulse className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Blog Card ── */
function BlogCard({ blog, isAdmin, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div variants={cardVariants}>
      <motion.div
        whileHover={{ y: -6, boxShadow: "0 20px 48px rgba(14,26,43,0.12)" }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="h-full flex flex-col overflow-hidden border group"
        style={{
          borderColor: T.border,
          background: T.white,
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* ── Image ── */}
        <div className="relative h-48 overflow-hidden flex-shrink-0">
          {blog.image ? (
            <motion.img
              src={blog.image}
              alt={blog.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.55 }}
            />
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${T.primaryLt}, #ede8e3)`,
              }}
            >
              <FileText size={28} style={{ color: T.primary, opacity: 0.4 }} />
              <p
                className="text-[11px] font-heading font-semibold tracking-widest uppercase"
                style={{ color: T.primary, opacity: 0.5 }}
              >
                No Cover Image
              </p>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          {/* Top badges */}
          <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between gap-2">
            {blog.category ? (
              <span
                className="text-[10px] tracking-[0.16em] uppercase font-bold px-2.5 py-1 text-white"
                style={{ background: T.primary }}
              >
                {blog.category}
              </span>
            ) : (
              <span />
            )}
            <span
              className="text-[10px] px-2.5 py-1 font-heading font-semibold backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.92)", color: T.navy }}
            >
              {blog.date}
            </span>
          </div>

          {/* Bottom accent line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400"
            style={{ background: T.primary }}
          />
        </div>

        {/* ── Content ── */}
        <div className="p-5 flex-1 flex flex-col">
          <Link href={`/blog/${blog.id}`} className="group/title">
            <h3
              className="font-heading font-bold text-[16px] leading-snug line-clamp-2 transition-colors duration-200"
              style={{ color: T.navy }}
              onMouseEnter={(e) => (e.target.style.color = T.primary)}
              onMouseLeave={(e) => (e.target.style.color = T.navy)}
            >
              {blog.title}
            </h3>
          </Link>

          <p
            className="font-body text-sm mt-2 leading-relaxed line-clamp-2 flex-1"
            style={{ color: T.muted }}
          >
            {blog.description}
          </p>

          {/* Meta row */}
          <div
            className="mt-4 pt-3.5 flex items-center justify-between text-[11px]"
            style={{ borderTop: `1px solid ${T.border}` }}
          >
            <span
              className="font-heading font-bold tracking-wide"
              style={{ color: T.primary }}
            >
              {blog.author || "TJC Properties"}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: T.primary }}
              />
              <span
                className="font-heading font-bold tracking-[0.14em] uppercase text-[10px]"
                style={{ color: T.muted }}
              >
                Real Estate
              </span>
            </span>
          </div>

          {/* ── Action buttons ── */}
          <div
            className={`mt-4 grid gap-2 ${isAdmin ? "grid-cols-3" : "grid-cols-1"}`}
          >
            {isAdmin && (
              <>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onEdit(blog)}
                  className="flex items-center justify-center gap-1 h-9 border text-[11px] font-heading font-bold tracking-wide transition-colors duration-200"
                  style={{
                    borderColor: T.border,
                    color: T.primary,
                    background: T.white,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = T.primaryLt)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = T.white)
                  }
                >
                  <Edit2 size={11} />
                  Edit
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
                      className="flex items-center justify-center gap-1 h-9 text-[11px] font-heading font-bold tracking-wide text-white transition-colors duration-200"
                      style={{ background: "#B91C1C" }}
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
                      className="flex items-center justify-center gap-1 h-9 border text-[11px] font-heading font-bold tracking-wide transition-colors duration-200"
                      style={{
                        borderColor: T.border,
                        color: "#B91C1C",
                        background: T.white,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#FEF2F2")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = T.white)
                      }
                    >
                      <Trash2 size={11} />
                      Delete
                    </motion.button>
                  )}
                </AnimatePresence>
              </>
            )}

            <motion.a
              href={`/blog/${blog.id}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-1.5 h-9 text-[11px] font-heading font-bold tracking-[0.08em] uppercase text-white transition-colors duration-300"
              style={{ background: T.primary }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = T.primaryHov)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = T.primary)
              }
            >
              Read Article
              <ArrowRight size={11} />
            </motion.a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Empty State ── */
function EmptyState({ isAdmin, onCreate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20"
    >
      <div
        className="max-w-md mx-auto border p-12"
        style={{ borderColor: T.border, background: T.white }}
      >
        <div
          className="w-16 h-16 mx-auto mb-5 flex items-center justify-center"
          style={{ background: T.primaryLt }}
        >
          <FileText size={28} style={{ color: T.primary }} />
        </div>
        <h3
          className="font-heading font-bold text-[18px]"
          style={{ color: T.navy }}
        >
          No Articles Yet
        </h3>
        <p
          className="font-body text-sm mt-2 leading-relaxed"
          style={{ color: T.muted }}
        >
          Insights and property guides will appear here once published.
        </p>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCreate}
            className="mt-6 flex items-center justify-center gap-2 mx-auto h-10 px-6 text-white font-heading font-bold text-xs tracking-[0.1em] uppercase border-none cursor-pointer transition-colors duration-300"
            style={{ background: T.primary }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = T.primaryHov)
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = T.primary)}
          >
            <Plus size={14} />
            Publish First Article
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════
   MAIN EXPORT
══════════════════════════════════ */
export default function BlogSection() {
  const { blogs, loading, createBlog, updateBlog, deleteBlog } = useBlog();
  const { isAdmin } = useAuth();
  
  console.log("Blogs:", isAdmin, blogs);
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

  /* Show form when creating / editing */
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
    <section
      id="blog"
      className="relative py-20 md:py-28 px-[5%]"
      style={{ background: T.bg }}
    >
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14,26,43,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(14,26,43,0.025) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-[1200px] mx-auto">
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 md:mb-14"
        >
          {/* Two-column: label+title left, description+CTA right */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              {/* Section tag */}
              <div className="inline-flex items-center gap-2 mb-3">
                <span
                  className="inline-block w-5 h-px"
                  style={{ background: T.primary }}
                />
                <p
                  className="text-[11px] tracking-[0.2em] uppercase font-heading font-bold"
                  style={{ color: T.primary }}
                >
                  From the Desk
                </p>
              </div>

              <h2
                className="font-heading leading-[1.15]"
                style={{
                  fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                  fontWeight: 400,
                  color: T.navy,
                }}
              >
                Property{" "}
                <em
                  className="not-italic"
                  style={{ color: T.primary, fontWeight: 600 }}
                >
                  Insights
                </em>{" "}
                &<br className="hidden md:block" /> Market Guides
              </h2>
            </div>

            <div className="md:max-w-[340px] flex flex-col items-start md:items-end gap-4">
              <p
                className="font-body text-sm leading-relaxed md:text-right"
                style={{ color: T.muted }}
              >
                Expert articles on Ibadan's property market, investment
                opportunities, and real estate advice — from the TJC team.
              </p>

              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2 h-10 px-5 text-white font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none cursor-pointer transition-colors duration-300"
                  style={{ background: T.primary }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = T.primaryHov)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = T.primary)
                  }
                >
                  <Plus size={14} />
                  New Article
                </motion.button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="mt-8 h-px" style={{ background: T.border }} />
        </motion.div>

        {/* ── Body ── */}
        {loading ? (
          <BlogGridSkeleton count={6} />
        ) : blogs.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onCreate={() => setIsCreating(true)} />
        ) : (
          <>
            <motion.div
              variants={gridVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {blogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  isAdmin={isAdmin}
                  onEdit={setEditingBlog}
                  onDelete={deleteBlog}
                />
              ))}
            </motion.div>

            {/* View all CTA */}
            {blogs.length >= 6 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center mt-12"
              >
                <motion.a
                  href="/blog"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 h-11 px-8 font-heading font-bold text-xs tracking-[0.1em] uppercase text-white transition-colors duration-300"
                  style={{ background: T.navy }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = T.navyLt)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = T.navy)
                  }
                >
                  View All Articles
                  <ArrowRight size={13} />
                </motion.a>
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
