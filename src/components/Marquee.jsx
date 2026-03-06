import { motion } from "framer-motion";
import { MARQUEE_ITEMS } from "./../data";

export default function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="bg-primary-600 overflow-hidden py-3">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        className="flex whitespace-nowrap"
      >
        {doubled.map((text, i) => (
          <span
            key={i}
            className="inline-block px-10 text-white font-heading font-bold text-[11px] tracking-[0.15em] uppercase"
          >
            {text}
            <span className="opacity-40 ml-5">◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
