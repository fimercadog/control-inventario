"use client";

import { motion } from "framer-motion";

const BAR_COUNT = 5;

export function VoiceWave({ active }: { active: boolean }) {
  return (
    <div className="flex h-10 items-center justify-center gap-1.5">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full bg-primary-foreground"
          animate={
            active
              ? { height: [10, 32, 14, 28, 10] }
              : { height: 10 }
          }
          transition={
            active
              ? { duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }
              : { duration: 0.2 }
          }
        />
      ))}
    </div>
  );
}
