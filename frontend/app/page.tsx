import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-signal text-sm tracking-widest uppercase mb-4">Nimbus AI</p>
      <h1 className="text-4xl md:text-5xl font-semibold text-ink max-w-2xl leading-tight">
        Tell it what to deploy. Review the plan. Approve the change.
      </h1>
      <p className="text-dim mt-4 max-w-xl">
        Nimbus plans, generates Terraform, and executes cloud infrastructure changes —
        nothing runs against your account until you say so.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex items-center rounded-md bg-signal text-base px-6 py-3 text-sm font-medium hover:bg-signal/90 transition-colors"
      >
        Get started
      </Link>
    </main>
  );
}
