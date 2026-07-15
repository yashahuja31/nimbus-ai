"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        await api.signup(email, password);
      }
      await api.login(email, password);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div>
          <p className="text-signal text-sm tracking-widest uppercase">Nimbus AI</p>
          <h1 className="text-xl font-semibold text-ink mt-1">
            {mode === "login" ? "Sign in" : "Create your account"}
          </h1>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-line bg-base p-2.5 text-sm text-ink placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-signal"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-line bg-base p-2.5 text-sm text-ink placeholder:text-dim focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button className="w-full" disabled={busy} onClick={submit}>
          {mode === "login" ? "Sign in" : "Sign up"}
        </Button>

        <button
          className="text-xs text-dim hover:text-signal w-full text-center"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </Card>
    </main>
  );
}
