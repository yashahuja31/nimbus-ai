"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  History,
  Server,
  LogOut,
  Search,
  CornerDownLeft,
} from "lucide-react";

type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  run: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const commands: Command[] = useMemo(
    () => [
      { id: "dashboard", label: "Go to Dashboard", icon: LayoutDashboard, run: () => router.push("/dashboard") },
      { id: "chat", label: "Go to Chat", hint: "New request", icon: MessageSquare, run: () => router.push("/chat") },
      { id: "history", label: "Go to History", icon: History, run: () => router.push("/history") },
      { id: "accounts", label: "Manage cloud accounts", icon: Server, run: () => router.push("/accounts") },
      { id: "signout", label: "Sign out", icon: LogOut, run: () => signOut(() => router.push("/")) },
    ],
    [router, signOut]
  );

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  function execute(cmd: Command) {
    cmd.run();
    setOpen(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && filtered[selected]) {
      execute(filtered[selected]);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-xs text-dim hover:text-ink hover:border-pulse/40 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search</span>
        <kbd className="ml-1 rounded border border-line px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-base/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-28 z-50 w-full max-w-lg -translate-x-1/2 px-4"
            >
              <div className="rounded-xl border border-line bg-panel glass shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
                  <Search className="h-4 w-4 text-dim shrink-0" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onInputKeyDown}
                    placeholder="Type a command or search…"
                    className="w-full bg-transparent text-sm text-ink placeholder:text-dim focus:outline-none"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto py-2">
                  {filtered.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-dim">No matching commands</p>
                  )}
                  {filtered.map((cmd, i) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => execute(cmd)}
                        onMouseEnter={() => setSelected(i)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                          i === selected ? "bg-pulse/10 text-ink" : "text-dim hover:text-ink"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                        <span className="flex-1">{cmd.label}</span>
                        {cmd.hint && <span className="text-xs text-dim">{cmd.hint}</span>}
                        {i === selected && <CornerDownLeft className="h-3.5 w-3.5 text-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
