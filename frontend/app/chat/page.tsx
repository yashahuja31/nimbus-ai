import { NavBar } from "@/components/NavBar";
import { ChatPanel } from "@/components/ChatPanel";

export default function ChatPage() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ink">Chat</h1>
          <p className="text-dim text-sm mt-1">
            Plan → Terraform → your approval → execution → verified summary.
          </p>
        </div>
        <ChatPanel />
      </main>
    </>
  );
}
