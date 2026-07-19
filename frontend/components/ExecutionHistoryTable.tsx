"use client";

import { CheckCircle2, XCircle, Info, ClipboardList } from "lucide-react";
import { ExecutionLog } from "@/lib/api";

const LEVEL: Record<string, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "text-dim" },
  success: { icon: CheckCircle2, className: "text-mint" },
  error: { icon: XCircle, className: "text-coral" },
};

function groupByDay(logs: ExecutionLog[]) {
  const groups: Record<string, ExecutionLog[]> = {};
  for (const log of logs) {
    const day = new Date(log.created_at).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    (groups[day] ||= []).push(log);
  }
  return groups;
}

export function ExecutionHistoryTable({ logs }: { logs: ExecutionLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-16 rounded-xl border border-dashed border-line">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dim/10 text-dim mb-3">
          <ClipboardList className="h-5 w-5" strokeWidth={2} />
        </span>
        <p className="text-sm text-ink">No executions yet</p>
        <p className="text-xs text-dim mt-1">Approved plans will log here as they run.</p>
      </div>
    );
  }

  const groups = groupByDay(logs);

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([day, dayLogs]) => (
        <div key={day}>
          <p className="text-xs text-dim uppercase tracking-wide mb-2 sticky top-16 bg-base/80 backdrop-blur py-1">
            {day}
          </p>
          <div className="rounded-xl border border-line bg-panel divide-y divide-line overflow-hidden">
            {dayLogs.map((log) => {
              const { icon: Icon, className } = LEVEL[log.level] || LEVEL.info;
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-base/40 transition-colors">
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${className}`} strokeWidth={2} />
                  <span className="text-dim shrink-0 w-16 text-xs font-mono pt-0.5">
                    {new Date(log.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-ink font-mono text-xs leading-relaxed">{log.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
