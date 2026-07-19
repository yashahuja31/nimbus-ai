"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Server } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ToastProvider";
import { CloudAccount } from "@/lib/api";
import { useNimbusApi } from "@/lib/useApi";

const REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-south-1", "ap-southeast-1"];

export default function AccountsPage() {
  const api = useNimbusApi();
  const toast = useToast();
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh() {
    setLoading(true);
    api.listAccounts().then(setAccounts).catch(() => setAccounts([])).finally(() => setLoading(false));
  }

  async function connect() {
    setConnecting(true);
    try {
      const account = await api.connectAccount(region, label.trim() || "default");
      setAccounts((prev) => [...prev, account]);
      setLabel("");
      toast.success(`Connected "${account.label}" (${account.region}).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setConnecting(false);
    }
  }

  async function remove(account: CloudAccount) {
    setRemovingId(account.id);
    try {
      await api.deleteAccount(account.id);
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
      toast.success(`Removed "${account.label}".`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-grid mx-auto max-w-3xl px-6 py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-display font-semibold text-ink">Cloud accounts</h1>
          <p className="text-dim text-sm mt-1.5">
            Accounts Nimbus can plan and execute changes against. Credentials come from the backend's own
            environment for this MVP — see the README's security notes.
          </p>
        </motion.div>

        <Card className="p-5 space-y-3">
          <p className="text-dim text-xs uppercase tracking-wide">Connect a new account</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (e.g. production)"
              className="flex-1 rounded-md border border-line bg-base p-2.5 text-sm text-ink placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-pulse"
            />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-md border border-line bg-base p-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-pulse"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <Button disabled={connecting} onClick={connect}>
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              {connecting ? "Connecting…" : "Connect"}
            </Button>
          </div>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-40" />
              </Card>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 rounded-xl border border-dashed border-line">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dim/10 text-dim mb-3">
              <Server className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="text-sm text-ink">No accounts connected</p>
            <p className="text-xs text-dim mt-1">Connect one above to start planning changes against it.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {accounts.map((account) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card interactive className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint/10 text-mint">
                        <Server className="h-4 w-4" strokeWidth={2} />
                      </span>
                      <div>
                        <p className="text-ink text-sm font-medium">{account.label}</p>
                        <p className="text-dim text-xs font-mono">{account.provider} · {account.region}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(account)}
                      disabled={removingId === account.id}
                      className="text-dim hover:text-coral transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </>
  );
}
