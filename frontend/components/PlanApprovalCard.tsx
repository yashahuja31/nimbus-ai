"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, X, Copy, CheckCheck, ChevronDown, Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";
import { Plan } from "@/lib/api";
import { useNimbusApi } from "@/lib/useApi";
import { useToast } from "@/components/ToastProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const RISK_EDGE: Record<string, string> = {
  low: "before:bg-mint",
  medium: "before:bg-amber",
  high: "before:bg-coral",
};

const STEP_ICON: Record<string, { icon: typeof Circle; className: string }> = {
  proposed: { icon: Circle, className: "text-dim" },
  approved: { icon: Circle, className: "text-pulse" },
  executing: { icon: Loader2, className: "text-amber animate-spin" },
  completed: { icon: CheckCircle2, className: "text-mint" },
  failed: { icon: XCircle, className: "text-coral" },
  rejected: { icon: XCircle, className: "text-dim" },
};

export function PlanApprovalCard({ plan, onUpdate }: { plan: Plan; onUpdate: (p: Plan) => void }) {
  const api = useNimbusApi();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [showHcl, setShowHcl] = useState(false);
  const [copied, setCopied] = useState(false);

  async function act(fn: (id: string) => Promise<Plan>, successMessage: string) {
    setBusy(true);
    try {
      const updated = await fn(plan.id);
      onUpdate(updated);
      toast.success(successMessage);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function copyHcl() {
    navigator.clipboard.writeText(plan.terraform_hcl || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const pending = plan.status === "proposed";

  return (
    <Card
      interactive
      className={clsx(
        "relative p-5 pl-6 space-y-4 overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-1",
        RISK_EDGE[plan.risk_level] || "before:bg-dim"
      )}
    >
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

      <p className="text-sm text-ink/90 border-l-2 border-pulse/40 pl-3">{plan.summary}</p>

      <div className="space-y-1.5">
        {plan.steps.map((step) => {
          const { icon: Icon, className } = STEP_ICON[step.status] || STEP_ICON.proposed;
          return (
            <div
              key={step.id}
              className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm font-mono"
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${className}`} strokeWidth={2.5} />
              <span className="text-ink">{step.operation}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-dim">
        <button
          onClick={() => setShowHcl((s) => !s)}
          className="flex items-center gap-1 hover:text-pulse transition-colors"
        >
          <ChevronDown className={clsx("h-3.5 w-3.5 transition-transform", showHcl && "rotate-180")} />
          {showHcl ? "Hide" : "Show"} generated Terraform
        </button>
        <span className="font-mono text-xs">${plan.estimated_monthly_cost_usd}/mo</span>
      </div>

      {showHcl && (
        <div className="rounded-lg border border-line bg-base overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-line bg-panel/50">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-coral/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-mint/60" />
            </div>
            <button
              onClick={copyHcl}
              className="flex items-center gap-1.5 text-xs text-dim hover:text-ink transition-colors"
            >
              {copied ? <CheckCheck className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="p-3 text-xs font-mono text-mint overflow-x-auto">
            {plan.terraform_hcl || "// no infrastructure changes"}
          </pre>
        </div>
      )}

      {pending && (
        <div className="flex gap-3 pt-1">
          <Button disabled={busy} onClick={() => act(api.approvePlan, "Plan approved — executing now.")}>
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Approve &amp; execute
          </Button>
          <Button disabled={busy} variant="ghost" onClick={() => act(api.rejectPlan, "Plan rejected.")}>
            <X className="h-4 w-4" strokeWidth={2.5} />
            Reject
          </Button>
        </div>
      )}
    </Card>
  );
}
