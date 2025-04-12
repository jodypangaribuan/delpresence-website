"use client";

import { PuffLoader } from "react-spinners";
import { motion } from "framer-motion";
import { siteConfig } from "@/shared/utils/siteConfig";

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
}

export default function LoadingSpinner({
  size = 60,
  text = "Memuat..."
}: LoadingSpinnerProps) {
  const { colors } = siteConfig;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center"
    >
      <PuffLoader
        color={colors.primary}
        size={size}
        speedMultiplier={0.8}
      />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-slate-600 font-medium"
      >
        {text}
      </motion.p>
    </motion.div>
  );
} 