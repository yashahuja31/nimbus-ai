"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plan, api } from "@/lib/api";

export default function DashboardPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    api.listPlans().then(setPlans).catch(() => setPlans([]));
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

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="text-dim text-sm mt-1">A quick look at what Nimbus has planned and done.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-dim text-xs uppercase tracking-wide">Cloud account</p>
            <p className="text-ink mt-2">{connected ? "AWS connected" : "Not connected"}</p>
            {!connected && (
              <Button className="mt-3" disabled={connecting} onClick={connect}>
                {connecting ? "Connecting…" : "Connect AWS account"}
              </Button>
            )}
          </Card>
          <Card className="p-5">
            <p className="text-dim text-xs uppercase tracking-wide">Awaiting approval</p>
            <p className="text-3xl text-ink mt-2">{pending}</p>
          </Card>
          <Card className="p-5">
            <p className="text-dim text-xs uppercase tracking-wide">Completed plans</p>
            <p className="text-3xl text-ink mt-2">{completed}</p>
          </Card>
        </div>

        <Card className="p-6 flex items-center justify-between">
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
