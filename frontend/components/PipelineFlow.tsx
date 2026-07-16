"use client";

import { motion } from "framer-motion";

const STAGES = ["Request", "Plan", "Terraform", "Approve", "Execute", "Verified"];

export function PipelineFlow() {
  const positions = STAGES.map((_, i) => (i / (STAGES.length - 1)) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto py-10">
      <div className="relative h-px bg-line mx-6">
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-pulse shadow-[0_0_16px_4px_rgba(108,140,255,0.55)]"
          animate={{ left: positions.map((p) => `${p}%`) }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            times: positions.map((_, i) => i / (positions.length - 1)),
          }}
          style={{ marginLeft: "-5px" }}
        />
        {positions.map((p, i) => (
          <div
            key={STAGES[i]}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-line ring-4 ring-base"
            style={{ left: `${p}%` }}
          />
        ))}
      </div>
      <div className="relative mx-6 mt-3">
        {STAGES.map((stage, i) => (
          <span
            key={stage}
            className="absolute -translate-x-1/2 text-[11px] sm:text-xs font-mono text-dim whitespace-nowrap"
            style={{ left: `${positions[i]}%` }}
          >
            {stage}
          </span>
        ))}
      </div>
    </div>
  );
}
