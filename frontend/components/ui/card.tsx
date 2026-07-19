import { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({
  className,
  interactive,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-line bg-panel transition-all duration-200",
        interactive && "hover:border-pulse/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_rgba(108,140,255,0.35)]",
        className
      )}
      {...props}
    />
  );
}
