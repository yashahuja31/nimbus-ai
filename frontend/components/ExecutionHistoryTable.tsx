"use client";

import { ExecutionLog } from "@/lib/api";
import clsx from "clsx";

const LEVEL_COLOR: Record<string, string> = {
  info: "text-dim",
  success: "text-signal",
  error: "text-danger",
};

export function ExecutionHistoryTable({ logs }: { logs: ExecutionLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-dim">No executions yet — approved plans will log here.</p>;
  }

  return (
    <div className="divide-y divide-line rounded-lg border border-line bg-panel">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-4 px-4 py-3 text-sm font-mono">
          <span className="text-dim shrink-0 w-40">
            {new Date(log.created_at).toLocaleString()}
          </span>
          <span className={clsx("shrink-0 w-16 uppercase text-xs pt-0.5", LEVEL_COLOR[log.level])}>
            {log.level}
          </span>
          <span className="text-ink">{log.message}</span>
        </div>
      ))}
    </div>
  );
}
