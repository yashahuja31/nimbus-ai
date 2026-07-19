"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, MessageSquare, History, Server, Cloud } from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/history", label: "History", icon: History },
  { href: "/accounts", label: "Accounts", icon: Server },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-line glass sticky top-0 z-20">
      <div className="mx-auto max-w-5xl px-6 py-3.5 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-pulse/15 text-pulse">
            <Cloud className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="text-ink font-display font-semibold tracking-tight hidden sm:inline">Nimbus</span>
        </Link>
        <div className="flex items-center gap-1 text-sm overflow-x-auto">
          {LINKS.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors relative shrink-0",
                  active ? "text-ink" : "text-dim hover:text-ink"
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="hidden sm:inline">{link.label}</span>
                {active && (
                  <span className="absolute inset-0 -z-10 rounded-md bg-pulse/10 ring-1 ring-pulse/25" />
                )}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <CommandPalette />
          <div className="pl-3 border-l border-line">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  );
}
