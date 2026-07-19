import { NavBar } from "@/components/NavBar";
import { ChatPanel } from "@/components/ChatPanel";

export default function ChatPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-grid mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-semibold text-ink">Chat</h1>
          <p className="text-dim text-sm mt-1.5">
            Plan → Terraform → your approval → execution → verified summary.
          </p>
        </div>
        <ChatPanel />
      </main>
    </>
  );
}
