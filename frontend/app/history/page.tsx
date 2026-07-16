"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { ExecutionHistoryTable } from "@/components/ExecutionHistoryTable";
import { ExecutionLog } from "@/lib/api";
import { useNimbusApi } from "@/lib/useApi";

export default function HistoryPage() {
  const api = useNimbusApi();
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  useEffect(() => {
    api.listHistory().then(setLogs).catch(() => setLogs([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold text-ink">Execution history</h1>
          <p className="text-dim text-sm mt-1">Every action Nimbus has taken, in order.</p>
        </div>
        <ExecutionHistoryTable logs={logs} />
      </main>
    </>
  );
}
