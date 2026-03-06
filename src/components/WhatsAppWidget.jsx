import { motion } from "framer-motion";

export default function WhatsAppWidget() {
  return (
    <motion.a
      href="https://wa.me/"
      target="_blank"
      rel="noreferrer"
      title="Chat on WhatsApp"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 2, type: "spring", stiffness: 260 }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-2xl no-underline"
      style={{ boxShadow: "0 4px 20px rgba(37,211,102,0.5)" }}
    >
      💬
    </motion.a>
  );
}
