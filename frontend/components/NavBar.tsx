"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { clearToken } from "@/lib/api";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Chat" },
  { href: "/history", label: "History" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="border-b border-line bg-panel/60 backdrop-blur">
      <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-baseline gap-2">
          <span className="text-signal font-semibold tracking-tight">Nimbus AI</span>
          <span className="text-xs text-dim">Your AI Cloud Engineer</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "hover:text-signal transition-colors",
                pathname === link.href ? "text-signal" : "text-dim"
              )}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              clearToken();
              router.push("/login");
            }}
            className="text-dim hover:text-danger transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
