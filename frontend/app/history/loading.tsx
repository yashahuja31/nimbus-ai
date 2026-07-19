import { NavBar } from "@/components/NavBar";

export default function Loading() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-10 animate-pulse">
        <div className="h-8 w-56 rounded bg-panel mb-6" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg border border-line bg-panel" />
          ))}
        </div>
      </main>
    </>
  );
}
