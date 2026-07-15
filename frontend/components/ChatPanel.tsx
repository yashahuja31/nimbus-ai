"use client";

import { useState } from "react";
import { Plan, api } from "@/lib/api";
import { PlanApprovalCard } from "@/components/PlanApprovalCard";
import { Button } from "@/components/ui/button";

const EXAMPLES = [
  "Create an S3 bucket for application logs",
  "Set up a versioned, encrypted bucket named my-app-backups",
];

export function ChatPanel() {
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
          className="w-full rounded-lg border border-line bg-panel p-3 text-sm text-ink placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-signal"
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setMessage(ex)}
                className="text-xs text-dim hover:text-signal underline underline-offset-4"
              >
                {ex}
              </button>
            ))}
          </div>
          <Button disabled={loading} onClick={() => send(message)}>
            {loading ? "Planning…" : "Send"}
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      <div className="space-y-4">
        {plans.length === 0 && (
          <p className="text-sm text-dim">
            No plans yet. Describe what you want and Nimbus will propose a reviewable plan —
            nothing runs until you approve it.
          </p>
        )}
        {plans.map((plan) => (
          <PlanApprovalCard
            key={plan.id}
            plan={plan}
            onUpdate={(updated) =>
              setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
            }
          />
        ))}
      </div>
    </div>
  );
}
