// src/components/blog/BlogDetail.jsx
// Full article page. CommentsSection appended below related posts.

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Share2, Link2, Twitter, Facebook,
  Clock, Calendar, User, Tag, ChevronRight, MessageSquare, Check,
} from "lucide-react";
import { useBlog }     from "../auth/BlogProvider";
import { useNavigate, useParams } from "react-router-dom";
import CommentsSection from "./CommentsSection";

/* ── helpers ──────────────────────────────────────────────── */
function estimateReadTime(html = "") {
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatContent(html = "") {
  if (!html.includes("<")) {
    return html.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
  }
  return html;
}

/* ── Share sheet ──────────────────────────────────────────── */
function ShareSheet({ title }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
  };

  const options = [
    { label: "Copy Link",   icon: copied ? <Check size={16} /> : <Link2 size={16} />,    action: copyLink,  active: copied },
    { label: "Twitter / X", icon: <Twitter size={16} />,   action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank") },
    { label: "Facebook",    icon: <Facebook size={16} />,  action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank") },
    { label: "WhatsApp",    icon: <span style={{ fontSize: 16 }}>💬</span>, action: () => window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`, "_blank") },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }} transition={{ duration: 0.25 }}
      className="absolute bottom-full right-0 mb-2 w-52 border border-neutral-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50">
      <div className="p-3 border-b border-neutral-100">
        <p className="font-heading font-bold text-[10px] tracking-[0.14em] uppercase text-neutral-400">Share Article</p>
      </div>
      {options.map(opt => (
        <motion.button key={opt.label} whileHover={{ backgroundColor: "#FBEAE2" }}
          onClick={opt.action}
          className="w-full flex items-center gap-3 px-4 py-2.5 border-none cursor-pointer text-left transition-colors"
          style={{ background: opt.active ? "#FBEAE2" : "transparent", color: opt.active ? "#9F4325" : "#0E1A2B" }}>
          <span style={{ color: opt.active ? "#9F4325" : "#7A7A7A" }}>{opt.icon}</span>
          <span className="font-heading font-semibold text-[12px]">{opt.label}</span>
          {opt.active && <span className="ml-auto font-heading font-bold text-[10px] uppercase tracking-wide text-primary-600">Copied!</span>}
        </motion.button>
      ))}
    </motion.div>
  );
}

/* ── Related card ─────────────────────────────────────────── */
function RelatedCard({ blog }) {
  return (
    <motion.a href={`/blog/${blog.id}`}
      whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.3 }}
      className="block border border-neutral-200 bg-white overflow-hidden group"
      style={{ textDecoration: "none" }}>
      <div className="relative h-40 overflow-hidden">
        {blog.image ? (
          <motion.img src={blog.image} alt={blog.title}
            whileHover={{ scale: 1.05 }} transition={{ duration: 0.5 }}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {blog.category && (
          <span className="absolute top-2.5 left-2.5 text-[9px] tracking-[0.14em] uppercase font-bold px-2 py-0.5 text-white bg-primary-600">
            {blog.category}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400" />
      </div>
      <div className="p-4">
        <h4 className="font-heading font-bold text-[13px] leading-snug line-clamp-2 text-secondary-600">{blog.title}</h4>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-body text-[11px] text-neutral-400">{blog.date}</span>
          <span className="font-heading font-bold text-[10px] uppercase tracking-wide flex items-center gap-1 text-primary-600">
            Read <ChevronRight size={10} />
          </span>
        </div>
      </div>
    </motion.a>
  );
}

/* ── Sticky CTA bar ───────────────────────────────────────── */
function CTABar({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t bg-secondary-600"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-heading font-bold text-white text-[13px] sm:text-[15px] leading-snug">
                Interested in a property in Ibadan?
              </p>
              <p className="font-body text-white/55 text-[12px] mt-0.5 hidden sm:block">
                Our team is ready to help you find the right space.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <motion.a href="/#properties" whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-6 border border-white/25 hover:border-white/60 font-heading font-bold text-[11px] tracking-[0.08em] uppercase text-white transition-colors"
                style={{ textDecoration: "none" }}>
                View Properties
              </motion.a>
              <motion.a href="/#contact" whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-9 sm:h-10 px-4 sm:px-6 font-heading font-bold text-[11px] tracking-[0.08em] uppercase text-white bg-primary-600 hover:bg-primary-500 border-none transition-colors"
                style={{ textDecoration: "none" }}>
                <MessageSquare size={13} /> Enquire Now
              </motion.a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════ */
export default function BlogDetail() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { blogs }      = useBlog();
  const [shareOpen, setShareOpen] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const [scrollPct, setScrollPct]   = useState(0);
  const shareRef = useRef(null);

  const blog    = blogs?.find(b => String(b.id) === String(id));
  const related = blogs
    ?.filter(b => b.id !== id && b.category === blog?.category)
    .slice(0, 3) ?? blogs?.filter(b => b.id !== id).slice(0, 3) ?? [];

  useEffect(() => {
    const h = () => {
      const scrolled = window.scrollY;
      const total    = document.body.scrollHeight - window.innerHeight;
      const pct      = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;
      setScrollPct(pct);
      setCtaVisible(pct > 30 && pct < 95);
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const h = e => { if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [id]);

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-100">
        <div className="text-center">
          <h2 className="font-heading font-bold text-xl text-secondary-600">Article not found</h2>
          <button onClick={() => navigate("/blog")}
            className="mt-4 font-heading font-bold text-sm border-none bg-transparent cursor-pointer text-primary-600">
            ← Back to Blog
          </button>
        </div>
      </div>
    );
  }

  const readTime = estimateReadTime(blog.content);
  const coverImg = blog.images?.[0] || blog.image || null;

  return (
    <div className="min-h-screen pb-24 bg-neutral-100">

      {/* Reading progress */}
      <motion.div className="fixed top-0 left-0 z-50 h-[3px] bg-primary-600"
        style={{ width: `${scrollPct}%` }} />

      {/* Back nav */}
      <div className="sticky top-0 z-30 border-b border-neutral-200 backdrop-blur-md"
        style={{ background: "rgba(245,244,241,0.92)" }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/blog")}
            className="flex items-center gap-2 font-heading font-bold text-[11px] tracking-[0.1em] uppercase border-none bg-transparent cursor-pointer text-neutral-500 hover:text-primary-600 transition-colors">
            <ArrowLeft size={13} /> Back to Blog
          </motion.button>

          <div className="relative" ref={shareRef}>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShareOpen(v => !v)}
              className={`flex items-center gap-2 h-8 px-4 border font-heading font-bold text-[11px] tracking-[0.08em] uppercase cursor-pointer transition-colors ${
                shareOpen ? "border-primary-600 bg-primary-50 text-primary-600" : "border-neutral-200 bg-white text-secondary-600"
              }`}>
              <Share2 size={13} />
              <span className="hidden sm:inline">Share</span>
            </motion.button>
            <AnimatePresence>
              {shareOpen && <ShareSheet title={blog.title} />}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Hero image */}
      {coverImg && (
        <motion.div initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-full overflow-hidden"
          style={{ height: "clamp(220px, 45vw, 480px)" }}>
          <img src={coverImg} alt={blog.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 max-w-[1200px] mx-auto">
            {blog.category && (
              <span className="inline-block text-[10px] tracking-[0.18em] uppercase font-heading font-bold px-3 py-1 text-white mb-3 bg-primary-600">
                {blog.category}
              </span>
            )}
            <h1 className="font-heading text-white leading-[1.15]"
              style={{ fontSize: "clamp(1.4rem, 4vw, 2.6rem)", fontWeight: 700, maxWidth: 800 }}>
              {blog.title}
            </h1>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-primary-600" />
        </motion.div>
      )}

      {/* Article body */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 lg:gap-14">

          {/* Main */}
          <article>
            {/* Title (no cover) */}
            {!coverImg && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                {blog.category && (
                  <span className="inline-block text-[10px] tracking-[0.18em] uppercase font-heading font-bold px-3 py-1 text-white mb-4 bg-primary-600">
                    {blog.category}
                  </span>
                )}
                <h1 className="font-heading leading-[1.15] mb-6 text-secondary-600"
                  style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", fontWeight: 700 }}>
                  {blog.title}
                </h1>
              </motion.div>
            )}

            {/* Meta bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4 border-y border-neutral-200">
              {[
                { icon: <User size={13} />,     text: blog.author || "TJC Properties" },
                { icon: <Calendar size={13} />, text: blog.date },
                { icon: <Clock size={13} />,    text: `${readTime} min read` },
                blog.category && { icon: <Tag size={13} />, text: blog.category },
              ].filter(Boolean).map((m, i) => (
                <div key={i} className="flex items-center gap-1.5 font-body text-[12px] text-neutral-500">
                  <span className="text-primary-600">{m.icon}</span>
                  {m.text}
                </div>
              ))}
              <div className="ml-auto relative" ref={undefined}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShareOpen(v => !v)}
                  className="flex items-center gap-1.5 h-7 px-3 border border-neutral-200 hover:border-primary-600 hover:text-primary-600 font-heading font-bold text-[10px] tracking-[0.08em] uppercase cursor-pointer text-neutral-500 bg-transparent transition-colors">
                  <Share2 size={11} /> Share
                </motion.button>
              </div>
            </motion.div>

            {/* Description callout */}
            {blog.description && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="my-6 pl-4 py-1 border-l-4 border-primary-600">
                <p className="font-heading font-semibold text-[15px] leading-relaxed italic text-secondary-500">
                  {blog.description}
                </p>
              </motion.div>
            )}

            {/* Body */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="blog-content mt-6"
              dangerouslySetInnerHTML={{ __html: formatContent(blog.content) }} />

            {/* Gallery */}
            {blog.images?.length > 1 && (
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                transition={{ duration: 0.6 }} className="mt-10">
                <p className="font-heading font-bold text-[11px] tracking-[0.16em] uppercase mb-4 text-primary-600">Gallery</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {blog.images.slice(1).map((img, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.02 }}
                      className="aspect-square overflow-hidden border border-neutral-200">
                      <img src={img} alt={`gallery-${i}`} className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Bottom share */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-10 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-heading font-bold text-[11px] tracking-[0.14em] uppercase text-neutral-400">Found this useful?</p>
                <p className="font-body text-sm mt-0.5 text-secondary-600">Share with someone looking for property in Ibadan.</p>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { icon: <Link2 size={14} />,    action: () => navigator.clipboard?.writeText(window.location.href), label: "Copy" },
                  { icon: <Twitter size={14} />,  action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(window.location.href)}`, "_blank"), label: "Tweet" },
                  { icon: <span>💬</span>,         action: () => window.open(`https://wa.me/?text=${encodeURIComponent(blog.title + " " + window.location.href)}`, "_blank"), label: "WhatsApp" },
                ].map((s, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }}
                    onClick={s.action} title={s.label}
                    className="w-9 h-9 border border-neutral-200 bg-white flex items-center justify-center cursor-pointer text-secondary-600 hover:bg-primary-50 hover:border-primary-600 hover:text-primary-600 transition-colors">
                    {s.icon}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Enquire CTA block */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="mt-10 p-6 sm:p-8 relative overflow-hidden bg-secondary-600">
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
                backgroundSize: "40px 40px",
              }} />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div>
                  <p className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase mb-2 text-primary-400">TJC Properties</p>
                  <h3 className="font-heading font-bold text-white leading-snug"
                    style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)" }}>
                    Looking for your next property<br className="hidden sm:block" /> in Ibadan?
                  </h3>
                  <p className="font-body text-white/55 text-sm mt-2 max-w-[380px]">
                    From residential flats to commercial warehouses — our team is ready to help.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                  <motion.a href="/#properties" whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center h-10 px-5 border border-white/25 hover:border-white/60 font-heading font-bold text-[11px] tracking-[0.08em] uppercase text-white transition-colors"
                    style={{ textDecoration: "none" }}>
                    Browse Properties
                  </motion.a>
                  <motion.a href="/#contact" whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 h-10 px-5 font-heading font-bold text-[11px] tracking-[0.08em] uppercase text-white bg-primary-600 hover:bg-primary-500 border-none transition-colors"
                    style={{ textDecoration: "none" }}>
                    <MessageSquare size={13} /> Enquire Now
                  </motion.a>
                </div>
              </div>
            </motion.div>

            {/* ── COMMENTS ── */}
            <CommentsSection blogId={String(id)} />

          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">
              <div className="border border-neutral-200 bg-white p-5">
                <p className="font-heading font-bold text-[10px] tracking-[0.16em] uppercase mb-4 text-neutral-400">Written By</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 font-heading font-bold text-sm text-white bg-primary-600">
                    {(blog.author || "T").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-[13px] text-secondary-600">{blog.author || "TJC Properties"}</p>
                    <p className="font-body text-[11px] text-neutral-400">TJC Properties Team</p>
                  </div>
                </div>
              </div>

              <div className="border border-neutral-200 bg-white p-5 space-y-3">
                <p className="font-heading font-bold text-[10px] tracking-[0.16em] uppercase text-neutral-400">Article Info</p>
                {[
                  { label: "Published", value: blog.date },
                  { label: "Read Time", value: `${readTime} min` },
                  { label: "Category",  value: blog.category || "General" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-body text-[12px] text-neutral-400">{f.label}</span>
                    <span className="font-heading font-bold text-[12px] text-secondary-600">{f.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-5 border-l-4 border-primary-600 bg-primary-50">
                <p className="font-heading font-bold text-[13px] leading-snug text-secondary-600">Ready to find your property?</p>
                <p className="font-body text-[12px] mt-1.5 mb-4 text-neutral-500">Speak with the TJC team today.</p>
                <motion.a href="/#contact" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 h-9 w-full font-heading font-bold text-[11px] tracking-[0.08em] uppercase text-white bg-primary-600 hover:bg-primary-500 border-none transition-colors"
                  style={{ textDecoration: "none" }}>
                  <MessageSquare size={12} /> Contact Us
                </motion.a>
              </div>
            </div>
          </aside>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="mt-14 pt-10 border-t border-neutral-200">
            <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="inline-flex items-center gap-2 mb-1">
                  <span className="inline-block w-4 h-px bg-primary-600" />
                  <p className="font-heading font-bold text-[11px] tracking-[0.18em] uppercase text-primary-600">More Articles</p>
                </div>
                <h3 className="font-heading font-bold text-xl text-secondary-600">Related Reads</h3>
              </div>
              <motion.a href="/blog" whileHover={{ x: 3 }}
                className="font-heading font-bold text-[11px] tracking-[0.08em] uppercase flex items-center gap-1 text-primary-600"
                style={{ textDecoration: "none" }}>
                All Articles <ChevronRight size={13} />
              </motion.a>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((b, i) => (
                <motion.div key={b.id}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}>
                  <RelatedCard blog={b} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <CTABar visible={ctaVisible} />

      <style>{`
        .blog-content { font-family:'Archivo Narrow','Georgia',serif; font-size:clamp(15px,1.8vw,17px); line-height:1.85; color:#2d2d2d; }
        .blog-content p { margin-bottom:1.35em; }
        .blog-content h1,.blog-content h2,.blog-content h3,.blog-content h4 { font-family:'Montserrat',sans-serif; font-weight:700; color:#0E1A2B; margin:1.8em 0 0.6em; line-height:1.25; }
        .blog-content h2 { font-size:clamp(1.2rem,2.5vw,1.5rem); }
        .blog-content h3 { font-size:clamp(1rem,2vw,1.2rem); }
        .blog-content ul,.blog-content ol { margin:1em 0 1.4em 1.4em; display:flex; flex-direction:column; gap:0.5em; }
        .blog-content ul li::marker { color:#9F4325; }
        .blog-content ol li::marker { color:#9F4325; font-weight:700; }
        .blog-content a { color:#9F4325; text-decoration:underline; }
        .blog-content a:hover { color:#D97C5C; }
        .blog-content blockquote { border-left:4px solid #9F4325; padding:0.6em 1.2em; margin:1.6em 0; background:#FBEAE2; font-style:italic; font-weight:600; color:#1C2A3F; }
        .blog-content img { width:100%; max-width:100%; height:auto; display:block; margin:1.8em 0; border:1px solid #E5E0D8; }
        .blog-content strong { color:#0E1A2B; font-weight:700; }
        .blog-content hr { border:none; border-top:1px solid #E5E0D8; margin:2em 0; }
        .blog-content table { width:100%; border-collapse:collapse; margin:1.5em 0; font-size:14px; }
        .blog-content th { background:#0E1A2B; color:white; padding:10px 14px; font-family:'Montserrat',sans-serif; font-size:11px; letter-spacing:0.06em; text-align:left; }
        .blog-content td { padding:10px 14px; border-bottom:1px solid #E5E0D8; }
        .blog-content tr:nth-child(even) td { background:#F5F4F1; }
      `}</style>
    </div>
  );
}