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
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        variant === "primary" && "bg-signal text-base hover:bg-signal/90",
        variant === "ghost" && "border border-line text-ink hover:bg-panel",
        variant === "danger" && "bg-danger/90 text-base hover:bg-danger",
        className
      )}
      {...props}
    />
  );
}
