import { NavBar } from "@/components/NavBar";

export default function Loading() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-10 animate-pulse">
        <div className="h-8 w-40 rounded bg-panel mb-6" />
        <div className="h-28 rounded-xl border border-line bg-panel" />
      </main>
    </>
  );
}
