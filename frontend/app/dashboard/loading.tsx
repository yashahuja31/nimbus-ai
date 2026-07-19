import { NavBar } from "@/components/NavBar";

export default function Loading() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8 animate-pulse">
        <div className="h-8 w-64 rounded bg-panel" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-line bg-panel" />
          ))}
        </div>
        <div className="h-24 rounded-xl border border-line bg-panel" />
      </main>
    </>
  );
}
