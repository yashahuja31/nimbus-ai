import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "group relative inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] overflow-hidden",
        variant === "primary" && "bg-pulse text-base hover:shadow-glow hover:brightness-110",
        variant === "ghost" && "border border-line text-ink hover:bg-panel hover:border-pulse/40",
        variant === "danger" && "bg-coral/90 text-base hover:bg-coral",
        className
      )}
      {...props}
    >
      {variant === "primary" && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      )}
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  );
}
