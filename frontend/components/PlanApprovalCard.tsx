"use client";

import { useState } from "react";
import { Plan, api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PlanApprovalCard({ plan, onUpdate }: { plan: Plan; onUpdate: (p: Plan) => void }) {
  const [busy, setBusy] = useState(false);
  const [showHcl, setShowHcl] = useState(false);

  async function act(fn: (id: string) => Promise<Plan>) {
    setBusy(true);
    try {
      const updated = await fn(plan.id);
      onUpdate(updated);
    } finally {
      setBusy(false);
    }
  }

  const pending = plan.status === "proposed";

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-dim">You asked</p>
          <p className="text-ink">{plan.request_text}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Badge kind="risk" value={plan.risk_level} />
          <Badge kind="status" value={plan.status} />
        </div>
      </div>

      <p className="text-sm text-ink/90 border-l-2 border-signal/40 pl-3">{plan.summary}</p>

      <div className="space-y-2">
        {plan.steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center justify-between rounded border border-line px-3 py-2 text-sm font-mono"
          >
            <span className="text-ink">{step.operation}</span>
            <Badge kind="status" value={step.status} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-dim">
        <button onClick={() => setShowHcl((s) => !s)} className="hover:text-signal underline underline-offset-4">
          {showHcl ? "Hide" : "Show"} generated Terraform
        </button>
        <span>Est. ${plan.estimated_monthly_cost_usd}/mo</span>
      </div>

      {showHcl && (
        <pre className="rounded bg-base border border-line p-3 text-xs font-mono text-signal overflow-x-auto">
          {plan.terraform_hcl || "// no infrastructure changes"}
        </pre>
      )}

      {pending && (
        <div className="flex gap-3 pt-1">
          <Button disabled={busy} onClick={() => act(api.approvePlan)}>
            Approve &amp; execute
          </Button>
          <Button disabled={busy} variant="ghost" onClick={() => act(api.rejectPlan)}>
            Reject
          </Button>
        </div>
      )}
    </Card>
  );
}
