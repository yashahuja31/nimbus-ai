"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plan } from "@/lib/api";
import { useNimbusApi } from "@/lib/useApi";
import { PlanApprovalCard } from "@/components/PlanApprovalCard";
import { Button } from "@/components/ui/button";

const EXAMPLES = [
  "Create an S3 bucket for application logs",
  "Set up a versioned, encrypted bucket named my-app-backups",
];

export function ChatPanel() {
  const api = useNimbusApi();
  const [message, setMessage] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const plan = await api.chat(text);
      setPlans((prev) => [plan, ...prev]);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell Nimbus what to do — e.g. 'Create an S3 bucket for app logs'"
          rows={3}
          className="w-full rounded-lg border border-line bg-panel p-3 text-sm text-ink placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-pulse"
        />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setMessage(ex)}
                className="text-xs text-dim hover:text-pulse underline underline-offset-4"
              >
                {ex}
              </button>
            ))}
          </div>
          <Button disabled={loading} onClick={() => send(message)}>
            {loading ? "Planning…" : "Send"}
          </Button>
        </div>
        {error && <p className="text-sm text-coral">{error}</p>}
      </div>

      <div className="space-y-4">
        {plans.length === 0 && (
          <p className="text-sm text-dim">
            No plans yet. Describe what you want and Nimbus will propose a reviewable plan —
            nothing runs until you approve it.
          </p>
        )}
        <AnimatePresence initial={false}>
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <PlanApprovalCard
                plan={plan}
                onUpdate={(updated) =>
                  setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                }
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
