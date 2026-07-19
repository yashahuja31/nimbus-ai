"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-grid">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coral/10 text-coral mb-4">
        <AlertTriangle className="h-5 w-5" strokeWidth={2} />
      </span>
      <h1 className="text-xl font-display font-semibold text-ink">Something went wrong</h1>
      <p className="text-dim text-sm mt-2 max-w-sm">
        {error.message || "An unexpected error occurred. Try again, or head back to the dashboard."}
      </p>
      <div className="flex gap-3 mt-6">
        <Button onClick={reset}>Try again</Button>
        <a href="/dashboard">
          <Button variant="ghost">Go to dashboard</Button>
        </a>
      </div>
    </main>
  );
}
