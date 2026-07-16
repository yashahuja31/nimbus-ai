"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { NavBar } from "@/components/NavBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plan } from "@/lib/api";
import { useNimbusApi } from "@/lib/useApi";

export default function DashboardPage() {
  const api = useNimbusApi();
  const { user } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    api.listPlans().then(setPlans).catch(() => setPlans([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = plans.filter((p) => p.status === "proposed").length;
  const completed = plans.filter((p) => p.status === "completed").length;

  async function connect() {
    setConnecting(true);
    try {
      await api.connectAccount("us-east-1");
      setConnected(true);
    } finally {
      setConnecting(false);
    }
  }

  const stats = [
    { label: "Cloud account", value: connected ? "AWS connected" : "Not connected", isText: true },
    { label: "Awaiting approval", value: pending },
    { label: "Completed plans", value: completed },
  ];

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-dim text-sm mt-1">A quick look at what Nimbus has planned and done.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="p-5 h-full">
                <p className="text-dim text-xs uppercase tracking-wide">{stat.label}</p>
                {stat.isText ? (
                  <p className="text-ink mt-2">{stat.value}</p>
                ) : (
                  <p className="text-3xl font-display text-ink mt-2">{stat.value}</p>
                )}
                {stat.label === "Cloud account" && !connected && (
                  <Button className="mt-3" disabled={connecting} onClick={connect}>
                    {connecting ? "Connecting…" : "Connect AWS account"}
                  </Button>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-ink font-medium">Ready to make a change?</p>
            <p className="text-dim text-sm mt-1">
              Describe it in plain English — Nimbus proposes a plan you approve before anything runs.
            </p>
          </div>
          <Link href="/chat">
            <Button>Open chat</Button>
          </Link>
        </Card>
      </main>
    </>
  );
}
