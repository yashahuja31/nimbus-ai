"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NavBar } from "@/components/NavBar";
import { ExecutionHistoryTable } from "@/components/ExecutionHistoryTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ExecutionLog } from "@/lib/api";
import { useNimbusApi } from "@/lib/useApi";

export default function HistoryPage() {
  const api = useNimbusApi();
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listHistory().then(setLogs).catch(() => setLogs([])).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-grid mx-auto max-w-4xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <h1 className="text-3xl font-display font-semibold text-ink">Execution history</h1>
          <p className="text-dim text-sm mt-1.5">Every action Nimbus has taken, in order.</p>
        </motion.div>
        {loading ? (
          <div className="rounded-xl border border-line bg-panel divide-y divide-line overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <ExecutionHistoryTable logs={logs} />
        )}
      </main>
    </>
  );
}
