"use client";

import { motion } from "framer-motion";

export function HeroCopy() {
  return (
    <>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-pulse text-sm tracking-[0.2em] uppercase mb-5 font-mono"
      >
        Nimbus AI · Your AI Cloud Engineer
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl md:text-6xl font-display font-semibold text-ink max-w-3xl leading-[1.08] tracking-tight"
      >
        Tell it what to build.
        <br />
        Review the plan. Approve the change.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-dim mt-5 max-w-xl text-base"
      >
        Nimbus plans infrastructure changes, generates the Terraform, and executes against your
        cloud account — nothing runs until you say so.
      </motion.p>
    </>
  );
}
