import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { MessageSquareText, FileCode2, ShieldCheck } from "lucide-react";
import { PipelineFlow } from "@/components/PipelineFlow";
import { HeroCopy } from "@/components/HeroCopy";
import { IconBox } from "@/components/ui/icon-box";

const FEATURES = [
  { icon: MessageSquareText, tone: "pulse" as const, title: "Plan in plain English", body: "Describe the change you want — no console, no YAML to hand-write." },
  { icon: FileCode2, tone: "mint" as const, title: "Review real Terraform", body: "Every plan generates reviewable HCL, not a black-box action." },
  { icon: ShieldCheck, tone: "amber" as const, title: "Approve before anything runs", body: "The executor only fires from a request a human actually clicked." },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-grid py-16">
      <HeroCopy />

      <PipelineFlow />

      <div className="flex items-center gap-4 mt-2 mb-20">
        <SignedOut>
          <Link
            href="/sign-up"
            className="inline-flex items-center rounded-md bg-gradient-to-br from-pulse to-[#8f6cff] text-white px-6 py-3 text-sm font-medium hover:shadow-glow hover:-translate-y-0.5 transition-all"
          >
            Get started
          </Link>
          <Link href="/sign-in" className="text-sm text-dim hover:text-ink transition-colors">
            Sign in
          </Link>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-md bg-gradient-to-br from-pulse to-[#8f6cff] text-white px-6 py-3 text-sm font-medium hover:shadow-glow hover:-translate-y-0.5 transition-all"
          >
            Go to dashboard
          </Link>
        </SignedIn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col items-center text-center gap-3">
            <IconBox icon={f.icon} tone={f.tone} />
            <p className="text-ink font-medium text-sm">{f.title}</p>
            <p className="text-dim text-xs leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
