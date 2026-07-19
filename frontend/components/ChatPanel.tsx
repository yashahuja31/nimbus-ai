"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { Plan } from "@/lib/api";
import { useNimbusApi } from "@/lib/useApi";
import { useToast } from "@/components/ToastProvider";
import { PlanApprovalCard } from "@/components/PlanApprovalCard";
import { Button } from "@/components/ui/button";

const EXAMPLES = [
  "Create an S3 bucket for application logs",
  "Set up a versioned, encrypted bucket named my-app-backups",
];

const POLL_INTERVAL_MS = 2500;

export function ChatPanel() {
  const api = useNimbusApi();
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);

  const plansRef = useRef(plans);
  plansRef.current = plans;

  async function send(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const plan = await api.chat(text);
      setPlans((prev) => [plan, ...prev]);
      setMessage("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Poll any plan that's currently executing until it resolves, so approving
  // a plan actually shows its progress instead of requiring a manual refresh.
  useEffect(() => {
    const interval = setInterval(async () => {
      const executing = plansRef.current.filter((p) => p.status === "executing");
      if (executing.length === 0) return;

      const results = await Promise.allSettled(executing.map((p) => api.getPlan(p.id)));
      results.forEach((result, i) => {
        if (result.status !== "fulfilled") return;
        const updated = result.value;
        const previous = executing[i];
        if (previous.status === "executing" && updated.status !== "executing") {
          if (updated.status === "completed") toast.success(`"${updated.request_text}" completed.`);
          if (updated.status === "failed") toast.error(`"${updated.request_text}" failed — check history for details.`);
        }
        setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(message);
            }
          }}
          placeholder="Tell Nimbus what to do — e.g. 'Create an S3 bucket for app logs'"
          rows={3}
          className="w-full rounded-lg border border-line bg-panel p-3 text-sm text-ink placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-pulse resize-none"
        />
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setMessage(ex)}
                className="rounded-full border border-line px-3 py-1 text-xs text-dim hover:text-pulse hover:border-pulse/40 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
          <Button disabled={loading} onClick={() => send(message)}>
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-base/40 border-t-base animate-spin" />
                Planning…
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
                Send
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {plans.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 rounded-xl border border-dashed border-line">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pulse/10 text-pulse mb-3">
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="text-sm text-ink">No plans yet</p>
            <p className="text-xs text-dim mt-1 max-w-xs">
              Describe what you want and Nimbus will propose a reviewable plan — nothing runs until you approve it.
            </p>
          </div>
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
