"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { ExecutionHistoryTable } from "@/components/ExecutionHistoryTable";
import { ExecutionLog, api } from "@/lib/api";

export default function HistoryPage() {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  useEffect(() => {
    api.listHistory().then(setLogs).catch(() => setLogs([]));
  }, []);

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ink">Execution history</h1>
          <p className="text-dim text-sm mt-1">Every action Nimbus has taken, in order.</p>
        </div>
        <ExecutionHistoryTable logs={logs} />
      </main>
    </>
  );
}
