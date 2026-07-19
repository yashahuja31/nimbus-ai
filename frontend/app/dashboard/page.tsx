"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { Server, Clock, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plan, ExecutionLog, CloudAccount } from "@/lib/api";
import { useNimbusApi } from "@/lib/useApi";

const EXAMPLES = [
  "Create an S3 bucket for application logs",
  "Set up a versioned, encrypted bucket named backups",
  "Create a bucket for static assets with encryption",
];

export default function DashboardPage() {
  const api = useNimbusApi();
  const { user } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.listPlans(), api.listHistory(5), api.listAccounts()]).then(
      ([plansRes, logsRes, accountsRes]) => {
        if (plansRes.status === "fulfilled") setPlans(plansRes.value);
        if (logsRes.status === "fulfilled") setLogs(logsRes.value);
        if (accountsRes.status === "fulfilled") setAccounts(accountsRes.value);
        setLoading(false);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = plans.filter((p) => p.status === "proposed").length;
  const completed = plans.filter((p) => p.status === "completed").length;

  const stats = [
    {
      label: "Cloud accounts",
      icon: Server,
      value: accounts.length,
      accent: accounts.length > 0 ? "text-mint" : "text-dim",
      href: "/accounts",
    },
    { label: "Awaiting approval", icon: Clock, value: pending, accent: pending > 0 ? "text-amber" : "text-ink" },
    { label: "Completed plans", icon: CheckCircle2, value: completed, accent: "text-mint" },
  ];

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-grid mx-auto max-w-5xl px-6 py-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-display font-semibold text-ink">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-dim text-sm mt-1.5">A quick look at what Nimbus has planned and done.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-5 h-full space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </Card>
              ))
            : stats.map((stat, i) => {
                const Icon = stat.icon;
                const content = (
                  <Card interactive className="p-5 h-full">
                    <div className="flex items-center justify-between">
                      <p className="text-dim text-xs uppercase tracking-wide">{stat.label}</p>
                      <Icon className={`h-4 w-4 ${stat.accent}`} strokeWidth={2} />
                    </div>
                    <p className="text-4xl font-display text-ink mt-3">{stat.value}</p>
                    {stat.href && (
                      <p className="text-xs text-dim mt-2">
                        {accounts.length > 0 ? "Manage accounts" : "Connect one"} <ArrowRight className="h-3 w-3 inline" />
                      </p>
                    )}
                  </Card>
                );
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                  >
                    {stat.href ? <Link href={stat.href}>{content}</Link> : content}
                  </motion.div>
                );
              })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <motion.div
            className="md:col-span-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pulse/15 text-pulse">
                  <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-ink font-medium">Ready to make a change?</p>
                  <p className="text-dim text-sm mt-1">
                    Describe it in plain English — Nimbus proposes a plan you approve before anything runs.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {EXAMPLES.map((ex) => (
                  <Link
                    key={ex}
                    href="/chat"
                    className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm text-dim hover:text-ink hover:border-pulse/40 transition-colors group"
                  >
                    <span className="font-mono text-xs">{ex}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                ))}
              </div>
              <Link href="/chat" className="mt-5">
                <Button className="w-full">Open chat</Button>
              </Link>
            </Card>
          </motion.div>

          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.27 }}
          >
            <Card className="p-6 h-full">
              <p className="text-dim text-xs uppercase tracking-wide mb-4">Recent activity</p>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-3.5 w-full" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-dim">Nothing yet — approve a plan and it'll show up here.</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          log.level === "success" ? "bg-mint" : log.level === "error" ? "bg-coral" : "bg-dim"
                        }`}
                      />
                      <span className="text-dim font-mono text-xs leading-relaxed">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
              <Link
                href="/history"
                className="mt-4 inline-flex items-center gap-1 text-xs text-dim hover:text-pulse transition-colors"
              >
                View full history <ArrowRight className="h-3 w-3" />
              </Link>
            </Card>
          </motion.div>
        </div>
      </main>
    </>
  );
}
