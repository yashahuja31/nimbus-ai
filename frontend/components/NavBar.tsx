"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { UserButton } from "@clerk/nextjs";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Chat" },
  { href: "/history", label: "History" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-line glass sticky top-0 z-10">
      <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="text-ink font-display font-semibold tracking-tight">Nimbus AI</span>
          <span className="text-xs text-dim hidden sm:inline">Your AI Cloud Engineer</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "hover:text-pulse transition-colors",
                pathname === link.href ? "text-pulse" : "text-dim"
              )}
            >
              {link.label}
            </Link>
          ))}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}
