import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]",
        variant === "primary" && "bg-pulse text-base hover:shadow-glow hover:brightness-110",
        variant === "ghost" && "border border-line text-ink hover:bg-panel hover:border-pulse/40",
        variant === "danger" && "bg-coral/90 text-base hover:bg-coral",
        className
      )}
      {...props}
    />
  );
}
