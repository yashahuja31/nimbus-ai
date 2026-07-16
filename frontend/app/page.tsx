import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { PipelineFlow } from "@/components/PipelineFlow";
import { HeroCopy } from "@/components/HeroCopy";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-grid">
      <HeroCopy />

      <PipelineFlow />

      <div className="flex items-center gap-4 mt-6">
        <SignedOut>
          <Link
            href="/sign-up"
            className="inline-flex items-center rounded-md bg-pulse text-base px-6 py-3 text-sm font-medium hover:shadow-glow hover:brightness-110 transition-all"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="text-sm text-dim hover:text-ink transition-colors"
          >
            Sign in
          </Link>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md bg-pulse text-base px-6 py-3 text-sm font-medium hover:shadow-glow hover:brightness-110 transition-all"
          >
            Go to dashboard
          </Link>
        </SignedIn>
      </div>
    </main>
  );
}
